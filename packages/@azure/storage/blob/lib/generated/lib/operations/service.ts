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
import * as Models from "../models";
import * as Mappers from "../models/serviceMappers";
import * as Parameters from "../models/parameters";
import { StorageClientContext } from "../storageClientContext";

/** Class representing a Service. */
export class Service {
  private readonly client: StorageClientContext;

  /**
   * Create a Service.
   * @param {StorageClientContext} client Reference to the service client.
   */
  constructor(client: StorageClientContext) {
    this.client = client;
  }

  /**
   * Sets properties for a storage account's Blob service endpoint, including properties for Storage
   * Analytics and CORS (Cross-Origin Resource Sharing) rules
   * @param storageServiceProperties The StorageService properties.
   * @param [options] The optional parameters
   * @returns Promise<Models.ServiceSetPropertiesResponse>
   */
  setProperties(storageServiceProperties: Models.StorageServiceProperties, options?: Models.ServiceSetPropertiesOptionalParams): Promise<Models.ServiceSetPropertiesResponse>;
  /**
   * @param storageServiceProperties The StorageService properties.
   * @param callback The callback
   */
  setProperties(storageServiceProperties: Models.StorageServiceProperties, callback: msRest.ServiceCallback<void>): void;
  /**
   * @param storageServiceProperties The StorageService properties.
   * @param options The optional parameters
   * @param callback The callback
   */
  setProperties(storageServiceProperties: Models.StorageServiceProperties, options: Models.ServiceSetPropertiesOptionalParams, callback: msRest.ServiceCallback<void>): void;
  setProperties(storageServiceProperties: Models.StorageServiceProperties, options?: Models.ServiceSetPropertiesOptionalParams | msRest.ServiceCallback<void>, callback?: msRest.ServiceCallback<void>): Promise<Models.ServiceSetPropertiesResponse> {
    return this.client.sendOperationRequest(
      {
        storageServiceProperties,
        options
      },
      setPropertiesOperationSpec,
      callback) as Promise<Models.ServiceSetPropertiesResponse>;
  }

  /**
   * gets the properties of a storage account's Blob service, including properties for Storage
   * Analytics and CORS (Cross-Origin Resource Sharing) rules.
   * @param [options] The optional parameters
   * @returns Promise<Models.ServiceGetPropertiesResponse>
   */
  getProperties(options?: Models.ServiceGetPropertiesOptionalParams): Promise<Models.ServiceGetPropertiesResponse>;
  /**
   * @param callback The callback
   */
  getProperties(callback: msRest.ServiceCallback<Models.StorageServiceProperties>): void;
  /**
   * @param options The optional parameters
   * @param callback The callback
   */
  getProperties(options: Models.ServiceGetPropertiesOptionalParams, callback: msRest.ServiceCallback<Models.StorageServiceProperties>): void;
  getProperties(options?: Models.ServiceGetPropertiesOptionalParams | msRest.ServiceCallback<Models.StorageServiceProperties>, callback?: msRest.ServiceCallback<Models.StorageServiceProperties>): Promise<Models.ServiceGetPropertiesResponse> {
    return this.client.sendOperationRequest(
      {
        options
      },
      getPropertiesOperationSpec,
      callback) as Promise<Models.ServiceGetPropertiesResponse>;
  }

  /**
   * Retrieves statistics related to replication for the Blob service. It is only available on the
   * secondary location endpoint when read-access geo-redundant replication is enabled for the
   * storage account.
   * @param [options] The optional parameters
   * @returns Promise<Models.ServiceGetStatisticsResponse>
   */
  getStatistics(options?: Models.ServiceGetStatisticsOptionalParams): Promise<Models.ServiceGetStatisticsResponse>;
  /**
   * @param callback The callback
   */
  getStatistics(callback: msRest.ServiceCallback<Models.StorageServiceStats>): void;
  /**
   * @param options The optional parameters
   * @param callback The callback
   */
  getStatistics(options: Models.ServiceGetStatisticsOptionalParams, callback: msRest.ServiceCallback<Models.StorageServiceStats>): void;
  getStatistics(options?: Models.ServiceGetStatisticsOptionalParams | msRest.ServiceCallback<Models.StorageServiceStats>, callback?: msRest.ServiceCallback<Models.StorageServiceStats>): Promise<Models.ServiceGetStatisticsResponse> {
    return this.client.sendOperationRequest(
      {
        options
      },
      getStatisticsOperationSpec,
      callback) as Promise<Models.ServiceGetStatisticsResponse>;
  }

  /**
   * The List Containers Segment operation returns a list of the containers under the specified
   * account
   * @param [options] The optional parameters
   * @returns Promise<Models.ServiceListContainersSegmentResponse>
   */
  listContainersSegment(options?: Models.ServiceListContainersSegmentOptionalParams): Promise<Models.ServiceListContainersSegmentResponse>;
  /**
   * @param callback The callback
   */
  listContainersSegment(callback: msRest.ServiceCallback<Models.ListContainersSegmentResponse>): void;
  /**
   * @param options The optional parameters
   * @param callback The callback
   */
  listContainersSegment(options: Models.ServiceListContainersSegmentOptionalParams, callback: msRest.ServiceCallback<Models.ListContainersSegmentResponse>): void;
  listContainersSegment(options?: Models.ServiceListContainersSegmentOptionalParams | msRest.ServiceCallback<Models.ListContainersSegmentResponse>, callback?: msRest.ServiceCallback<Models.ListContainersSegmentResponse>): Promise<Models.ServiceListContainersSegmentResponse> {
    return this.client.sendOperationRequest(
      {
        options
      },
      listContainersSegmentOperationSpec,
      callback) as Promise<Models.ServiceListContainersSegmentResponse>;
  }

  /**
   * Returns the sku name and account kind
   * @param [options] The optional parameters
   * @returns Promise<Models.ServiceGetAccountInfoResponse>
   */
  getAccountInfo(options?: msRest.RequestOptionsBase): Promise<Models.ServiceGetAccountInfoResponse>;
  /**
   * @param callback The callback
   */
  getAccountInfo(callback: msRest.ServiceCallback<void>): void;
  /**
   * @param options The optional parameters
   * @param callback The callback
   */
  getAccountInfo(options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<void>): void;
  getAccountInfo(options?: msRest.RequestOptionsBase | msRest.ServiceCallback<void>, callback?: msRest.ServiceCallback<void>): Promise<Models.ServiceGetAccountInfoResponse> {
    return this.client.sendOperationRequest(
      {
        options
      },
      getAccountInfoOperationSpec,
      callback) as Promise<Models.ServiceGetAccountInfoResponse>;
  }
}

// Operation Specifications
const serializer = new msRest.Serializer(Mappers, true);
const setPropertiesOperationSpec: msRest.OperationSpec = {
  httpMethod: "PUT",
  urlParameters: [
    Parameters.url
  ],
  queryParameters: [
    Parameters.timeout,
    Parameters.restype0,
    Parameters.comp0
  ],
  headerParameters: [
    Parameters.version,
    Parameters.requestId
  ],
  requestBody: {
    parameterPath: "storageServiceProperties",
    mapper: {
      ...Mappers.StorageServiceProperties,
      required: true
    }
  },
  contentType: "application/xml; charset=utf-8",
  responses: {
    202: {
      headersMapper: Mappers.ServiceSetPropertiesHeaders
    },
    default: {
      bodyMapper: Mappers.StorageError
    }
  },
  isXML: true,
  serializer
};

const getPropertiesOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  urlParameters: [
    Parameters.url
  ],
  queryParameters: [
    Parameters.timeout,
    Parameters.restype0,
    Parameters.comp0
  ],
  headerParameters: [
    Parameters.version,
    Parameters.requestId
  ],
  responses: {
    200: {
      bodyMapper: Mappers.StorageServiceProperties,
      headersMapper: Mappers.ServiceGetPropertiesHeaders
    },
    default: {
      bodyMapper: Mappers.StorageError
    }
  },
  isXML: true,
  serializer
};

const getStatisticsOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  urlParameters: [
    Parameters.url
  ],
  queryParameters: [
    Parameters.timeout,
    Parameters.restype0,
    Parameters.comp1
  ],
  headerParameters: [
    Parameters.version,
    Parameters.requestId
  ],
  responses: {
    200: {
      bodyMapper: Mappers.StorageServiceStats,
      headersMapper: Mappers.ServiceGetStatisticsHeaders
    },
    default: {
      bodyMapper: Mappers.StorageError
    }
  },
  isXML: true,
  serializer
};

const listContainersSegmentOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  urlParameters: [
    Parameters.url
  ],
  queryParameters: [
    Parameters.prefix,
    Parameters.marker,
    Parameters.maxresults,
    Parameters.include0,
    Parameters.timeout,
    Parameters.comp2
  ],
  headerParameters: [
    Parameters.version,
    Parameters.requestId
  ],
  responses: {
    200: {
      bodyMapper: Mappers.ListContainersSegmentResponse,
      headersMapper: Mappers.ServiceListContainersSegmentHeaders
    },
    default: {
      bodyMapper: Mappers.StorageError
    }
  },
  isXML: true,
  serializer
};

const getAccountInfoOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  urlParameters: [
    Parameters.url
  ],
  queryParameters: [
    Parameters.restype1,
    Parameters.comp0
  ],
  headerParameters: [
    Parameters.version
  ],
  responses: {
    200: {
      headersMapper: Mappers.ServiceGetAccountInfoHeaders
    },
    default: {
      bodyMapper: Mappers.StorageError
    }
  },
  isXML: true,
  serializer
};
