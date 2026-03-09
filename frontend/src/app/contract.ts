import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "./client";

const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export const contract = address ? getContract({
  client,
  chain: sepolia,
  address,
}) : null as any;