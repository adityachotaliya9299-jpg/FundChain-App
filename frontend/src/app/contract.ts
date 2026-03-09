import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "./client";

export const contract = getContract({
  client,
  chain: sepolia,
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
});