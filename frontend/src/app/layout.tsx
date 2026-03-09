import type { Metadata } from "next";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "FundChain — Decentralized Crowdfunding",
  description: "Fund ideas that matter, on-chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThirdwebProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>

          <Footer />
        </ThirdwebProvider>
      </body>
    </html>
  );
}
