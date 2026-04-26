🛡️ TrustMarket
Decentralized P2P Marketplace with Blockchain Escrow

TrustMarket is a peer-to-peer marketplace that solves one major issue in online buying and selling — lack of trust.

Instead of sending money directly to a seller, this project uses a smart contract (blockchain) to hold funds securely until the transaction is completed.

💡 Features
🔐 Smart Contract Escrow (safe payments)
⭐ Trust Score system (0–100%)
📊 Audit log of all user actions
🧾 Blockchain transaction verification
🖊️ MetaMask-based authentication for actions
🧰 Tech Stack
Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express.js
Database: MongoDB
Blockchain: Solidity, Hardhat
Web3: Ethers.js, MetaMask
🛠️ How to Run the Project
1. Start MongoDB

Make sure MongoDB is running on your system.

2. Start Blockchain (Hardhat)
cd smart_contract
npx hardhat node
3. Start Backend
cd backend
npm install
node server.js

You should see:

Server running on port 5000
MongoDB connected
4. Start Frontend
npx serve .

Open in browser:

http://localhost:3000
⚙️ Environment Variables (.env)

Create a .env file inside the backend folder:

PORT=5000
MONGO_URI=mongodb://localhost:27017/trustmarket
JWT_SECRET=your_secret_key
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=your_contract_address
🔍 How to Use
1. Create Account
Sign up using email and password
Initial trust score starts at 50
2. Sell Item
Click Sell
Fill product details
Confirm using MetaMask
3. Buy Item
Click Buy Now
Confirm transaction in MetaMask
4. Leave Review
Add rating and feedback after purchase
5. Check Trust & Audit
View trust score in profile
Open audit page to see user activity
⚠️ Important Notes
Connect MetaMask to localhost:8545
Import Hardhat test accounts into MetaMask
Do NOT upload .env file to GitHub
🔮 Future Improvements
Deploy on Polygon / Arbitrum (reduce gas fees)
Use IPFS for image storage
Add AI-based dispute resolution
📌 Project Status
Fully working locally
Uses real transactions on Hardhat network
🧾 Summary

TrustMarket combines the speed of traditional web apps with the security of blockchain, creating a safer and more transparent marketplace.
