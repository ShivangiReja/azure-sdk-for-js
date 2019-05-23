  // Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { EventPosition } from "../eventPosition";
import { translate, Constants, ErrorNameConditionMapper } from "@azure/amqp-common";


  /**
   * @internal
   * Gets the expression (filter clause) that needs to be set on the source.
   * @return {string} filterExpression
   */
  export function getExpression(eventPosition: EventPosition): string {
    let result;
    // order of preference
    if (eventPosition.offset != undefined) {
      result = eventPosition.isInclusive
        ? `${Constants.offsetAnnotation} >= '${eventPosition.offset}'`
        : `${Constants.offsetAnnotation} > '${eventPosition.offset}'`;
    } else if (eventPosition.sequenceNumber != undefined) {
      result = eventPosition.isInclusive
        ? `${Constants.sequenceNumberAnnotation} >= '${eventPosition.sequenceNumber}'`
        : `${Constants.sequenceNumberAnnotation} > '${eventPosition.sequenceNumber}'`;
    } else if (eventPosition.enqueuedTime != undefined) {
      const time = eventPosition.enqueuedTime instanceof Date ? eventPosition.enqueuedTime.getTime() : eventPosition.enqueuedTime;
      result = `${Constants.enqueuedTimeAnnotation} > '${time}'`;
    }

    if (!result) {
      throw translate({
        condition: ErrorNameConditionMapper.ArgumentError,
        description: "No starting position was set in the EventPosition."
      });
    }
    return result;
  }
