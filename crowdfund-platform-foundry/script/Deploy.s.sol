// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/FundChain.sol";
import "../src/FundChainNFT.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        // 1. Deploy main contract
        FundChain fundChain = new FundChain();
        console.log("FundChain deployed at:    ", address(fundChain));

        // 2. Deploy NFT contract
        FundChainNFT nft = new FundChainNFT();
        console.log("FundChainNFT deployed at: ", address(nft));

        // 3. Link them together
        nft.setMinter(address(fundChain));
        fundChain.setNFTContract(address(nft));
        console.log("Contracts linked!");

        vm.stopBroadcast();
    }
}
