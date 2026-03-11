// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/FundChainDAO.sol";
import "../src/FundChainMultiToken.sol";

contract DeployV3 is Script {
    // Your existing V2 FundChain contract address
    address constant FUNDCHAIN_V2 = 0xC7CF086e5ECa53BFda4D75e46753AA9ed794A131;

    function run() external {
        vm.startBroadcast();

        // Deploy DAO contract
        FundChainDAO dao = new FundChainDAO(FUNDCHAIN_V2);
        console.log("FundChainDAO deployed at:        ", address(dao));

        // Deploy MultiToken contract
        FundChainMultiToken multiToken = new FundChainMultiToken();
        console.log("FundChainMultiToken deployed at: ", address(multiToken));

        vm.stopBroadcast();

        console.log("\n--- Add these to your .env.local ---");
        console.log("NEXT_PUBLIC_DAO_ADDRESS=", address(dao));
        console.log("NEXT_PUBLIC_MULTITOKEN_ADDRESS=", address(multiToken));
    }
}
