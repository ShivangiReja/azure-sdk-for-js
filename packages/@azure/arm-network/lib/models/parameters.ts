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

export const acceptLanguage: msRest.OperationParameter = {
  parameterPath: "acceptLanguage",
  mapper: {
    serializedName: "accept-language",
    defaultValue: 'en-US',
    type: {
      name: "String"
    }
  }
};
export const apiVersion0: msRest.OperationQueryParameter = {
  parameterPath: "apiVersion",
  mapper: {
    required: true,
    isConstant: true,
    serializedName: "api-version",
    defaultValue: '2018-12-01',
    type: {
      name: "String"
    }
  }
};
export const apiVersion1: msRest.OperationQueryParameter = {
  parameterPath: "apiVersion",
  mapper: {
    required: true,
    isConstant: true,
    serializedName: "api-version",
    defaultValue: '2017-03-30',
    type: {
      name: "String"
    }
  }
};
export const applicationGatewayName: msRest.OperationURLParameter = {
  parameterPath: "applicationGatewayName",
  mapper: {
    required: true,
    serializedName: "applicationGatewayName",
    type: {
      name: "String"
    }
  }
};
export const applicationSecurityGroupName: msRest.OperationURLParameter = {
  parameterPath: "applicationSecurityGroupName",
  mapper: {
    required: true,
    serializedName: "applicationSecurityGroupName",
    type: {
      name: "String"
    }
  }
};
export const authorizationName: msRest.OperationURLParameter = {
  parameterPath: "authorizationName",
  mapper: {
    required: true,
    serializedName: "authorizationName",
    type: {
      name: "String"
    }
  }
};
export const azureFirewallName: msRest.OperationURLParameter = {
  parameterPath: "azureFirewallName",
  mapper: {
    required: true,
    serializedName: "azureFirewallName",
    type: {
      name: "String"
    }
  }
};
export const backendAddressPoolName: msRest.OperationURLParameter = {
  parameterPath: "backendAddressPoolName",
  mapper: {
    required: true,
    serializedName: "backendAddressPoolName",
    type: {
      name: "String"
    }
  }
};
export const circuitName: msRest.OperationURLParameter = {
  parameterPath: "circuitName",
  mapper: {
    required: true,
    serializedName: "circuitName",
    type: {
      name: "String"
    }
  }
};
export const connectionMonitorName: msRest.OperationURLParameter = {
  parameterPath: "connectionMonitorName",
  mapper: {
    required: true,
    serializedName: "connectionMonitorName",
    type: {
      name: "String"
    }
  }
};
export const connectionName: msRest.OperationURLParameter = {
  parameterPath: "connectionName",
  mapper: {
    required: true,
    serializedName: "connectionName",
    type: {
      name: "String"
    }
  }
};
export const crossConnectionName: msRest.OperationURLParameter = {
  parameterPath: "crossConnectionName",
  mapper: {
    required: true,
    serializedName: "crossConnectionName",
    type: {
      name: "String"
    }
  }
};
export const ddosCustomPolicyName: msRest.OperationURLParameter = {
  parameterPath: "ddosCustomPolicyName",
  mapper: {
    required: true,
    serializedName: "ddosCustomPolicyName",
    type: {
      name: "String"
    }
  }
};
export const ddosProtectionPlanName: msRest.OperationURLParameter = {
  parameterPath: "ddosProtectionPlanName",
  mapper: {
    required: true,
    serializedName: "ddosProtectionPlanName",
    type: {
      name: "String"
    }
  }
};
export const defaultSecurityRuleName: msRest.OperationURLParameter = {
  parameterPath: "defaultSecurityRuleName",
  mapper: {
    required: true,
    serializedName: "defaultSecurityRuleName",
    type: {
      name: "String"
    }
  }
};
export const devicePath: msRest.OperationURLParameter = {
  parameterPath: "devicePath",
  mapper: {
    required: true,
    serializedName: "devicePath",
    type: {
      name: "String"
    }
  }
};
export const domainNameLabel: msRest.OperationQueryParameter = {
  parameterPath: "domainNameLabel",
  mapper: {
    required: true,
    serializedName: "domainNameLabel",
    type: {
      name: "String"
    }
  }
};
export const expand: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "expand"
  ],
  mapper: {
    serializedName: "$expand",
    type: {
      name: "String"
    }
  }
};
export const expressRouteGatewayName: msRest.OperationURLParameter = {
  parameterPath: "expressRouteGatewayName",
  mapper: {
    required: true,
    serializedName: "expressRouteGatewayName",
    type: {
      name: "String"
    }
  }
};
export const expressRoutePortName: msRest.OperationURLParameter = {
  parameterPath: "expressRoutePortName",
  mapper: {
    required: true,
    serializedName: "expressRoutePortName",
    type: {
      name: "String"
    }
  }
};
export const frontendIPConfigurationName: msRest.OperationURLParameter = {
  parameterPath: "frontendIPConfigurationName",
  mapper: {
    required: true,
    serializedName: "frontendIPConfigurationName",
    type: {
      name: "String"
    }
  }
};
export const gatewayName: msRest.OperationURLParameter = {
  parameterPath: "gatewayName",
  mapper: {
    required: true,
    serializedName: "gatewayName",
    type: {
      name: "String"
    }
  }
};
export const gatewayVip: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "gatewayVip"
  ],
  mapper: {
    serializedName: "gatewayVip",
    type: {
      name: "String"
    }
  }
};
export const inboundNatRuleName: msRest.OperationURLParameter = {
  parameterPath: "inboundNatRuleName",
  mapper: {
    required: true,
    serializedName: "inboundNatRuleName",
    type: {
      name: "String"
    }
  }
};
export const interfaceEndpointName: msRest.OperationURLParameter = {
  parameterPath: "interfaceEndpointName",
  mapper: {
    required: true,
    serializedName: "interfaceEndpointName",
    type: {
      name: "String"
    }
  }
};
export const ipAddress: msRest.OperationQueryParameter = {
  parameterPath: "ipAddress",
  mapper: {
    required: true,
    serializedName: "ipAddress",
    type: {
      name: "String"
    }
  }
};
export const ipConfigurationName: msRest.OperationURLParameter = {
  parameterPath: "ipConfigurationName",
  mapper: {
    required: true,
    serializedName: "ipConfigurationName",
    type: {
      name: "String"
    }
  }
};
export const linkName: msRest.OperationURLParameter = {
  parameterPath: "linkName",
  mapper: {
    required: true,
    serializedName: "linkName",
    type: {
      name: "String"
    }
  }
};
export const loadBalancerName: msRest.OperationURLParameter = {
  parameterPath: "loadBalancerName",
  mapper: {
    required: true,
    serializedName: "loadBalancerName",
    type: {
      name: "String"
    }
  }
};
export const loadBalancingRuleName: msRest.OperationURLParameter = {
  parameterPath: "loadBalancingRuleName",
  mapper: {
    required: true,
    serializedName: "loadBalancingRuleName",
    type: {
      name: "String"
    }
  }
};
export const localNetworkGatewayName: msRest.OperationURLParameter = {
  parameterPath: "localNetworkGatewayName",
  mapper: {
    required: true,
    serializedName: "localNetworkGatewayName",
    constraints: {
      MinLength: 1
    },
    type: {
      name: "String"
    }
  }
};
export const location0: msRest.OperationURLParameter = {
  parameterPath: "location",
  mapper: {
    required: true,
    serializedName: "location",
    type: {
      name: "String"
    }
  }
};
export const location1: msRest.OperationURLParameter = {
  parameterPath: "location",
  mapper: {
    required: true,
    serializedName: "location",
    constraints: {
      Pattern: /^[-\w\._ ]+$/
    },
    type: {
      name: "String"
    }
  }
};
export const locationName: msRest.OperationURLParameter = {
  parameterPath: "locationName",
  mapper: {
    required: true,
    serializedName: "locationName",
    type: {
      name: "String"
    }
  }
};
export const networkInterfaceName: msRest.OperationURLParameter = {
  parameterPath: "networkInterfaceName",
  mapper: {
    required: true,
    serializedName: "networkInterfaceName",
    type: {
      name: "String"
    }
  }
};
export const networkProfileName: msRest.OperationURLParameter = {
  parameterPath: "networkProfileName",
  mapper: {
    required: true,
    serializedName: "networkProfileName",
    type: {
      name: "String"
    }
  }
};
export const networkSecurityGroupName: msRest.OperationURLParameter = {
  parameterPath: "networkSecurityGroupName",
  mapper: {
    required: true,
    serializedName: "networkSecurityGroupName",
    type: {
      name: "String"
    }
  }
};
export const networkWatcherName: msRest.OperationURLParameter = {
  parameterPath: "networkWatcherName",
  mapper: {
    required: true,
    serializedName: "networkWatcherName",
    type: {
      name: "String"
    }
  }
};
export const nextPageLink: msRest.OperationURLParameter = {
  parameterPath: "nextPageLink",
  mapper: {
    required: true,
    serializedName: "nextLink",
    type: {
      name: "String"
    }
  },
  skipEncoding: true
};
export const outboundRuleName: msRest.OperationURLParameter = {
  parameterPath: "outboundRuleName",
  mapper: {
    required: true,
    serializedName: "outboundRuleName",
    type: {
      name: "String"
    }
  }
};
export const p2SVpnServerConfigurationName: msRest.OperationURLParameter = {
  parameterPath: "p2SVpnServerConfigurationName",
  mapper: {
    required: true,
    serializedName: "p2SVpnServerConfigurationName",
    type: {
      name: "String"
    }
  }
};
export const packetCaptureName: msRest.OperationURLParameter = {
  parameterPath: "packetCaptureName",
  mapper: {
    required: true,
    serializedName: "packetCaptureName",
    type: {
      name: "String"
    }
  }
};
export const peer0: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "peer"
  ],
  mapper: {
    serializedName: "peer",
    type: {
      name: "String"
    }
  }
};
export const peer1: msRest.OperationQueryParameter = {
  parameterPath: "peer",
  mapper: {
    required: true,
    serializedName: "peer",
    type: {
      name: "String"
    }
  }
};
export const peeringName: msRest.OperationURLParameter = {
  parameterPath: "peeringName",
  mapper: {
    required: true,
    serializedName: "peeringName",
    type: {
      name: "String"
    }
  }
};
export const policyName: msRest.OperationURLParameter = {
  parameterPath: "policyName",
  mapper: {
    required: true,
    serializedName: "policyName",
    constraints: {
      MaxLength: 128
    },
    type: {
      name: "String"
    }
  }
};
export const predefinedPolicyName: msRest.OperationURLParameter = {
  parameterPath: "predefinedPolicyName",
  mapper: {
    required: true,
    serializedName: "predefinedPolicyName",
    type: {
      name: "String"
    }
  }
};
export const probeName: msRest.OperationURLParameter = {
  parameterPath: "probeName",
  mapper: {
    required: true,
    serializedName: "probeName",
    type: {
      name: "String"
    }
  }
};
export const publicIpAddressName: msRest.OperationURLParameter = {
  parameterPath: "publicIpAddressName",
  mapper: {
    required: true,
    serializedName: "publicIpAddressName",
    type: {
      name: "String"
    }
  }
};
export const publicIpPrefixName: msRest.OperationURLParameter = {
  parameterPath: "publicIpPrefixName",
  mapper: {
    required: true,
    serializedName: "publicIpPrefixName",
    type: {
      name: "String"
    }
  }
};
export const resourceGroupName: msRest.OperationURLParameter = {
  parameterPath: "resourceGroupName",
  mapper: {
    required: true,
    serializedName: "resourceGroupName",
    type: {
      name: "String"
    }
  }
};
export const routeFilterName: msRest.OperationURLParameter = {
  parameterPath: "routeFilterName",
  mapper: {
    required: true,
    serializedName: "routeFilterName",
    type: {
      name: "String"
    }
  }
};
export const routeName: msRest.OperationURLParameter = {
  parameterPath: "routeName",
  mapper: {
    required: true,
    serializedName: "routeName",
    type: {
      name: "String"
    }
  }
};
export const routeTableName: msRest.OperationURLParameter = {
  parameterPath: "routeTableName",
  mapper: {
    required: true,
    serializedName: "routeTableName",
    type: {
      name: "String"
    }
  }
};
export const ruleName: msRest.OperationURLParameter = {
  parameterPath: "ruleName",
  mapper: {
    required: true,
    serializedName: "ruleName",
    type: {
      name: "String"
    }
  }
};
export const securityRuleName: msRest.OperationURLParameter = {
  parameterPath: "securityRuleName",
  mapper: {
    required: true,
    serializedName: "securityRuleName",
    type: {
      name: "String"
    }
  }
};
export const serviceEndpointPolicyDefinitionName: msRest.OperationURLParameter = {
  parameterPath: "serviceEndpointPolicyDefinitionName",
  mapper: {
    required: true,
    serializedName: "serviceEndpointPolicyDefinitionName",
    type: {
      name: "String"
    }
  }
};
export const serviceEndpointPolicyName: msRest.OperationURLParameter = {
  parameterPath: "serviceEndpointPolicyName",
  mapper: {
    required: true,
    serializedName: "serviceEndpointPolicyName",
    type: {
      name: "String"
    }
  }
};
export const subnetName: msRest.OperationURLParameter = {
  parameterPath: "subnetName",
  mapper: {
    required: true,
    serializedName: "subnetName",
    type: {
      name: "String"
    }
  }
};
export const subscriptionId: msRest.OperationURLParameter = {
  parameterPath: "subscriptionId",
  mapper: {
    required: true,
    serializedName: "subscriptionId",
    type: {
      name: "String"
    }
  }
};
export const tapConfigurationName: msRest.OperationURLParameter = {
  parameterPath: "tapConfigurationName",
  mapper: {
    required: true,
    serializedName: "tapConfigurationName",
    type: {
      name: "String"
    }
  }
};
export const tapName: msRest.OperationURLParameter = {
  parameterPath: "tapName",
  mapper: {
    required: true,
    serializedName: "tapName",
    type: {
      name: "String"
    }
  }
};
export const virtualHubName: msRest.OperationURLParameter = {
  parameterPath: "virtualHubName",
  mapper: {
    required: true,
    serializedName: "virtualHubName",
    type: {
      name: "String"
    }
  }
};
export const virtualmachineIndex: msRest.OperationURLParameter = {
  parameterPath: "virtualmachineIndex",
  mapper: {
    required: true,
    serializedName: "virtualmachineIndex",
    type: {
      name: "String"
    }
  }
};
export const virtualMachineScaleSetName: msRest.OperationURLParameter = {
  parameterPath: "virtualMachineScaleSetName",
  mapper: {
    required: true,
    serializedName: "virtualMachineScaleSetName",
    type: {
      name: "String"
    }
  }
};
export const virtualNetworkGatewayConnectionName: msRest.OperationURLParameter = {
  parameterPath: "virtualNetworkGatewayConnectionName",
  mapper: {
    required: true,
    serializedName: "virtualNetworkGatewayConnectionName",
    type: {
      name: "String"
    }
  }
};
export const virtualNetworkGatewayName: msRest.OperationURLParameter = {
  parameterPath: "virtualNetworkGatewayName",
  mapper: {
    required: true,
    serializedName: "virtualNetworkGatewayName",
    type: {
      name: "String"
    }
  }
};
export const virtualNetworkName: msRest.OperationURLParameter = {
  parameterPath: "virtualNetworkName",
  mapper: {
    required: true,
    serializedName: "virtualNetworkName",
    type: {
      name: "String"
    }
  }
};
export const virtualNetworkPeeringName: msRest.OperationURLParameter = {
  parameterPath: "virtualNetworkPeeringName",
  mapper: {
    required: true,
    serializedName: "virtualNetworkPeeringName",
    type: {
      name: "String"
    }
  }
};
export const virtualWanName: msRest.OperationURLParameter = {
  parameterPath: "virtualWanName",
  mapper: {
    required: true,
    serializedName: "virtualWanName",
    type: {
      name: "String"
    }
  }
};
export const virtualWANName0: msRest.OperationURLParameter = {
  parameterPath: "virtualWANName",
  mapper: {
    required: true,
    serializedName: "virtualWANName",
    type: {
      name: "String"
    }
  }
};
export const virtualWANName1: msRest.OperationURLParameter = {
  parameterPath: "virtualWANName",
  mapper: {
    required: true,
    serializedName: "VirtualWANName",
    type: {
      name: "String"
    }
  }
};
export const vpnSiteName: msRest.OperationURLParameter = {
  parameterPath: "vpnSiteName",
  mapper: {
    required: true,
    serializedName: "vpnSiteName",
    type: {
      name: "String"
    }
  }
};
