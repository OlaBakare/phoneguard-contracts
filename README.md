# PhoneGuard

**The on-chain phone marketplace for buyers, repair shops, and device teams.**

PhoneGuard connects buyers, repair shops, and device teams with on-chain IMEI verification, wallet payments, and secure marketplace trading. Every phone is verified on the blockchain before purchase.

## Sections

### For Buyers
Verify IMEI history before purchase, pay from your wallet, and receive ownership on-chain automatically. Shop for new, refurbished, or repaired phones with confidence.

### For Repair Shops
Scan devices at intake, accept wallet payments with no chargebacks, record repair history on-chain, and list refurbished phones in the marketplace.

### For Device Teams
Manage fleets, track inventory, and stay audit-ready with immutable on-chain records. Bulk register, transfer, and check devices.

## Smart Contract

[`contracts/PhoneGuardRegistry.sol`](contracts/PhoneGuardRegistry.sol)

| Feature | Functions |
|---------|-----------|
| **Device Registry** | `registerDevice`, `checkDevice`, `reportStolen`, `clearStolenStatus`, `transferOwnership` |
| **Wallet** | `deposit`, `withdraw`, `getBalance` |
| **Marketplace** | `createListing`, `buyListing`, `cancelListing`, `getActiveListings` |
| **Repair Shop** | `requestRepair`, `completeRepair`, `getRepairsForCustomer`, `getRepairsForShop` |

## Tech Stack

- **Smart Contracts** — Solidity 0.8.28 + Hardhat
- **Frontend** — Vanilla HTML/CSS/JS + ethers.js
- **Wallet** — MetaMask (EVM-compatible)

## Getting Started

```bash
npm install
npm run compile
npm test
npm run dev
```

## Project Structure

```
PhoneGuard/
├── contracts/              # Solidity smart contracts
├── scripts/                # Deployment scripts
├── test/                   # Contract tests
├── index.html              # Landing page (Buyers, Shops, Teams + Marketplace)
├── dashboard.html          # Dashboard (wallet, listings, devices)
├── login.html / signup.html
├── web3.js                 # Web3 integration module
├── script.js               # Frontend logic
├── styles.css              # All styles
└── README.md
```

## Drips Wave

This project participates in Drips Wave programs. Issues tagged with complexity levels (Trivial / Medium / High) are open for contributors.
