🛡️ TrustMarket
A Decentralized P2P Marketplace with Blockchain-Based Trust

TrustMarket is a peer-to-peer marketplace built to solve one major problem in online buying and selling — trust.

Instead of relying on a company to manage payments, this project uses a smart contract (blockchain) to hold money safely until both buyer and seller complete the transaction.

💡 What this project does
Lets users buy and sell products like a normal marketplace
Uses blockchain escrow so money is not directly sent to the seller
Tracks user activity to create a trust score
Maintains a transparent audit system for all actions
⚙️ How it works (Simple Flow)
User logs in
Seller lists a product
Buyer clicks “Buy”
Money goes to a smart contract (not the seller)
Once the deal is completed, money is released
Transaction is permanently recorded
🧰 Tech Stack
Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express.js
Database: MongoDB
Blockchain: Solidity, Hardhat
Web3: Ethers.js, MetaMask
🔐 Authentication
Uses JWT (JSON Web Tokens)
Stored in HttpOnly cookies for security
Backend verifies user before allowing sensitive actions
🗂️ Data Storage

Blockchain stores:

Money (ETH in escrow)
Transactions
Wallet addresses

MongoDB stores:

Product details
Images
User data
Reviews and trust scores
🛠️ How to run the project
Step 1: Start blockchain
cd smart_contract
npx hardhat node
Step 2: Start backend
cd backend
node server.js
Step 3: Run frontend
npx serve .
🔑 Environment Variables (.env)

Create a .env file:

PORT=5000
MONGO_URI=mongodb://localhost:27017/trustmarket
JWT_SECRET=your_secret_key
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=your_contract_address

⚠️ Do not upload .env to GitHub

🌟 What makes it different
Uses blockchain escrow instead of trusting a company
Has a trust score system based on user actions
Keeps a full audit log for transparency
Combines Web2 speed + Web3 security
🔮 Future improvements
Deploy on Polygon or Arbitrum (reduce gas fees)
Use IPFS for storing images
Add AI-based dispute handling
📌 Status
Fully working locally
Real transactions using Hardhat network
🧾 Final Note

This project shows how traditional web apps and blockchain can work together to build a safer marketplace.