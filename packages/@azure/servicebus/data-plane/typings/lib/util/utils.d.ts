/// <reference types="node" />
/**
 * A constant that indicates whether the environment is node.js or browser based.
 */
export declare const isNode: boolean;
/**
 * If you try to turn a Guid into a Buffer in .NET, the bytes of the first three groups get
 * flipped within the group, but the last two groups don't get flipped, so we end up with a
 * different byte order. This is the order of bytes needed to make Service Bus recognize the token.
 *
 * @param lockToken The lock token whose bytes need to be reorded.
 * @returns Buffer - Buffer representing reordered bytes.
 */
export declare function reorderLockToken(lockTokenBytes: Buffer): Buffer;
//# sourceMappingURL=utils.d.ts.map