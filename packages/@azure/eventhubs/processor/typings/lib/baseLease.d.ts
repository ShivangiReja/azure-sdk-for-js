/**
 * Describes the basic information required in a lease.
 */
export interface BaseLeaseInfo {
    /**
     * @property {string} partitionId The associated partitionId for which the lease is held.
     */
    partitionId: string;
    /**
     * @property {string} owner The host owner for the partition.
     */
    owner: string;
}
/**
 * Describes the base lease.
 */
export declare class BaseLease implements BaseLeaseInfo {
    /**
     * @property {string} partitionId The associated partitionId for which the lease is held.
     * @readonly
     */
    readonly partitionId: string;
    /**
     * @property {string} owner The host owner for the partition.
     */
    owner: string;
    /**
     * @property {boolean} isOwned Indicates wether the lease is owned. `true` if it is owned by
     * someone; `false` otherwise.
     */
    isOwned: boolean;
    /**
     * @constructor
     * @param info The information required to create a base lease.
     */
    constructor(info: BaseLeaseInfo);
    /**
     * Compares possibleOwner against this.owner
     * @param {string} possibleOwner The owner name to check.
     * @returns {boolean} boolean - true if possibleOwner is the same as this.owner, false otherwise.
     */
    isOwnedBy(possibleOwner: string): boolean;
    /**
     * Gets the lease information.
     * @returns {CompleteLeaseInfo} CompleteLeaseInfo.
     */
    getInfo(): BaseLeaseInfo;
}
//# sourceMappingURL=baseLease.d.ts.map