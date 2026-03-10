// frontend/src/app/api/notify/route.ts
// Email notifications using Resend API

import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface NotifyPayload {
  type: "goal_reached" | "new_backer" | "campaign_update";
  campaignTitle: string;
  campaignId: string | number;
  ownerEmail?: string;
  backerEmail?: string;
  amount?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 });
  }

  const body: NotifyPayload = await req.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fund-chain-app.vercel.app";
  const campaignUrl = `${appUrl}/campaign/2-${body.campaignId}`;

  let emailData: { to: string; subject: string; html: string } | null = null;

  if (body.type === "goal_reached" && body.ownerEmail) {
    emailData = {
      to: body.ownerEmail,
      subject: `🎉 Your campaign "${body.campaignTitle}" has reached its goal!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e5e5f0; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #f97316; font-size: 28px; margin: 0;">🎉 Goal Reached!</h1>
          </div>
          <p style="color: #a0a0b8; font-size: 16px; line-height: 1.6;">
            Congratulations! Your campaign <strong style="color: #f97316;">"${body.campaignTitle}"</strong> has successfully reached its funding goal!
          </p>
          <div style="background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="color: #f97316; font-size: 24px; font-weight: 800; margin: 0;">${body.amount} ETH Raised</p>
          </div>
          <p style="color: #a0a0b8;">You can now withdraw your funds from the campaign dashboard.</p>
          <a href="${campaignUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; margin-top: 16px;">
            View Campaign →
          </a>
          <p style="color: #6b6b8a; font-size: 12px; margin-top: 32px; text-align: center;">FundChain — Decentralized Crowdfunding on Ethereum</p>
        </div>
      `,
    };
  } else if (body.type === "new_backer" && body.ownerEmail) {
    emailData = {
      to: body.ownerEmail,
      subject: `💎 New backer on "${body.campaignTitle}"!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e5e5f0; padding: 32px; border-radius: 16px;">
          <h1 style="color: #f97316;">💎 New Backer!</h1>
          <p style="color: #a0a0b8; font-size: 16px;">Someone just backed your campaign <strong style="color: #f97316;">"${body.campaignTitle}"</strong> with <strong>${body.amount} ETH</strong>!</p>
          <a href="${campaignUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; margin-top: 16px;">View Campaign →</a>
          <p style="color: #6b6b8a; font-size: 12px; margin-top: 32px; text-align: center;">FundChain — Decentralized Crowdfunding on Ethereum</p>
        </div>
      `,
    };
  } else if (body.type === "campaign_update" && body.backerEmail) {
    emailData = {
      to: body.backerEmail,
      subject: `📢 Update from "${body.campaignTitle}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e5e5f0; padding: 32px; border-radius: 16px;">
          <h1 style="color: #f97316;">📢 Campaign Update</h1>
          <p style="color: #a0a0b8;">The campaign <strong style="color: #f97316;">"${body.campaignTitle}"</strong> you backed has a new update:</p>
          <div style="background: rgba(255,255,255,0.05); border-left: 3px solid #f97316; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #e5e5f0; font-size: 15px; line-height: 1.7; margin: 0;">${body.message}</p>
          </div>
          <a href="${campaignUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; margin-top: 16px;">View Campaign →</a>
          <p style="color: #6b6b8a; font-size: 12px; margin-top: 32px; text-align: center;">FundChain — Decentralized Crowdfunding on Ethereum</p>
        </div>
      `,
    };
  }

  if (!emailData) {
    return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FundChain <notifications@fundchain.app>",
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }
}
