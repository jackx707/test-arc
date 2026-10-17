// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {AgentRegistry} from "../AgentRegistry.sol";

/**
 * @title RegisterAgent
 * @notice Registers the PriceBot agent identity in the deployed AgentRegistry.
 *         Run after deployment with:
 *           forge script contracts/script/RegisterAgent.s.sol \
 *             --rpc-url $ARC_TESTNET_RPC_URL \
 *             --broadcast \
 *             --private-key $PRIVATE_KEY
 */
contract RegisterAgent is Script {
    // Deployed AgentRegistry on Arc Testnet
    address constant REGISTRY = 0xdf02acb8e67354532d90d31ae74fa5274c7bfc38;

    function run() external {
        string memory agentURI = string(
            abi.encodePacked(
                "data:application/json;base64,",
                "eyJ0eXBlIjoiaHR0cHM6Ly9laXBzLmV0aGVyZXVtLm9yZy9FSVBTL2VpcC04MDA0I3JlZ2lzdHJhdGlvbi12MSIsIm5hbWUiOiJQcmljZUJvdCIsImRlc2NyaXB0aW9uIjoiU3BvdCBwcmljZSBvcmFjbGUgYWdlbnQuIFJldHVybnMgcmVhbC10aW1lIEJUQywgRVRIIGFuZCBVU0RDIHByaWNlcy4gUGF5IHBlciBjYWxsIHZpYSB4NDAyIENpcmNsZSBHYXRld2F5IE5hbm9wYXltZW50cyAoMC4wMSBVU0RDL2NhbGwpLiIsImltYWdlIjoiaHR0cHM6Ly9wbGFjZWhvbGQuY28vMjAweDIwMC8wZDExMTcvM2I4MmY2P3RleHQ9UEIiLCJzZXJ2aWNlcyI6W3sibmFtZSI6Ing0MDIiLCJlbmRwb2ludCI6Imh0dHBzOi8vaTEyczFobXhyZXo4eXdncDl3eDY5LnByZXZpZXcuc3R1ZGlvLmFyYy5pby9hcGkvZGF0YSIsInZlcnNpb24iOiIxLjAuMCJ9LHsibmFtZSI6IndlYiIsImVuZHBvaW50IjoiaHR0cHM6Ly9pMTJzMWhteHJlejh5d2dwOXd4NjkucHJldmlldy5zdHVkaW8uYXJjLmlvIn1dLCJjYXBhYmlsaXRpZXMiOlsicHJpY2VzIiwiQlRDIiwiRVRIIiwiVVNEQyIsIng0MDIiXSwieDQwMiI6eyJzdXBwb3J0ZWQiOnRydWUsInByaWNlIjoiMC4wMSIsInRva2VuIjoiVVNEQyIsImNoYWluIjoiQXJjIFRlc3RuZXQifX0="
            )
        );

        vm.startBroadcast();
        AgentRegistry(REGISTRY).register(agentURI);
        vm.stopBroadcast();
    }
}
