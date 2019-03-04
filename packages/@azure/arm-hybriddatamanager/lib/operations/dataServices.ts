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
import * as Mappers from "../models/dataServicesMappers";
import * as Parameters from "../models/parameters";
import { HybridDataManagementClientContext } from "../hybridDataManagementClientContext";

/** Class representing a DataServices. */
export class DataServices {
  private readonly client: HybridDataManagementClientContext;

  /**
   * Create a DataServices.
   * @param {HybridDataManagementClientContext} client Reference to the service client.
   */
  constructor(client: HybridDataManagementClientContext) {
    this.client = client;
  }

  /**
   * This method gets all the data services.
   * @param resourceGroupName The Resource Group Name
   * @param dataManagerName The name of the DataManager Resource within the specified resource group.
   * DataManager names must be between 3 and 24 characters in length and use any alphanumeric and
   * underscore only
   * @param [options] The optional parameters
   * @returns Promise<Models.DataServicesListByDataManagerResponse>
   */
  listByDataManager(resourceGroupName: string, dataManagerName: string, options?: msRest.RequestOptionsBase): Promise<Models.DataServicesListByDataManagerResponse>;
  /**
   * @param resourceGroupName The Resource Group Name
   * @param dataManagerName The name of the DataManager Resource within the specified resource group.
   * DataManager names must be between 3 and 24 characters in length and use any alphanumeric and
   * underscore only
   * @param callback The callback
   */
  listByDataManager(resourceGroupName: string, dataManagerName: string, callback: msRest.ServiceCallback<Models.DataServiceList>): void;
  /**
   * @param resourceGroupName The Resource Group Name
   * @param dataManagerName The name of the DataManager Resource within the specified resource group.
   * DataManager names must be between 3 and 24 characters in length and use any alphanumeric and
   * underscore only
   * @param options The optional parameters
   * @param callback The callback
   */
  listByDataManager(resourceGroupName: string, dataManagerName: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.DataServiceList>): void;
  listByDataManager(resourceGroupName: string, dataManagerName: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.DataServiceList>, callback?: msRest.ServiceCallback<Models.DataServiceList>): Promise<Models.DataServicesListByDataManagerResponse> {
    return this.client.sendOperationRequest(
      {
        resourceGroupName,
        dataManagerName,
        options
      },
      listByDataManagerOperationSpec,
      callback) as Promise<Models.DataServicesListByDataManagerResponse>;
  }

  /**
   * Gets the data service that match the data service name given.
   * @param dataServiceName The name of the data service that is being queried.
   * @param resourceGroupName The Resource Group Name
   * @param dataManagerName The name of the DataManager Resource within the specified resource group.
   * DataManager names must be between 3 and 24 characters in length and use any alphanumeric and
   * underscore only
   * @param [options] The optional parameters
   * @returns Promise<Models.DataServicesGetResponse>
   */
  get(dataServiceName: string, resourceGroupName: string, dataManagerName: string, options?: msRest.RequestOptionsBase): Promise<Models.DataServicesGetResponse>;
  /**
   * @param dataServiceName The name of the data service that is being queried.
   * @param resourceGroupName The Resource Group Name
   * @param dataManagerName The name of the DataManager Resource within the specified resource group.
   * DataManager names must be between 3 and 24 characters in length and use any alphanumeric and
   * underscore only
   * @param callback The callback
   */
  get(dataServiceName: string, resourceGroupName: string, dataManagerName: string, callback: msRest.ServiceCallback<Models.DataService>): void;
  /**
   * @param dataServiceName The name of the data service that is being queried.
   * @param resourceGroupName The Resource Group Name
   * @param dataManagerName The name of the DataManager Resource within the specified resource group.
   * DataManager names must be between 3 and 24 characters in length and use any alphanumeric and
   * underscore only
   * @param options The optional parameters
   * @param callback The callback
   */
  get(dataServiceName: string, resourceGroupName: string, dataManagerName: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.DataService>): void;
  get(dataServiceName: string, resourceGroupName: string, dataManagerName: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.DataService>, callback?: msRest.ServiceCallback<Models.DataService>): Promise<Models.DataServicesGetResponse> {
    return this.client.sendOperationRequest(
      {
        dataServiceName,
        resourceGroupName,
        dataManagerName,
        options
      },
      getOperationSpec,
      callback) as Promise<Models.DataServicesGetResponse>;
  }

  /**
   * This method gets all the data services.
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param [options] The optional parameters
   * @returns Promise<Models.DataServicesListByDataManagerNextResponse>
   */
  listByDataManagerNext(nextPageLink: string, options?: msRest.RequestOptionsBase): Promise<Models.DataServicesListByDataManagerNextResponse>;
  /**
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param callback The callback
   */
  listByDataManagerNext(nextPageLink: string, callback: msRest.ServiceCallback<Models.DataServiceList>): void;
  /**
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param options The optional parameters
   * @param callback The callback
   */
  listByDataManagerNext(nextPageLink: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.DataServiceList>): void;
  listByDataManagerNext(nextPageLink: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.DataServiceList>, callback?: msRest.ServiceCallback<Models.DataServiceList>): Promise<Models.DataServicesListByDataManagerNextResponse> {
    return this.client.sendOperationRequest(
      {
        nextPageLink,
        options
      },
      listByDataManagerNextOperationSpec,
      callback) as Promise<Models.DataServicesListByDataManagerNextResponse>;
  }
}

// Operation Specifications
const serializer = new msRest.Serializer(Mappers);
const listByDataManagerOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.HybridData/dataManagers/{dataManagerName}/dataServices",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.resourceGroupName,
    Parameters.dataManagerName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {
      bodyMapper: Mappers.DataServiceList
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};

const getOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.HybridData/dataManagers/{dataManagerName}/dataServices/{dataServiceName}",
  urlParameters: [
    Parameters.dataServiceName,
    Parameters.subscriptionId,
    Parameters.resourceGroupName,
    Parameters.dataManagerName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {
      bodyMapper: Mappers.DataService
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};

const listByDataManagerNextOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  baseUrl: "https://management.azure.com",
  path: "{nextLink}",
  urlParameters: [
    Parameters.nextPageLink
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {
      bodyMapper: Mappers.DataServiceList
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};
