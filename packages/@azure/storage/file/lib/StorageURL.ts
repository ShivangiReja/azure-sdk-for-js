import { deserializationPolicy, RequestPolicyFactory } from "@azure/ms-rest-js";

import { BrowserPolicyFactory } from "./BrowserPolicyFactory";
import { Credential } from "./credentials/Credential";
import { StorageClientContext } from "./generated/lib/storageClientContext";
import { LoggingPolicyFactory } from "./LoggingPolicyFactory";
import { IHttpClient, IHttpPipelineLogger, Pipeline } from "./Pipeline";
import { IRetryOptions, RetryPolicyFactory } from "./RetryPolicyFactory";
import {
  ITelemetryOptions,
  TelemetryPolicyFactory
} from "./TelemetryPolicyFactory";
import { UniqueRequestIDPolicyFactory } from "./UniqueRequestIDPolicyFactory";
import { escapeURLPath } from "./utils/utils.common";

export { deserializationPolicy };

/**
 * Option interface for Pipeline.newPipeline method.
 *
 * @export
 * @interface INewPipelineOptions
 */
export interface INewPipelineOptions {
  /**
   * Telemetry configures the built-in telemetry policy behavior.
   *
   * @type {ITelemetryOptions}
   * @memberof INewPipelineOptions
   */
  telemetry?: ITelemetryOptions;
  retryOptions?: IRetryOptions;

  logger?: IHttpPipelineLogger;
  httpClient?: IHttpClient;
}

/**
 * A ServiceURL represents a based URL class for ServiceURL, ContainerURL and etc.
 *
 * @export
 * @class StorageURL
 */
export abstract class StorageURL {
  /**
   * A static method used to create a new Pipeline object with Credential provided.
   *
   * @static
   * @param {Credential} credential Such as AnonymousCredential, SharedKeyCredential.
   * @param {INewPipelineOptions} [pipelineOptions] Optional. Options.
   * @returns {Pipeline} A new Pipeline object.
   * @memberof Pipeline
   */
  public static newPipeline(
    credential: Credential,
    pipelineOptions: INewPipelineOptions = {}
  ): Pipeline {
    // Order is important. Closer to the API at the top & closer to the network at the bottom.
    // The credential's policy factory must appear close to the wire so it can sign any
    // changes made by other factories (like UniqueRequestIDPolicyFactory)
    const factories: RequestPolicyFactory[] = [
      new TelemetryPolicyFactory(pipelineOptions.telemetry),
      new UniqueRequestIDPolicyFactory(),
      new BrowserPolicyFactory(),
      deserializationPolicy(), // Default deserializationPolicy is provided by protocol layer
      new RetryPolicyFactory(pipelineOptions.retryOptions),
      new LoggingPolicyFactory(),
      credential
    ];

    return new Pipeline(factories, {
      HTTPClient: pipelineOptions.httpClient,
      logger: pipelineOptions.logger
    });
  }

  /**
   * Request policy pipeline.
   *
   * @internal
   * @type {Pipeline}
   * @memberof StorageURL
   */
  public readonly pipeline: Pipeline;

  /**
   * URL string value.
   *
   * @type {string}
   * @memberof StorageURL
   */
  public readonly url: string;

  /**
   * StorageClient is a reference to protocol layer operations entry, which is
   * generated by AutoRest generator.
   *
   * @protected
   * @type {StorageClient}
   * @memberof StorageURL
   */
  protected readonly storageClientContext: StorageClientContext;

  /**
   * Creates an instance of StorageURL.
   * @param {string} url
   * @param {Pipeline} pipeline
   * @memberof StorageURL
   */
  protected constructor(url: string, pipeline: Pipeline) {
    // URL should be encoded and only once, protocol layer shouldn't encode URL again
    this.url = escapeURLPath(url);

    this.pipeline = pipeline;
    this.storageClientContext = new StorageClientContext(
      this.url,
      pipeline.toServiceClientOptions()
    );

    // Remove the default content-type in generated code of StorageClientContext
    const storageClientContext = this.storageClientContext as any;
    if (storageClientContext.requestContentType) {
      storageClientContext.requestContentType = undefined;
    }
  }
}
