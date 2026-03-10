import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "./client";

export const contract = getContract({
  client,
  chain: sepolia,
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
});

export const contractV1 = getContract({
  client,
  chain: sepolia,
  address: "0xeA4eD8Bc483b7bEdCFbFa7A83ecB151AC12f6996", // old V1
});