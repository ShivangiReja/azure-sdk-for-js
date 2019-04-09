import { BaseLease, BaseLeaseInfo } from "./baseLease";
/**
 * Describes the properties of a Complete Lease.
 * @interface CompleteLeaseInfo
 */
export interface CompleteLeaseInfo extends BaseLeaseInfo {
    /**
     * @property {number} epoch The epoch(time) of the lease, which is a value you can use to
     * determine the most recent owner of a partition between competing nodes.
     */
    epoch: number;
}
/**
 * Describes a Complete Lease.
 * @class CompleteLease.
 */
export declare class CompleteLease extends BaseLease {
    /**
     * @property {number} epoch The epoch(time) of the lease, which is a value you can use to
     * determine the most recent owner of a partition between competing nodes.
     */
    epoch: number;
    /**
     * Creates an instance of the Lease.
     * @constructor
     * @param {CompleteLeaseInfo} info The Lease info.
     */
    constructor(info: CompleteLeaseInfo);
    /**
     * Increments the value of epoch by 1.
     * @returns {number} The incremented value of the epoch.
     */
    incrementEpoch(): number;
    /**
     * Gets the lease information.
     * @returns {CompleteLeaseInfo} CompleteLeaseInfo.
     */
    getInfo(): CompleteLeaseInfo;
}
//# sourceMappingURL=completeLease.d.ts.map