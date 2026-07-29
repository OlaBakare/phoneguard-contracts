# PhoneGuard 🔒

**IMEI Security and Device Protection — on-chain.**

PhoneGuard is a Web3 platform for IMEI-based device security. Register phones on-chain, verify ownership before purchase, and report stolen devices immutably via Ethereum smart contracts.

## Features

- **On-chain Device Registry** — Register phones by IMEI (hashed for privacy) on the blockchain
- **Stolen Device Reporting** — Report stolen devices immutably; status is verifiable by anyone
- **Pre-Purchase Verification** — Check if a device is reported stolen before buying
- **Ownership Transfers** — Transfer device ownership on-chain when selling
- **Wallet Integration** — Connect with MetaMask or any Ethereum wallet
- **Light/Dark Theme** — Persistent theme preference with OS detection

## Smart Contract

[`contracts/PhoneGuardRegistry.sol`](contracts/PhoneGuardRegistry.sol) — An Ethereum smart contract that manages device ownership and stolen-status records.

| Function | Description |
|----------|-------------|
| `registerDevice` | Register a device by its IMEI hash |
| `reportStolen` | Mark your registered device as stolen |
| `checkDevice` | Look up a device's on-chain status |
| `transferOwnership` | Transfer device ownership to a new wallet |
| `clearStolenStatus` | Clear stolen status (owner only) |

## Tech Stack

- **Smart Contracts** — Solidity 0.8.28 + Hardhat
- **Frontend** — Vanilla HTML/CSS/JS + ethers.js
- **Wallet** — MetaMask / WalletConnect (EVM-compatible)

## Getting Started

```bash
# Install dependencies
npm install

# Compile smart contracts
npm run compile

# Run tests
npm test

# Start local Hardhat node
npm run node

# Deploy (local)
npx hardhat run scripts/deploy.js --network localhost

# Deploy (testnet)
npm run deploy -- sepolia

# Start dev server
npm run dev
```

## Project Structure

```
PhoneGuard/
├── contracts/              # Solidity smart contracts
│   └── PhoneGuardRegistry.sol
├── scripts/                # Deployment scripts
│   └── deploy.js
├── test/                   # Contract tests
│   └── PhoneGuardRegistry.test.js
├── abi/                    # Contract ABIs (generated)
├── index.html              # Landing page
├── dashboard.html           # Workspace dashboard
├── login.html              # Authentication
├── signup.html             # Registration
├── script.js               # Frontend logic
├── web3.js                 # Web3 integration module
├── styles.css              # All styles
├── hardhat.config.js       # Hardhat configuration
├── package.json
└── README.md
```

## Drips Wave — Contributing

This project participates in Drips Wave programs. Issues are tagged with complexity levels:

| Complexity | Points | Description |
|------------|--------|-------------|
| Trivial | 100 | Small, clearly bounded changes |
| Medium | 150 | Standard features or involved fixes |
| High | 200 | Complex features or new integrations |

Browse open issues, apply, and earn rewards for shipping PRs.

## License

MIT
