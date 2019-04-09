/// <reference types="node" />
import { ConnectionContext } from "./connectionContext";
import { Sender, Receiver } from "rhea-promise";
export interface LinkEntityOptions {
    /**
     * @property {string} [name] The unique name for the entity. If not provided then a guid will be
     * assigned.
     */
    name?: string;
    /**
     * @property {string | number} [partitionId] The partitionId associated with the link entity.
     */
    partitionId?: string | number;
    /**
     * @property {string} address The link entity address in one of the following forms:
     */
    address?: string;
    /**
     * @property {string} audience The link entity token audience in one of the following forms:
     */
    audience?: string;
}
/**
 * Describes the base class for entities like EventHub Sender, Receiver and Management link.
 * @ignore
 * @class LinkEntity
 */
export declare class LinkEntity {
    /**
     * @property {string} [name] The unique name for the entity (mostly a guid).
     */
    name: string;
    /**
     * @property {string} address The link entity address in one of the following forms:
     *
     * **Sender**
     * - `"<hubName>"`
     * - `"<hubName>/Partitions/<partitionId>"`.
     *
     * **Receiver**
     * - `"<event-hub-name>/ConsumerGroups/<consumer-group-name>/Partitions/<partition-id>"`.
     *
     * **ManagementClient**
     * -`"$management"`.
     */
    address: string;
    /**
     * @property {string} audience The link entity token audience in one of the following forms:
     *
     * **Sender**
     * - `"sb://<yournamespace>.servicebus.windows.net/<hubName>"`
     * - `"sb://<yournamespace>.servicebus.windows.net/<hubName>/Partitions/<partitionId>"`.
     *
     * **Receiver**
     * - `"sb://<your-namespace>.servicebus.windows.net/<event-hub-name>/ConsumerGroups/<consumer-group-name>/Partitions/<partition-id>"`.
     *
     * **ManagementClient**
     * - `"sb://<your-namespace>.servicebus.windows.net/<event-hub-name>/$management"`.
     */
    audience: string;
    /**
     * @property {string | number} [partitionId] The partitionId associated with the link entity.
     */
    partitionId?: string | number;
    /**
     * @property {boolean} isConnecting Indicates whether the link is in the process of connecting
     * (establishing) itself. Default value: `false`.
     */
    isConnecting: boolean;
    /**
     * @property {ConnectionContext} _context Provides relevant information about the amqp connection,
     * cbs and $management sessions, token provider, sender and receivers.
     * @protected
     */
    protected _context: ConnectionContext;
    /**
     * @property {NodeJS.Timer} _tokenRenewalTimer The token renewal timer that keeps track of when
     * the Link Entity is due for token renewal.
     * @protected
     */
    protected _tokenRenewalTimer?: NodeJS.Timer;
    /**
     * Creates a new LinkEntity instance.
     * @ignore
     * @constructor
     * @param {ConnectionContext} context The connection context.
     * @param {LinkEntityOptions} [options] Options that can be provided while creating the LinkEntity.
     */
    constructor(context: ConnectionContext, options?: LinkEntityOptions);
    /**
     * Negotiates cbs claim for the LinkEntity.
     * @ignore
     * @protected
     * @param {boolean} [setTokenRenewal] Set the token renewal timer. Default false.
     * @return {Promise<void>} Promise<void>
     */
    protected _negotiateClaim(setTokenRenewal?: boolean): Promise<void>;
    /**
     * Ensures that the token is renewed within the predefined renewal margin.
     * @ignore
     * @protected
     * @returns {void}
     */
    protected _ensureTokenRenewal(): Promise<void>;
    /**
     * Closes the Sender|Receiver link and it's underlying session and also removes it from the
     * internal map.
     * @ignore
     * @param {Sender | Receiver} [link] The Sender or Receiver link that needs to be closed and
     * removed.
     */
    protected _closeLink(link?: Sender | Receiver): Promise<void>;
    /**
     * Provides the current type of the LinkEntity.
     * @return {string} The entity type.
     */
    private readonly _type;
}
//# sourceMappingURL=linkEntity.d.ts.map