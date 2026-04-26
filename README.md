# TrustMarket Setup and Execution Guide

You have successfully completed the full-stack setup of the TrustMarket Web3 marketplace.

Here are the step-by-step instructions on how to run everything and check that it's working:

## 1. Prerequisites
- **Node.js**: Ensure you have Node.js installed (v16+ recommended).
- **MongoDB**: Ensure MongoDB is running locally on port `27017` or update the `MONGO_URI` in your backend environment variables to point to your cluster.
- **MetaMask Extension**: Ensure your browser has the MetaMask extension installed and configured for a test network.

## 1.5. Start the Local Blockchain (Hardhat)
Since TrustMarket relies on smart contracts for escrow, you need a local Ethereum blockchain to test transactions.
1. Open a new terminal.
2. Navigate to the `smart_contract` directory:
   ```bash
   cd c:\Users\Nidhi\Downloads\trustmarket-fronted\smart_contract
   ```
3. Initialize a basic hardhat project if you haven't already:
   ```bash
   npx hardhat init
   ```
4. Start the local node:
   ```bash
   npx hardhat node
   ```
   This will spin up a local blockchain and give you 20 test accounts with 10,000 fake ETH each. You can import one of these private keys into MetaMask to simulate buying and selling.

## 2. Start the Backend
The backend runs on Express and handles MongoDB operations for listings, users, and audit logs.
1. Open a new terminal.
2. Navigate to the backend directory:
   \`\`\`bash
   cd c:\Users\Nidhi\Downloads\trustmarket-fronted\backend
   \`\`\`
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Start the server:
   \`\`\`bash
   node server.js
   \`\`\`
   You should see `Server running on port 5000` and `MongoDB connected`.

## 3. Start the Frontend
The frontend is a vanilla Javascript SPA.
1. Open a second terminal.
2. Navigate to the project root:
   \`\`\`bash
   cd c:\Users\Nidhi\Downloads\trustmarket-fronted
   \`\`\`
3. You can use any static server. If you have `npx` installed, simply run:
   \`\`\`bash
   npx serve .
   \`\`\`
4. Open your browser and navigate to the URL provided by the serve command (usually `http://localhost:3000`).

## 4. How to Test Features
Follow these steps to verify the functionality:

**1. Create an Account & Login:**
- Click "Connect" on the top right.
- Use the **Sign Up** tab to create an account with email and password.
- Observe your initial Trust Score (50%) and welcome message.

**2. Sell an Item (Requires MetaMask):**
- Click the "＋ Sell" button.
- Fill out the product details (title, price, condition, category).
- Click "Publish Listing".
- **MetaMask** will pop up asking you to sign a message to confirm the listing publication (as requested).
- Once signed, the item will be live and visible in the Browse/Home sections.

**3. Buy an Item (Escrow Logic):**
- Create another account (or browse as a different user).
- Find the product you listed and click "Buy Now".
- **MetaMask** will pop up to transfer funds. In the simulated escrow logic, the backend will process the transaction.
- Once confirmed, Trust points for both the seller and the buyer will increase.

**4. Leave a Review:**
- After purchasing, navigate to the product detail page.
- You will see a "Leave a Review" form. 
- Only users who have purchased items (or have a high trust score) can successfully submit a review.
- Fill out the stars and text, and click "Post Review". The review will instantly appear below.

**5. Trust & Audit Page:**
- Click "Profile" to see your items, wishlists, and your current Trust Score.
- Click "Audit" on the navbar.
- Search for a user by their email or name to see their Trust Audit details. You will see a comprehensive log of every action (Account Created, Listed Item, Left Review, Purchased Item) and how their Trust Score changed over time.

Enjoy your secure, decentralized Web3 marketplace!
