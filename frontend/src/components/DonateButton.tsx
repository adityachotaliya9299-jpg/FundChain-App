"use client";
import { useSendTransaction } from "thirdweb/react";
import { prepareContractCall, toWei } from "thirdweb";
import { contract } from "@/app/contract";

export default function DonateButton({ campaignId }: { campaignId: number }) {
  const { mutate: sendTx, isPending } = useSendTransaction();

  const donate = () => {
    const tx = prepareContractCall({
      contract,
      method: "function donateToCampaign(uint256 _id) payable",
      params: [BigInt(campaignId)],
      value: toWei("0.01"), // 0.01 ETH
    });
    sendTx(tx);
  };

  return (
    <button onClick={donate} disabled={isPending}>
      {isPending ? "Donating..." : "Donate 0.01 ETH"}
    </button>
  );
}