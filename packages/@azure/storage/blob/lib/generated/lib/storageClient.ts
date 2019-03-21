/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for
 * license information.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */

import * as msRest from "@azure/ms-rest-js";
import * as Models from "./models";
import * as Mappers from "./models/mappers";
import * as operations from "./operations";
import { StorageClientContext } from "./storageClientContext";

class StorageClient extends StorageClientContext {
  // Operation groups
  service: operations.Service;
  container: operations.Container;
  blob: operations.Blob;
  pageBlob: operations.PageBlob;
  appendBlob: operations.AppendBlob;
  blockBlob: operations.BlockBlob;

  /**
   * Initializes a new instance of the StorageClient class.
   * @param url The URL of the service account, container, or blob that is the targe of the desired
   * operation.
   * @param [options] The parameter options
   */
  constructor(url: string, options?: msRest.ServiceClientOptions) {
    super(url, options);
    this.service = new operations.Service(this);
    this.container = new operations.Container(this);
    this.blob = new operations.Blob(this);
    this.pageBlob = new operations.PageBlob(this);
    this.appendBlob = new operations.AppendBlob(this);
    this.blockBlob = new operations.BlockBlob(this);
  }
}

// Operation Specifications

export {
  StorageClient,
  StorageClientContext,
  Models as StorageModels,
  Mappers as StorageMappers
};
export * from "./operations";
