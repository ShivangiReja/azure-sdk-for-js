// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
  PartitionManager,
  PartitionProcessorFactory,
  PartitionOwnership,
  EventProcessorOptions
} from "./eventProcessor";
import { PartitionContext } from "./partitionContext";
import { CheckpointManager } from "./checkpointManager";
import { PumpManager } from "./pumpManager";
import { EventHubClient } from "./eventHubClient";
import { EventPosition } from "./eventPosition";
import { AbortSignalLike } from "@azure/abort-controller";
import { delay } from "@azure/core-amqp";
import * as log from "./log";

/**
 *This class is responsible for balancing the load of processing events from all partitions of an Event Hub by
 * distributing the number of partitions uniformly among all the active EventProcessors.
 *
 * This load balancer will retrieve partition ownership details from the PartitionManager to find the number of
 * active EventProcessor. It uses the last modified time to decide if an EventProcessor is active. If a
 * partition ownership entry has not be updated for a specified duration of time, the owner of that partition is
 * considered inactive and the partition is available for other EventProcessors to own.
 * @class EventProcessorHost
 */
export class PartitionLoadBalancer {
  private _consumerGroupName: string;
  private _eventHubClient: EventHubClient;
  private _partitionProcessorFactory: PartitionProcessorFactory;
  private _ownerId: string;
  private _inactiveTimeLimitInMS: number;
  private _pumpManager: PumpManager;
  private _partitionManager: PartitionManager;
  private _processorOptions: EventProcessorOptions;

  /**
   * Creates an instance of PartitionBasedLoadBalancer for the given Event Hub name and consumer group.
   *
   * @param partitionManager The partition manager that this load balancer will use to read/update ownership details.
   * @param eventHubClient The Event Hub client used to consume events.
   * @param consumerGroupName The consumer group name.
   * @param ownerId The identifier of the Event Processor that owns this load balancer.
   * @param inactiveTimeLimitInMS The time to wait for an update on an ownership record before
   * assuming the owner of the partition is inactive.
   * @param partitionProcessorFactory The factory to create new partition processor(s).
   * @param partitionPumpManager The partition pump manager that keeps track of all the partitions
   * that this EventProcessor is processing.
   * @param options Optional parameters for creating a PartitionLoadBalancer.
   * */
  constructor(
    partitionManager: PartitionManager,
    eventHubClient: EventHubClient,
    consumerGroupName: string,
    ownerId: string,
    inactiveTimeLimitInMS: number,
    partitionProcessorFactory: PartitionProcessorFactory,
    pumpManager: PumpManager,
    options?: EventProcessorOptions
  ) {
    if (!options) options = {};

    this._partitionManager = partitionManager;
    this._eventHubClient = eventHubClient;
    this._consumerGroupName = consumerGroupName;
    this._ownerId = ownerId;
    this._partitionProcessorFactory = partitionProcessorFactory;
    this._pumpManager = pumpManager;
    this._inactiveTimeLimitInMS = inactiveTimeLimitInMS;
    this._processorOptions = options;
  }

  /*
   * Find the event processor that owns the maximum number of partitions and steal a random partition
   * from it.
   */
  private _findPartitionToSteal(ownerPartitionMap: Map<string, PartitionOwnership[]>): string {
    let maxList: PartitionOwnership[] = [];
    let maxPartitionsOwnedByAnyEventProcessor = Number.MIN_VALUE;
    for (const ownershipList of ownerPartitionMap.values()) {
      if (ownershipList.length > maxPartitionsOwnedByAnyEventProcessor) {
        maxPartitionsOwnedByAnyEventProcessor = ownershipList.length;
        maxList = ownershipList;
      }
    }
    return maxList[Math.floor(Math.random() * maxList.length)].partitionId;
  }

  private _createPartitionOwnershipRequest(
    partitionOwnershipMap: Map<string, PartitionOwnership>,
    partitionIdToClaim: string
  ): PartitionOwnership {
    const previousPartitionOwnership = partitionOwnershipMap.get(partitionIdToClaim);
    const partitionOwnership: PartitionOwnership = {
      ownerId: this._ownerId,
      partitionId: partitionIdToClaim,
      consumerGroupName: this._consumerGroupName,
      eventHubName: this._eventHubClient.eventHubName,
      sequenceNumber: previousPartitionOwnership
        ? previousPartitionOwnership.sequenceNumber
        : undefined,
      offset: previousPartitionOwnership ? previousPartitionOwnership.offset : undefined,
      eTag: previousPartitionOwnership ? previousPartitionOwnership.eTag : undefined,
      ownerLevel: 0
    };

    return partitionOwnership;
  }

  /*
   * Claim ownership of the given partition if it's available
   */
  private async _claimOwnership(
    partitionOwnershipMap: Map<string, PartitionOwnership>,
    partitionIdToClaim: string
  ): Promise<void> {
    const ownershipRequest = this._createPartitionOwnershipRequest(
      partitionOwnershipMap,
      partitionIdToClaim
    );
    try {
      await this._partitionManager.claimOwnership([ownershipRequest]);
      const partitionContext: PartitionContext = {
        consumerGroupName: this._consumerGroupName,
        eventHubName: this._eventHubClient.eventHubName,
        partitionId: ownershipRequest.partitionId
      };

      const checkpointManager = new CheckpointManager(
        partitionContext,
        this._partitionManager,
        this._ownerId
      );

      log.eventProcessor(
        `[${this._ownerId}] [${partitionIdToClaim}] Calling user-provided PartitionProcessorFactory.`
      );
      const partitionProcessor = this._partitionProcessorFactory(
        partitionContext,
        checkpointManager
      );

      const eventPosition = ownershipRequest.sequenceNumber
        ? EventPosition.fromSequenceNumber(ownershipRequest.sequenceNumber)
        : this._processorOptions.initialEventPosition || EventPosition.earliest();

      await this._pumpManager.createPump(
        this._eventHubClient,
        partitionContext,
        eventPosition,
        partitionProcessor
      );
      log.eventProcessor(`[${this._ownerId}] PartitionPump created successfully.`);
    } catch (err) {
      log.error(
        `[${this._ownerId}] Failed to claim ownership of partition ${ownershipRequest.partitionId}`
      );
    }
  }

  /*
   * This method is called after determining that the load is not balanced. This method will evaluate
   * if the current event processor should own more partitions. Specifically, this method returns true if the
   * current event processor owns less than the minimum number of partitions or if it owns the minimum number
   * and no other event processor owns lesser number of partitions than this event processor.
   */
  private _shouldOwnMorePartitions(
    minPartitionsPerEventProcessor: number,
    ownerPartitionMap: Map<string, PartitionOwnership[]>
  ): boolean {
    let numberOfPartitionsOwned = 0;
    const ownershipList = ownerPartitionMap.get(this._ownerId);
    if (ownershipList) {
      numberOfPartitionsOwned = ownershipList.length;
    }
    let leastPartitionsOwnedByAnyEventProcessor = Number.MAX_VALUE;
    for (const ownershipList of ownerPartitionMap.values()) {
      if (ownershipList.length < leastPartitionsOwnedByAnyEventProcessor) {
        leastPartitionsOwnedByAnyEventProcessor = ownershipList.length;
      }
    }
    if (
      numberOfPartitionsOwned > minPartitionsPerEventProcessor ||
      numberOfPartitionsOwned > leastPartitionsOwnedByAnyEventProcessor
    ) {
      return false;
    }

    return true;
  }

  /*
   * When the load is balanced, all active event processors own at least minPartitionsPerEventProcessor
   * and only numberOfEventProcessorsWithAdditionalPartition event processors will own 1 additional
   * partition.
   */
  private _isLoadBalanced(
    minPartitionsPerEventProcessor: number,
    numberOfEventProcessorsWithAdditionalPartition: number,
    ownerPartitionMap: Map<string, PartitionOwnership[]>
  ): boolean {
    let matchCount = 0;
    for (const ownershipList of ownerPartitionMap.values()) {
      if (
        ownershipList.length > minPartitionsPerEventProcessor ||
        ownershipList.length < minPartitionsPerEventProcessor + 1
      ) {
        matchCount++;
      }
    }
    if (matchCount === ownerPartitionMap.size) {
      let count = 0;
      for (const ownershipList of ownerPartitionMap.values()) {
        if (ownershipList.length === minPartitionsPerEventProcessor + 1) {
          count++;
        }
      }
      return count === numberOfEventProcessorsWithAdditionalPartition;
    }
    return false;
  }

  /*
   * This method will create a new map of partition id and PartitionOwnership containing only those partitions
   * that are actively owned. All entries in the original map returned by PartitionManager that haven't been
   * modified for a duration of time greater than the allowed inactivity time limit are assumed to be owned by
   * dead event processors. These will not be included in the map returned by this method.
   */
  private _removeInactivePartitionOwnerships(
    partitionOwnershipMap: Map<string, PartitionOwnership>
  ): Map<string, PartitionOwnership> {
    const activePartitionOwnershipMap: Map<string, PartitionOwnership> = new Map();
    partitionOwnershipMap.forEach((value: PartitionOwnership, key: string) => {
      var date = new Date();
      var currentTimeInMS = date.getMilliseconds();
      if (
        value.lastModifiedTimeInMS &&
        currentTimeInMS - value.lastModifiedTimeInMS < this._inactiveTimeLimitInMS
      ) {
        activePartitionOwnershipMap.set(key, value);
      }
    });

    return activePartitionOwnershipMap;
  }

  /*
   * This method works with the given partition ownership details and Event Hub partitions to evaluate whether the
   * current Event Processor should take on the responsibility of processing more partitions.
   */
  private async _loadBalance(
    partitionOwnershipMap: Map<string, PartitionOwnership>,
    partitionIds: string[]
  ): Promise<void> {
    /*
     * Remove all partitions ownership that have not been modified within the configured period. This means that the previous
     * event processor that owned the partition is probably down and the partition is now eligible to be
     * claimed by other event processors.
     */
    const activePartitionOwnershipMap = this._removeInactivePartitionOwnerships(
      partitionOwnershipMap
    );
    if (Object.keys(activePartitionOwnershipMap).length === 0) {
      // If the active partition ownership map is empty, this is the first time an event processor is
      // running or all Event Processors are down for this Event Hub, consumer group combination. All
      // partitions in this Event Hub are available to claim. Choose a random partition to claim ownership.
      await this._claimOwnership(
        partitionOwnershipMap,
        partitionIds[Math.floor(Math.random() * partitionIds.length)]
      );
      return;
    }

    // Create a map of owner id and a list of partitions it owns

    const ownerPartitionMap: Map<string, PartitionOwnership[]> = new Map();
    for (const activePartitionOwnership of activePartitionOwnershipMap.values()) {
      if (!ownerPartitionMap.has(activePartitionOwnership.ownerId)) {
        const partitionOwnershipArr = [];
        partitionOwnershipArr.push(activePartitionOwnership);
        ownerPartitionMap.set(activePartitionOwnership.ownerId, partitionOwnershipArr!);
      } else {
        const partitionOwnershipArr = ownerPartitionMap.get(activePartitionOwnership.ownerId);
        partitionOwnershipArr!.push(activePartitionOwnership);
        ownerPartitionMap.set(activePartitionOwnership.ownerId, partitionOwnershipArr!);
      }
    }
    // add the current event processor to the map if it doesn't exist
    if (!ownerPartitionMap.has(this._ownerId)) {
      ownerPartitionMap.set(this._ownerId, []);
    }

    // Find the minimum number of partitions every event processor should own when the load is
    // evenly distributed.
    const minPartitionsPerEventProcessor = partitionIds.length / ownerPartitionMap.size;
    // If the number of partitions in Event Hub is not evenly divisible by number of active event processors,
    // a few Event Processors may own 1 additional partition than the minimum when the load is balanced. Calculate
    // the number of event processors that can own additional partition.
    const numberOfEventProcessorsWithAdditionalPartition =
      partitionIds.length % ownerPartitionMap.size;

    if (
      this._isLoadBalanced(
        minPartitionsPerEventProcessor,
        numberOfEventProcessorsWithAdditionalPartition,
        ownerPartitionMap
      )
    ) {
      // If the partitions are evenly distributed among all active event processors, no change required.
      return;
    }

    if (!this._shouldOwnMorePartitions(minPartitionsPerEventProcessor, ownerPartitionMap)) {
      // This event processor already has enough partitions and shouldn't own more yet
      return;
    }
    // If we have reached this stage, this event processor has to claim/steal ownership of at least 1 more partition

    //   If some partitions are unclaimed, this could be because an event processor is down and
    //  it's partitions are now available for others to own or because event processors are just
    //  starting up and gradually claiming partitions to own or new partitions were added to Event Hub.
    //  Find any partition that is not actively owned and claim it.

    //   OR

    //  Find a partition to steal from another event processor. Pick the event processor that owns the highest
    //  number of partitions.

    let partitionToClaim: string | undefined;
    for (const partitionId of partitionIds) {
      if (!activePartitionOwnershipMap.has(partitionId)) {
        partitionToClaim = partitionId;
      }
    }
    if (!partitionToClaim) {
      partitionToClaim = this._findPartitionToSteal(ownerPartitionMap);
    }

    return await this._claimOwnership(partitionOwnershipMap, partitionToClaim);
  }

  private async _getInactivePartitions(): Promise<string[]> {
    try {
      // get all partition ids on the event hub
      const partitionIds = await this._eventHubClient.getPartitionIds();
      // get partitions this EventProcessor is actively processing
      const activePartitionIds = this._pumpManager.receivingFromPartitions();

      // get a list of partition ids that are not being processed by this EventProcessor
      const inactivePartitionIds: string[] = partitionIds.filter(
        (id) => activePartitionIds.indexOf(id) === -1
      );
      return inactivePartitionIds;
    } catch (err) {
      log.error(`[${this._ownerId}] An error occured when retrieving partition ids: ${err}`);
      throw err;
    }
  }

  /**
   * This method is expected to be invoked by the EventProcessor. Every loop to this method will result in this EventProcessor owning at
   * most one new partition.
   *
   * The load is considered balanced when no active EventProcessor owns 2 partitions more than any other active
   * EventProcessor. Given that each invocation to this method results in ownership claim of at most one partition,
   * this algorithm converges gradually towards a steady state.
   *
   * When a new partition is claimed, this method is also responsible for starting a partition pump that creates an
   * EventHubConsumer for processing events from that partition.
   */

  async _runLoop(abortSignal: AbortSignalLike): Promise<void> {
    // periodically check if there is any partition not being processed and process it
    const waitIntervalInMs = 10000;
    while (!abortSignal.aborted) {
      try {
        // check if the loop has been cancelled
        if (abortSignal.aborted) {
          return;
        }

        const partitionOwnershipMap: Map<string, PartitionOwnership> = new Map();
        // Retrieve current partition ownership details from the datastore.
        const partitionOwnership = await this._partitionManager.listOwnership(
          this._eventHubClient.eventHubName,
          this._consumerGroupName
        );
        for (const ownership of partitionOwnership) {
          partitionOwnershipMap.set(ownership.partitionId, ownership);
        }
        // get a list of partition ids that are not being processed by this EventProcessor
        const partitionsToAdd = await this._getInactivePartitions();

        if (partitionsToAdd.length > 0) {
          await this._loadBalance(partitionOwnershipMap, partitionsToAdd);
        }

        // sleep
        log.eventProcessor(
          `[${this._ownerId}] Pausing the EventProcessor loop for ${waitIntervalInMs} ms.`
        );
        await delay(waitIntervalInMs, abortSignal);
      } catch (err) {
        log.error(`[${this._ownerId}] An error occured within the EventProcessor loop: ${err}`);
      }
    }
  }
}
