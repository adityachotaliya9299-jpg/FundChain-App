"use client";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/app/client";

export default function ConnectWallet() {
  return <ConnectButton client={client} />;
}