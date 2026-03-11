# ⛓ FundChain — Decentralized Crowdfunding Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://fund-chain-app.vercel.app)
[![Built with Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=for-the-badge&logo=ethereum)](https://sepolia.etherscan.io)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org)
[![thirdweb](https://img.shields.io/badge/thirdweb-v5-7C3AED?style=for-the-badge)](https://thirdweb.com)

> **Fund ideas that matter, on-chain.** A fully decentralized crowdfunding platform built on Ethereum with DAO governance, multi-token support, NFT rewards, and milestone-based funding.

---

## 🌐 Live Demo

**Website:** [fund-chain-app.vercel.app](https://fund-chain-app.vercel.app)  
**V1 Contract:** [0xeA4eD8Bc...](https://sepolia.etherscan.io/address/0xeA4eD8Bc483b7bEdCFbFa7A83ecB151AC12f6996)  
**V2 Contract:** [0xC7CF086e...](https://sepolia.etherscan.io/address/0xC7CF086e5ECa53BFda4D75e46753AA9ed794A131)

---

## ✨ Features

### 🏦 Core Crowdfunding
- **Create Campaigns** — Launch fundraisers with title, description, category, goal, and deadline
- **IPFS Image Upload** — Decentralized image storage via thirdweb Storage
- **Multi-Token Donations** — Accept ETH, USDC, and USDT
- **Milestone-Based Funding** — Break goals into milestones; funds released per milestone
- **Refund System** — Automatic refunds if goal not reached by deadline
- **Withdraw Funds** — Campaign owners withdraw when goal is reached

### 🏛 DAO Governance
- **Spending Proposals** — Campaign owners propose how funds are spent
- **Backer Voting** — Voting power proportional to donation amount
- **72-Hour Voting Period** — Democratic decision-making
- **On-Chain Execution** — Approved proposals execute automatically

### 🎖 NFT Rewards
- **Bronze Badge** — Donate 0.01+ ETH
- **Silver Badge** — Donate 0.05+ ETH  
- **Gold Badge** — Donate 0.10+ ETH
- **ERC-721 Standard** — Tradeable proof-of-contribution tokens

### 📊 Analytics
- **Platform Stats** — Total raised, backers, active campaigns, success rate
- **Charts** — Donation timeline, category breakdown, top campaigns
- **Backer Leaderboard** — Top donors ranked globally
- **Real-time Data** — Pulled directly from Ethereum blockchain

### 🔔 UX Features
- **Social Sharing** — Share campaigns on Twitter/X, WhatsApp, Telegram, LinkedIn
- **Email Notifications** — Get notified when goals are reached (via Resend)
- **Campaign Updates** — Owners post on-chain progress updates
- **Mobile Responsive** — Works on all devices including MetaMask mobile browser
- **Search & Filter** — Filter by Active, Funded, Ended; sort by newest/oldest

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript |
| **Styling** | Tailwind CSS + Custom CSS Variables |
| **Web3 SDK** | thirdweb v5 |
| **Smart Contracts** | Solidity 0.8.20, OpenZeppelin |
| **Development** | Foundry (Forge, Cast, Anvil) |
| **Storage** | IPFS via thirdweb Storage |
| **Charts** | Recharts |
| **Email** | Resend API |
| **Deployment** | Vercel (frontend), Ethereum Sepolia (contracts) |

---

## 📁 Project Structure

```
fundchain/
├── frontend/                    # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Homepage — campaign listing
│   │   │   ├── layout.tsx       # Root layout with Navbar + Footer
│   │   │   ├── globals.css      # Global styles + CSS variables
│   │   │   ├── client.ts        # thirdweb client
│   │   │   ├── contract.ts      # Contract instances (V1 + V2)
│   │   │   ├── create/          # Create campaign wizard
│   │   │   ├── campaign/[id]/   # Campaign detail page
│   │   │   ├── analytics/       # Analytics dashboard
│   │   │   └── api/notify/      # Email notification API route
│   │   └── components/
│   │       ├── Navbar.tsx
│   │       ├── Footer.tsx
│   │       ├── IPFSUploader.tsx
│   │       ├── CampaignUpdates.tsx
│   │       ├── Milestones.tsx
│   │       ├── RefundClaim.tsx
│   │       ├── DAOVoting.tsx
│   │       ├── MultiTokenDonate.tsx
│   │       ├── BackerLeaderboard.tsx
│   │       ├── DonationChart.tsx
│   │       ├── SocialShare.tsx
│   │       └── EmailSubscribe.tsx
│   └── .env.local
│
└── crowdfund-platform-foundry/  # Solidity smart contracts
    ├── src/
    │   ├── CrowdfundPlatform.sol  # V1 Contract
    │   ├── FundChain.sol          # V2 Main Contract
    │   ├── FundChainNFT.sol       # ERC-721 NFT Rewards
    │   ├── FundChainDAO.sol       # DAO Governance
    │   └── FundChainMultiToken.sol # Multi-token donations
    └── script/
        ├── Deploy.s.sol           # V2 deploy script
        └── DeployV3.s.sol         # V3 deploy script
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Git
- MetaMask wallet
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/adityachotaliya9299-jpg/FundChain.git
cd FundChain/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_CONTRACT_ADDRESS=0xC7CF086e5ECa53BFda4D75e46753AA9ed794A131
NEXT_PUBLIC_DAO_ADDRESS=your_dao_contract_address
NEXT_PUBLIC_MULTITOKEN_ADDRESS=your_multitoken_contract_address
RESEND_API_KEY=your_resend_api_key (optional)
```

```bash
# Run development server
npm run dev
# Open http://localhost:3000
```

### Smart Contract Setup

```bash
cd crowdfund-platform-foundry

# Install dependencies
forge install

# Set up environment
cp .env.example .env
```

Edit `.env`:
```env
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_etherscan_api_key
```

```bash
# Compile contracts
forge build

# Run tests
forge test

# Deploy to Sepolia
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

---

## 📜 Smart Contracts

### FundChain.sol (V2 Main)
```
Address: 0xC7CF086e5ECa53BFda4D75e46753AA9ed794A131
Network: Ethereum Sepolia
```

Key functions:
| Function | Description |
|----------|-------------|
| `createCampaign()` | Launch a new campaign with milestones |
| `donateToCampaign()` | Donate ETH to a campaign |
| `withdrawFunds()` | Owner withdraws when goal reached |
| `claimRefund()` | Backer claims refund if goal not met |
| `releaseMilestone()` | Release funds for completed milestone |
| `postUpdate()` | Owner posts on-chain update |
| `getCampaigns()` | Returns all campaigns |

### FundChainNFT.sol
```
Deployed with V2 — linked automatically
```
| Tier | Min Donation | Token |
|------|-------------|-------|
| Bronze | 0.01 ETH | ERC-721 |
| Silver | 0.05 ETH | ERC-721 |
| Gold | 0.10 ETH | ERC-721 |

### FundChainDAO.sol
| Function | Description |
|----------|-------------|
| `createProposal()` | Owner creates spending proposal |
| `vote()` | Backers vote FOR/AGAINST |
| `executeProposal()` | Execute passed proposal |
| `getProposalsByCampaign()` | Get all proposals for a campaign |

### FundChainMultiToken.sol
| Function | Description |
|----------|-------------|
| `donateETH()` | Donate native ETH |
| `donateToken()` | Donate USDC or USDT |
| `getCampaignBalance()` | Get balance in all tokens |
| `withdrawETH/Token()` | Owner withdraws funds |

---

## 🌊 User Flow

```
1. Connect MetaMask wallet
        ↓
2. Browse campaigns or Create new one
        ↓
3. Donate ETH/USDC/USDT → Earn NFT badge
        ↓
4. Owner posts updates, releases milestones
        ↓
5. Backers vote on spending proposals (DAO)
        ↓
6. Goal reached → Owner withdraws
   Goal missed → Backers claim refund
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | ✅ | thirdweb API client ID |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | ✅ | V2 FundChain contract address |
| `NEXT_PUBLIC_DAO_ADDRESS` | ⚡ | DAO contract address |
| `NEXT_PUBLIC_MULTITOKEN_ADDRESS` | ⚡ | MultiToken contract address |
| `RESEND_API_KEY` | 🔔 | Email notifications (optional) |
| `NEXT_PUBLIC_APP_URL` | 🔔 | Your production URL (optional) |

---

## 🧪 Testing

### Test on Sepolia Testnet
1. Get free ETH: [Alchemy Sepolia Faucet](https://sepoliafaucet.com)
2. Get test USDC: [Circle Faucet](https://faucet.circle.com)
3. Get test USDT: [Aave Faucet](https://staging.aave.com/faucet)

### Full Test Checklist
- [ ] Create a campaign with IPFS image
- [ ] Donate ETH to a campaign
- [ ] Check NFT badge minted (Bronze/Silver/Gold)
- [ ] Post a campaign update
- [ ] Create a DAO proposal
- [ ] Vote on a proposal
- [ ] Test refund (expired + goal not met)
- [ ] Withdraw funds (goal reached)
- [ ] Share campaign on social media
- [ ] Check analytics dashboard
- [ ] Test on mobile (MetaMask browser)

---

## 🚢 Deployment

### Vercel (Frontend)
1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set Root Directory to `frontend`
4. Add environment variables
5. Deploy!

### Contract Verification
```bash
forge verify-contract \
  --chain sepolia \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  0xC7CF086e5ECa53BFda4D75e46753AA9ed794A131 \
  src/FundChain.sol:FundChain
```

---

## 🔮 Roadmap

- [ ] Deploy to Ethereum Mainnet
- [ ] Add more ERC-20 token support
- [ ] Campaign categories marketplace
- [ ] Gasless transactions (EIP-2771)
- [ ] Mobile app (React Native)
- [ ] IPFS-hosted frontend (full decentralization)
- [ ] Cross-chain support (Polygon, Base)

---

## 👨‍💻 Author

**Aditya Chotaliya**  
[GitHub](https://github.com/adityachotaliya9299-jpg) · [Etherscan](https://sepolia.etherscan.io/address/0x72F668Aca488E6d5Aa847f3636aEb0B95413DEF7)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [thirdweb](https://thirdweb.com) — Web3 development framework
- [OpenZeppelin](https://openzeppelin.com) — Smart contract standards
- [Foundry](https://getfoundry.sh) — Ethereum development toolkit
- [Recharts](https://recharts.org) — Chart library
- [Resend](https://resend.com) — Email API

---

<div align="center">
  <strong>Built with ❤️ on Ethereum</strong><br>
  <sub>Transparent • Trustless • Borderless</sub>
</div>