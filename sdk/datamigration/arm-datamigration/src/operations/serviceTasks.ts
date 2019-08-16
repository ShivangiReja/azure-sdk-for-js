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
import * as Mappers from "../models/serviceTasksMappers";
import * as Parameters from "../models/parameters";
import { DataMigrationServiceClientContext } from "../dataMigrationServiceClientContext";

/** Class representing a ServiceTasks. */
export class ServiceTasks {
  private readonly client: DataMigrationServiceClientContext;

  /**
   * Create a ServiceTasks.
   * @param {DataMigrationServiceClientContext} client Reference to the service client.
   */
  constructor(client: DataMigrationServiceClientContext) {
    this.client = client;
  }

  /**
   * The services resource is the top-level resource that represents the Database Migration Service.
   * This method returns a list of service level tasks owned by a service resource. Some tasks may
   * have a status of Unknown, which indicates that an error occurred while querying the status of
   * that task.
   * @summary Get service level tasks for a service
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param [options] The optional parameters
   * @returns Promise<Models.ServiceTasksListResponse>
   */
  list(groupName: string, serviceName: string, options?: Models.ServiceTasksListOptionalParams): Promise<Models.ServiceTasksListResponse>;
  /**
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param callback The callback
   */
  list(groupName: string, serviceName: string, callback: msRest.ServiceCallback<Models.TaskList>): void;
  /**
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param options The optional parameters
   * @param callback The callback
   */
  list(groupName: string, serviceName: string, options: Models.ServiceTasksListOptionalParams, callback: msRest.ServiceCallback<Models.TaskList>): void;
  list(groupName: string, serviceName: string, options?: Models.ServiceTasksListOptionalParams | msRest.ServiceCallback<Models.TaskList>, callback?: msRest.ServiceCallback<Models.TaskList>): Promise<Models.ServiceTasksListResponse> {
    return this.client.sendOperationRequest(
      {
        groupName,
        serviceName,
        options
      },
      listOperationSpec,
      callback) as Promise<Models.ServiceTasksListResponse>;
  }

  /**
   * The service tasks resource is a nested, proxy-only resource representing work performed by a DMS
   * instance. The PUT method creates a new service task or updates an existing one, although since
   * service tasks have no mutable custom properties, there is little reason to update an existing
   * one.
   * @summary Create or update service task
   * @param parameters Information about the task
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param [options] The optional parameters
   * @returns Promise<Models.ServiceTasksCreateOrUpdateResponse>
   */
  createOrUpdate(parameters: Models.ProjectTask, groupName: string, serviceName: string, taskName: string, options?: msRest.RequestOptionsBase): Promise<Models.ServiceTasksCreateOrUpdateResponse>;
  /**
   * @param parameters Information about the task
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param callback The callback
   */
  createOrUpdate(parameters: Models.ProjectTask, groupName: string, serviceName: string, taskName: string, callback: msRest.ServiceCallback<Models.ProjectTask>): void;
  /**
   * @param parameters Information about the task
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param options The optional parameters
   * @param callback The callback
   */
  createOrUpdate(parameters: Models.ProjectTask, groupName: string, serviceName: string, taskName: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ProjectTask>): void;
  createOrUpdate(parameters: Models.ProjectTask, groupName: string, serviceName: string, taskName: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ProjectTask>, callback?: msRest.ServiceCallback<Models.ProjectTask>): Promise<Models.ServiceTasksCreateOrUpdateResponse> {
    return this.client.sendOperationRequest(
      {
        parameters,
        groupName,
        serviceName,
        taskName,
        options
      },
      createOrUpdateOperationSpec,
      callback) as Promise<Models.ServiceTasksCreateOrUpdateResponse>;
  }

  /**
   * The service tasks resource is a nested, proxy-only resource representing work performed by a DMS
   * instance. The GET method retrieves information about a service task.
   * @summary Get service task information
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param [options] The optional parameters
   * @returns Promise<Models.ServiceTasksGetResponse>
   */
  get(groupName: string, serviceName: string, taskName: string, options?: Models.ServiceTasksGetOptionalParams): Promise<Models.ServiceTasksGetResponse>;
  /**
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param callback The callback
   */
  get(groupName: string, serviceName: string, taskName: string, callback: msRest.ServiceCallback<Models.ProjectTask>): void;
  /**
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param options The optional parameters
   * @param callback The callback
   */
  get(groupName: string, serviceName: string, taskName: string, options: Models.ServiceTasksGetOptionalParams, callback: msRest.ServiceCallback<Models.ProjectTask>): void;
  get(groupName: string, serviceName: string, taskName: string, options?: Models.ServiceTasksGetOptionalParams | msRest.ServiceCallback<Models.ProjectTask>, callback?: msRest.ServiceCallback<Models.ProjectTask>): Promise<Models.ServiceTasksGetResponse> {
    return this.client.sendOperationRequest(
      {
        groupName,
        serviceName,
        taskName,
        options
      },
      getOperationSpec,
      callback) as Promise<Models.ServiceTasksGetResponse>;
  }

  /**
   * The service tasks resource is a nested, proxy-only resource representing work performed by a DMS
   * instance. The DELETE method deletes a service task, canceling it first if it's running.
   * @summary Delete service task
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param [options] The optional parameters
   * @returns Promise<msRest.RestResponse>
   */
  deleteMethod(groupName: string, serviceName: string, taskName: string, options?: Models.ServiceTasksDeleteMethodOptionalParams): Promise<msRest.RestResponse>;
  /**
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param callback The callback
   */
  deleteMethod(groupName: string, serviceName: string, taskName: string, callback: msRest.ServiceCallback<void>): void;
  /**
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param options The optional parameters
   * @param callback The callback
   */
  deleteMethod(groupName: string, serviceName: string, taskName: string, options: Models.ServiceTasksDeleteMethodOptionalParams, callback: msRest.ServiceCallback<void>): void;
  deleteMethod(groupName: string, serviceName: string, taskName: string, options?: Models.ServiceTasksDeleteMethodOptionalParams | msRest.ServiceCallback<void>, callback?: msRest.ServiceCallback<void>): Promise<msRest.RestResponse> {
    return this.client.sendOperationRequest(
      {
        groupName,
        serviceName,
        taskName,
        options
      },
      deleteMethodOperationSpec,
      callback);
  }

  /**
   * The service tasks resource is a nested, proxy-only resource representing work performed by a DMS
   * instance. The PATCH method updates an existing service task, but since service tasks have no
   * mutable custom properties, there is little reason to do so.
   * @summary Create or update service task
   * @param parameters Information about the task
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param [options] The optional parameters
   * @returns Promise<Models.ServiceTasksUpdateResponse>
   */
  update(parameters: Models.ProjectTask, groupName: string, serviceName: string, taskName: string, options?: msRest.RequestOptionsBase): Promise<Models.ServiceTasksUpdateResponse>;
  /**
   * @param parameters Information about the task
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param callback The callback
   */
  update(parameters: Models.ProjectTask, groupName: string, serviceName: string, taskName: string, callback: msRest.ServiceCallback<Models.ProjectTask>): void;
  /**
   * @param parameters Information about the task
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param options The optional parameters
   * @param callback The callback
   */
  update(parameters: Models.ProjectTask, groupName: string, serviceName: string, taskName: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ProjectTask>): void;
  update(parameters: Models.ProjectTask, groupName: string, serviceName: string, taskName: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ProjectTask>, callback?: msRest.ServiceCallback<Models.ProjectTask>): Promise<Models.ServiceTasksUpdateResponse> {
    return this.client.sendOperationRequest(
      {
        parameters,
        groupName,
        serviceName,
        taskName,
        options
      },
      updateOperationSpec,
      callback) as Promise<Models.ServiceTasksUpdateResponse>;
  }

  /**
   * The service tasks resource is a nested, proxy-only resource representing work performed by a DMS
   * instance. This method cancels a service task if it's currently queued or running.
   * @summary Cancel a service task
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param [options] The optional parameters
   * @returns Promise<Models.ServiceTasksCancelResponse>
   */
  cancel(groupName: string, serviceName: string, taskName: string, options?: msRest.RequestOptionsBase): Promise<Models.ServiceTasksCancelResponse>;
  /**
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param callback The callback
   */
  cancel(groupName: string, serviceName: string, taskName: string, callback: msRest.ServiceCallback<Models.ProjectTask>): void;
  /**
   * @param groupName Name of the resource group
   * @param serviceName Name of the service
   * @param taskName Name of the Task
   * @param options The optional parameters
   * @param callback The callback
   */
  cancel(groupName: string, serviceName: string, taskName: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ProjectTask>): void;
  cancel(groupName: string, serviceName: string, taskName: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ProjectTask>, callback?: msRest.ServiceCallback<Models.ProjectTask>): Promise<Models.ServiceTasksCancelResponse> {
    return this.client.sendOperationRequest(
      {
        groupName,
        serviceName,
        taskName,
        options
      },
      cancelOperationSpec,
      callback) as Promise<Models.ServiceTasksCancelResponse>;
  }

  /**
   * The services resource is the top-level resource that represents the Database Migration Service.
   * This method returns a list of service level tasks owned by a service resource. Some tasks may
   * have a status of Unknown, which indicates that an error occurred while querying the status of
   * that task.
   * @summary Get service level tasks for a service
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param [options] The optional parameters
   * @returns Promise<Models.ServiceTasksListNextResponse>
   */
  listNext(nextPageLink: string, options?: msRest.RequestOptionsBase): Promise<Models.ServiceTasksListNextResponse>;
  /**
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param callback The callback
   */
  listNext(nextPageLink: string, callback: msRest.ServiceCallback<Models.TaskList>): void;
  /**
   * @param nextPageLink The NextLink from the previous successful call to List operation.
   * @param options The optional parameters
   * @param callback The callback
   */
  listNext(nextPageLink: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.TaskList>): void;
  listNext(nextPageLink: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.TaskList>, callback?: msRest.ServiceCallback<Models.TaskList>): Promise<Models.ServiceTasksListNextResponse> {
    return this.client.sendOperationRequest(
      {
        nextPageLink,
        options
      },
      listNextOperationSpec,
      callback) as Promise<Models.ServiceTasksListNextResponse>;
  }
}

// Operation Specifications
const serializer = new msRest.Serializer(Mappers);
const listOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "subscriptions/{subscriptionId}/resourceGroups/{groupName}/providers/Microsoft.DataMigration/services/{serviceName}/serviceTasks",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.groupName,
    Parameters.serviceName
  ],
  queryParameters: [
    Parameters.apiVersion,
    Parameters.taskType
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {
      bodyMapper: Mappers.TaskList
    },
    default: {
      bodyMapper: Mappers.ApiError
    }
  },
  serializer
};

const createOrUpdateOperationSpec: msRest.OperationSpec = {
  httpMethod: "PUT",
  path: "subscriptions/{subscriptionId}/resourceGroups/{groupName}/providers/Microsoft.DataMigration/services/{serviceName}/serviceTasks/{taskName}",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.groupName,
    Parameters.serviceName,
    Parameters.taskName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  requestBody: {
    parameterPath: "parameters",
    mapper: {
      ...Mappers.ProjectTask,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.ProjectTask
    },
    201: {
      bodyMapper: Mappers.ProjectTask
    },
    default: {
      bodyMapper: Mappers.ApiError
    }
  },
  serializer
};

const getOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "subscriptions/{subscriptionId}/resourceGroups/{groupName}/providers/Microsoft.DataMigration/services/{serviceName}/serviceTasks/{taskName}",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.groupName,
    Parameters.serviceName,
    Parameters.taskName
  ],
  queryParameters: [
    Parameters.expand,
    Parameters.apiVersion
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {
      bodyMapper: Mappers.ProjectTask
    },
    default: {
      bodyMapper: Mappers.ApiError
    }
  },
  serializer
};

const deleteMethodOperationSpec: msRest.OperationSpec = {
  httpMethod: "DELETE",
  path: "subscriptions/{subscriptionId}/resourceGroups/{groupName}/providers/Microsoft.DataMigration/services/{serviceName}/serviceTasks/{taskName}",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.groupName,
    Parameters.serviceName,
    Parameters.taskName
  ],
  queryParameters: [
    Parameters.deleteRunningTasks,
    Parameters.apiVersion
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {},
    204: {},
    default: {
      bodyMapper: Mappers.ApiError
    }
  },
  serializer
};

const updateOperationSpec: msRest.OperationSpec = {
  httpMethod: "PATCH",
  path: "subscriptions/{subscriptionId}/resourceGroups/{groupName}/providers/Microsoft.DataMigration/services/{serviceName}/serviceTasks/{taskName}",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.groupName,
    Parameters.serviceName,
    Parameters.taskName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  requestBody: {
    parameterPath: "parameters",
    mapper: {
      ...Mappers.ProjectTask,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.ProjectTask
    },
    default: {
      bodyMapper: Mappers.ApiError
    }
  },
  serializer
};

const cancelOperationSpec: msRest.OperationSpec = {
  httpMethod: "POST",
  path: "subscriptions/{subscriptionId}/resourceGroups/{groupName}/providers/Microsoft.DataMigration/services/{serviceName}/serviceTasks/{taskName}/cancel",
  urlParameters: [
    Parameters.subscriptionId,
    Parameters.groupName,
    Parameters.serviceName,
    Parameters.taskName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  headerParameters: [
    Parameters.acceptLanguage
  ],
  responses: {
    200: {
      bodyMapper: Mappers.ProjectTask
    },
    default: {
      bodyMapper: Mappers.ApiError
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
      bodyMapper: Mappers.TaskList
    },
    default: {
      bodyMapper: Mappers.ApiError
    }
  },
  serializer
};
