"use client";
import { useReadContract } from "thirdweb/react";
import { contract } from "@/app/contract";

export default function CampaignList() {
  const { data: campaigns, isLoading } = useReadContract({
    contract,
    method: "function getCampaigns() returns ((address,string,string,uint256,uint256,uint256,string,address[],uint256[],bool)[])",
    params: [],
  });

  if (isLoading) return <p>Loading campaigns...</p>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {campaigns?.map((c: any, i: number) => (
        <div key={i} className="border rounded-xl p-4">
          <img src={c[6]} alt={c[1]} className="w-full h-40 object-cover rounded" />
          <h2 className="font-bold text-lg mt-2">{c[1]}</h2>
          <p className="text-sm text-gray-500">{c[2]}</p>
          <p>Goal: {Number(c[3]) / 1e18} ETH</p>
          <p>Raised: {Number(c[5]) / 1e18} ETH</p>
        </div>
      ))}
    </div>
  );
}