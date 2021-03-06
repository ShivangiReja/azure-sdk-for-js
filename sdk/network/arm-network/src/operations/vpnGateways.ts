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
import * as msRestAzure from "@azure/ms-rest-azure-js";
import * as Models from "../models";
import * as Mappers from "../models/vpnGatewaysMappers";
import * as Parameters from "../models/parameters";
import { NetworkManagementClientContext } from "../networkManagementClientContext";

/** Class representing a VpnGateways. */
export class VpnGateways {
  private readonly client: NetworkManagementClientContext;

  /**
   * Create a VpnGateways.
   * @param {NetworkManagementClientContext} client Reference to the service client.
   */
  constructor(client: NetworkManagementClientContext) {
    this.client = client;
  }

  /**
   * Retrieves the details of a virtual wan vpn gateway.
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param [options] The optional parameters
   * @returns Promise<Models.VpnGatewaysGetResponse>
   */
  get(resourceGroupName: string, gatewayName: string, options?: msRest.RequestOptionsBase): Promise<Models.VpnGatewaysGetResponse>;
  /**
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param callback The callback
   */
  get(resourceGroupName: string, gatewayName: string, callback: msRest.ServiceCallback<Models.VpnGateway>): void;
  /**
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param options The optional parameters
   * @param callback The callback
   */
  get(resourceGroupName: string, gatewayName: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.VpnGateway>): void;
  get(resourceGroupName: string, gatewayName: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.VpnGateway>, callback?: msRest.ServiceCallback<Models.VpnGateway>): Promise<Models.VpnGatewaysGetResponse> {
    return this.client.sendOperationRequest(
      {
        resourceGroupName,
        gatewayName,
        options
      },
      getOperationSpec,
      callback) as Promise<Models.VpnGatewaysGetResponse>;
  }

  /**
   * Creates a virtual wan vpn gateway if it doesn't exist else updates the existing gateway.
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param vpnGatewayParameters Parameters supplied to create or Update a virtual wan vpn gateway.
   * @param [options] The optional parameters
   * @returns Promise<Models.VpnGatewaysCreateOrUpdateResponse>
   */
  createOrUpdate(resourceGroupName: string, gatewayName: string, vpnGatewayParameters: Models.VpnGateway, options?: msRest.RequestOptionsBase): Promise<Models.VpnGatewaysCreateOrUpdateResponse> {
    return this.beginCreateOrUpdate(resourceGroupName,gatewayName,vpnGatewayParameters,options)
      .then(lroPoller => lroPoller.pollUntilFinished()) as Promise<Models.VpnGatewaysCreateOrUpdateResponse>;
  }

  /**
   * Updates virtual wan vpn gateway tags.
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param vpnGatewayParameters Parameters supplied to update a virtual wan vpn gateway tags.
   * @param [options] The optional parameters
   * @returns Promise<Models.VpnGatewaysUpdateTagsResponse>
   */
  updateTags(resourceGroupName: string, gatewayName: string, vpnGatewayParameters: Models.TagsObject, options?: msRest.RequestOptionsBase): Promise<Models.VpnGatewaysUpdateTagsResponse>;
  /**
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param vpnGatewayParameters Parameters supplied to update a virtual wan vpn gateway tags.
   * @param callback The callback
   */
  updateTags(resourceGroupName: string, gatewayName: string, vpnGatewayParameters: Models.TagsObject, callback: msRest.ServiceCallback<Models.VpnGateway>): void;
  /**
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param vpnGatewayParameters Parameters supplied to update a virtual wan vpn gateway tags.
   * @param options The optional parameters
   * @param callback The callback
   */
  updateTags(resourceGroupName: string, gatewayName: string, vpnGatewayParameters: Models.TagsObject, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.VpnGateway>): void;
  updateTags(resourceGroupName: string, gatewayName: string, vpnGatewayParameters: Models.TagsObject, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.VpnGateway>, callback?: msRest.ServiceCallback<Models.VpnGateway>): Promise<Models.VpnGatewaysUpdateTagsResponse> {
    return this.client.sendOperationRequest(
      {
        resourceGroupName,
        gatewayName,
        vpnGatewayParameters,
        options
      },
      updateTagsOperationSpec,
      callback) as Promise<Models.VpnGatewaysUpdateTagsResponse>;
  }

  /**
   * Deletes a virtual wan vpn gateway.
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param [options] The optional parameters
   * @returns Promise<msRest.RestResponse>
   */
  deleteMethod(resourceGroupName: string, gatewayName: string, options?: msRest.RequestOptionsBase): Promise<msRest.RestResponse> {
    return this.beginDeleteMethod(resourceGroupName,gatewayName,options)
      .then(lroPoller => lroPoller.pollUntilFinished());
  }

  /**
   * Resets the primary of the vpn gateway in the specified resource group.
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param [options] The optional parameters
   * @returns Promise<Models.VpnGatewaysResetResponse>
   */
  reset(resourceGroupName: string, gatewayName: string, options?: msRest.RequestOptionsBase): Promise<Models.VpnGatewaysResetResponse> {
    return this.beginReset(resourceGroupName,gatewayName,options)
      .then(lroPoller => lroPoller.pollUntilFinished()) as Promise<Models.VpnGatewaysResetResponse>;
  }

  /**
   * Lists all the VpnGateways in a resource group.
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param [options] The optional parameters
   * @returns Promise<Models.VpnGatewaysListByResourceGroupResponse>
   */
  listByResourceGroup(resourceGroupName: string, options?: msRest.RequestOptionsBase): Promise<Models.VpnGatewaysListByResourceGroupResponse>;
  /**
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param callback The callback
   */
  listByResourceGroup(resourceGroupName: string, callback: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): void;
  /**
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param options The optional parameters
   * @param callback The callback
   */
  listByResourceGroup(resourceGroupName: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): void;
  listByResourceGroup(resourceGroupName: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ListVpnGatewaysResult>, callback?: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): Promise<Models.VpnGatewaysListByResourceGroupResponse> {
    return this.client.sendOperationRequest(
      {
        resourceGroupName,
        options
      },
      listByResourceGroupOperationSpec,
      callback) as Promise<Models.VpnGatewaysListByResourceGroupResponse>;
  }

  /**
   * Lists all the VpnGateways in a subscription.
   * @param [options] The optional parameters
   * @returns Promise<Models.VpnGatewaysListResponse>
   */
  list(options?: msRest.RequestOptionsBase): Promise<Models.VpnGatewaysListResponse>;
  /**
   * @param callback The callback
   */
  list(callback: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): void;
  /**
   * @param options The optional parameters
   * @param callback The callback
   */
  list(options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): void;
  list(options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ListVpnGatewaysResult>, callback?: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): Promise<Models.VpnGatewaysListResponse> {
    return this.client.sendOperationRequest(
      {
        options
      },
      listOperationSpec,
      callback) as Promise<Models.VpnGatewaysListResponse>;
  }

  /**
   * Creates a virtual wan vpn gateway if it doesn't exist else updates the existing gateway.
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param vpnGatewayParameters Parameters supplied to create or Update a virtual wan vpn gateway.
   * @param [options] The optional parameters
   * @returns Promise<msRestAzure.LROPoller>
   */
  beginCreateOrUpdate(resourceGroupName: string, gatewayName: string, vpnGatewayParameters: Models.VpnGateway, options?: msRest.RequestOptionsBase): Promise<msRestAzure.LROPoller> {
    return this.client.sendLRORequest(
      {
        resourceGroupName,
        gatewayName,
        vpnGatewayParameters,
        options
      },
      beginCreateOrUpdateOperationSpec,
      options);
  }

  /**
   * Deletes a virtual wan vpn gateway.
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param [options] The optional parameters
   * @returns Promise<msRestAzure.LROPoller>
   */
  beginDeleteMethod(resourceGroupName: string, gatewayName: string, options?: msRest.RequestOptionsBase): Promise<msRestAzure.LROPoller> {
    return this.client.sendLRORequest(
      {
        resourceGroupName,
        gatewayName,
        options
      },
      beginDeleteMethodOperationSpec,
      options);
  }

  /**
   * Resets the primary of the vpn gateway in the specified resource group.
   * @param resourceGroupName The resource group name of the VpnGateway.
   * @param gatewayName The name of the gateway.
   * @param [options] The optional parameters
   * @returns Promise<msRestAzure.LROPoller>
   */
  beginReset(resourceGroupName: string, gatewayName: string, options?: msRest.RequestOptionsBase): Promise<msRestAzure.LROPoller> {
    return this.client.sendLRORequest(
      {
        resourceGroupName,
        gatewayName,
        options
      },
      beginResetOperationSpec,
      options);
  }

  /**
   * Lists all the VpnGateways in a resource group.
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param [options] The optional parameters
   * @returns Promise<Models.VpnGatewaysListByResourceGroupNextResponse>
   */
  listByResourceGroupNext(nextPageLink: string, options?: msRest.RequestOptionsBase): Promise<Models.VpnGatewaysListByResourceGroupNextResponse>;
  /**
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param callback The callback
   */
  listByResourceGroupNext(nextPageLink: string, callback: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): void;
  /**
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param options The optional parameters
   * @param callback The callback
   */
  listByResourceGroupNext(nextPageLink: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): void;
  listByResourceGroupNext(nextPageLink: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ListVpnGatewaysResult>, callback?: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): Promise<Models.VpnGatewaysListByResourceGroupNextResponse> {
    return this.client.sendOperationRequest(
      {
        nextPageLink,
        options
      },
      listByResourceGroupNextOperationSpec,
      callback) as Promise<Models.VpnGatewaysListByResourceGroupNextResponse>;
  }

  /**
   * Lists all the VpnGateways in a subscription.
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param [options] The optional parameters
   * @returns Promise<Models.VpnGatewaysListNextResponse>
   */
  listNext(nextPageLink: string, options?: msRest.RequestOptionsBase): Promise<Models.VpnGatewaysListNextResponse>;
  /**
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param callback The callback
   */
  listNext(nextPageLink: string, callback: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): void;
  /**
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param options The optional parameters
   * @param callback The callback
   */
  listNext(nextPageLink: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): void;
  listNext(nextPageLink: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ListVpnGatewaysResult>, callback?: msRest.ServiceCallback<Models.ListVpnGatewaysResult>): Promise<Models.VpnGatewaysListNextResponse> {
    return this.client.sendOperationRequest(
      {
        nextPageLink,
        options
      },
      listNextOperationSpec,
      callback) as Promise<Models.VpnGatewaysListNextResponse>;
  }
}

// Operation Specifications
const serializer = new msRest.Serializer(Mappers);
const getOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Network/vpnGateways/{gatewayName}",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.resourceGroupName,
    Parameters.gatewayName
  ],
  queryParameters: [
    Parameters.apiVersion0
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {
      bodyMapper: Mappers.VpnGateway
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};

const updateTagsOperationSpec: msRest.OperationSpec = {
  httpMethod: "PATCH",
  path: "subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Network/vpnGateways/{gatewayName}",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.resourceGroupName,
    Parameters.gatewayName
  ],
  queryParameters: [
    Parameters.apiVersion0
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  requestBody: {
    parameterPath: "vpnGatewayParameters",
    mapper: {
      ...Mappers.TagsObject,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.VpnGateway
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};

const listByResourceGroupOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Network/vpnGateways",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.resourceGroupName
  ],
  queryParameters: [
    Parameters.apiVersion0
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {
      bodyMapper: Mappers.ListVpnGatewaysResult
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};

const listOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "subscriptions/{subscriptionId}/providers/Microsoft.Network/vpnGateways",
  urlParameters: [
    Parameters.subscriptionId
  ],
  queryParameters: [
    Parameters.apiVersion0
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {
      bodyMapper: Mappers.ListVpnGatewaysResult
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};

const beginCreateOrUpdateOperationSpec: msRest.OperationSpec = {
  httpMethod: "PUT",
  path: "subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Network/vpnGateways/{gatewayName}",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.resourceGroupName,
    Parameters.gatewayName
  ],
  queryParameters: [
    Parameters.apiVersion0
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  requestBody: {
    parameterPath: "vpnGatewayParameters",
    mapper: {
      ...Mappers.VpnGateway,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.VpnGateway
    },
    201: {
      bodyMapper: Mappers.VpnGateway
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};

const beginDeleteMethodOperationSpec: msRest.OperationSpec = {
  httpMethod: "DELETE",
  path: "subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Network/vpnGateways/{gatewayName}",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.resourceGroupName,
    Parameters.gatewayName
  ],
  queryParameters: [
    Parameters.apiVersion0
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {},
    202: {},
    204: {},
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};

const beginResetOperationSpec: msRest.OperationSpec = {
  httpMethod: "POST",
  path: "subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Network/vpnGateways/{gatewayName}/reset",
  urlParameters: [
    Parameters.resourceGroupName,
    Parameters.gatewayName,
    Parameters.subscriptionId
  ],
  queryParameters: [
    Parameters.apiVersion0
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {
      bodyMapper: Mappers.VpnGateway
    },
    202: {},
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};

const listByResourceGroupNextOperationSpec: msRest.OperationSpec = {
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
      bodyMapper: Mappers.ListVpnGatewaysResult
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};

const listNextOperationSpec: msRest.OperationSpec = {
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
      bodyMapper: Mappers.ListVpnGatewaysResult
    },
    default: {
      bodyMapper: Mappers.CloudError
    }
  },
  serializer
};
