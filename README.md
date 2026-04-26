# 🚀 TrustMarket – Decentralized Marketplace (Web3 OLX)

A hybrid Web2 + Web3 marketplace where users can securely buy and sell items using blockchain-based escrow and a trust scoring system.

---

## 🏗️ System Architecture

<img width="1536" height="1024" alt="TrustMarket Architecture" src="https://github.com/user-attachments/assets/1396e8bb-def7-4955-9a3f-fe5cdb02dc5f" />

This diagram represents the hybrid architecture of TrustMarket.
MongoDB and the backend handle fast data operations, while blockchain smart contracts manage secure escrow-based transactions, ensuring both performance and trust.

---

## 🛠️ Tech Stack

* **Frontend**: HTML, CSS, JavaScript (SPA)
* **Backend**: Node.js, Express.js
* **Database**: MongoDB
* **Blockchain**: Solidity, Hardhat
* **Web3 Integration**: ethers.js, MetaMask

---

## 🔄 Workflow Overview

1. User signs up and connects wallet
2. Seller lists item with MetaMask signature
3. Buyer places order and pays via smart contract
4. Funds are locked in escrow
5. Seller ships item
6. Buyer confirms delivery
7. Payment is released to seller

---

## ⚙️ Prerequisites

* **Node.js** (v16+ recommended)
* **MongoDB** (running locally on port `27017` or configured via `MONGO_URI`)
* **MetaMask Extension** (configured on a test network)

---

## ⛓️ Start Local Blockchain (Hardhat)

1. Open a terminal
2. Navigate to smart contract folder:

   ```bash
   cd smart_contract
   ```
3. Initialize Hardhat (if not already done):

   ```bash
   npx hardhat init
   ```
4. Start local blockchain:

   ```bash
   npx hardhat node
   ```

### Output:

* 20 test accounts generated
* Each account has **10,000 test ETH**

👉 Import a private key into MetaMask to simulate transactions.

---

## 🖥️ Start Backend Server

1. Open a new terminal
2. Navigate to backend:

   ```bash
   cd backend
   ```
3. Install dependencies:

   ```bash
   npm install
   ```
4. Start server:

   ```bash
   node server.js
   ```

### Expected Output:

```
Server running on port 5000
MongoDB connected
```

---

## 🌐 Start Frontend

1. Open another terminal
2. Navigate to project root
3. Run static server:

   ```bash
   npx serve .
   ```
4. Open browser:

   ```
   http://localhost:3000
   ```

---

## 🧪 Feature Testing Guide

### 👤 1. Create Account & Login

* Click **Connect**
* Sign up with email and password

**Result:**

* Initial Trust Score = 50%
* User dashboard loads

---

### 📦 2. Sell an Item

* Click **Sell**
* Enter product details
* Upload image
* Click **Publish Listing**

**MetaMask Action:**

* Sign message (ownership proof)

**Result:**

* Item appears in marketplace

---

### 💰 3. Buy an Item (Escrow)

* Use another account
* Select item → Click **Buy Now**

**MetaMask Action:**

* Confirm transaction

**Result:**

* Payment sent to smart contract (escrow)
* Seller notified

---

### 🚚 4. Delivery & Payment Release

* Seller ships item
* Buyer confirms delivery

**Result:**

* Smart contract releases funds to seller

---

### ⭐ 5. Reviews & Trust Score

* Buyer leaves rating and review

**Result:**

* Trust score updates automatically
* Review visible publicly

---

### 📊 6. Audit System

* View profile → Trust Score
* Access audit page

**Result:**

* Full transaction history logged
* Transparent user activity

---

## 🎯 Key Features

* 🔐 Secure escrow using blockchain smart contracts
* ⭐ Trust scoring system for users
* 📊 Transparent audit log
* 🔗 Wallet-based identity verification
* ⚡ Fast performance using hybrid architecture

---

## 🎯 Conclusion

TrustMarket demonstrates a scalable hybrid architecture combining Web2 efficiency with Web3 trust.
It eliminates the need for intermediaries by using smart contracts for secure transactions, while maintaining high performance through traditional backend systems.

---

## 📌 Future Improvements

* Integrate IPFS for decentralized image storage
* Add dispute resolution system
* Deploy on public blockchain (Polygon/Ethereum)
* Enhance UI with React or Flutter

---
