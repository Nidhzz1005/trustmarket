---

# 🚀 TrustMarket – Decentralized Marketplace (Web3 OLX)

A hybrid **Web2 + Web3 marketplace** where users can securely buy and sell items using blockchain-based escrow, MetaMask authentication, and a trust scoring system.

---

## 🌐 System Architecture

<img src="https://github.com/user-attachments/assets/1396e8bb-def7-4955-9a3f-fe5cdb02dc5f" width="100%"/>

**Overview:**
MongoDB handles data storage, Node.js manages APIs, and Solidity smart contracts ensure secure escrow-based transactions. MetaMask acts as the identity layer.

---

## 🛠️ Tech Stack

**Frontend:** HTML, CSS, JavaScript (SPA)
**Backend:** Node.js, Express.js
**Database:** MongoDB
**Blockchain:** Solidity, Hardhat
**Web3 Integration:** ethers.js, MetaMask

---

## 🔄 Workflow

1. User connects MetaMask wallet
2. Seller creates product listing
3. Buyer purchases via smart contract
4. Funds locked in escrow
5. Delivery confirmation
6. Smart contract releases payment
7. Trust score updates automatically

---

## ⚙️ Prerequisites

* Node.js (v16+)
* MongoDB (local or cloud)
* MetaMask extension
* Hardhat setup

---

## ⛓️ Smart Contract Setup

```bash
cd smart_contract
npx hardhat init
npx hardhat node
```

👉 Import test account into MetaMask

---

## 🖥️ Backend Setup

```bash
cd backend
npm install
node server.js
```

---

## 🌐 Frontend Setup

```bash
npx serve .
```

Open:

```
http://localhost:3000
```

---

# 📸 Screenshots

## 🏠 Home Page

  <img src="assets/home_page.png" width="350"/>

---

## 📦 Product Listings

  <img src="assets/product_listings.png" width="350"/>

---

## ✅ Listing Confirmation (MetaMask)

  <img src="assets/product_listing_confirmation.png" width="350"/>

---

## 💰 Purchase via MetaMask

  <img src="assets/purchase_metamask_confirmation.png" width="350"/>

---

## ⭐ Trust Score System

  <img src="assets/trust_score_working.png" width="350"/>

---

## 👤 User Profile

  <img src="assets/user_profile.png" width="350"/>

---

## 📊 Audit Page

  <img src="assets/audit_page.png" width="350"/>

---

# 🧪 Feature Testing

### 👤 Authentication

* Login / signup system
* Wallet connection via MetaMask

### 📦 Selling Flow

* Add product
* Upload image
* Sign transaction

### 💰 Buying Flow

* Purchase item
* Escrow payment system

### 🚚 Delivery Flow

* Seller ships item
* Buyer confirms delivery
* Smart contract releases funds

### ⭐ Trust System

* Dynamic reputation scoring
* Based on transactions & reviews

---

# 🎯 Key Features

* 🔐 Blockchain escrow system
* 👛 MetaMask authentication
* ⭐ Trust scoring engine
* 📊 Transparent audit logs
* ⚡ Hybrid Web2 + Web3 architecture
* 🧾 Real-time transaction tracking

---

# 📌 Project Highlights

✔ Real-world OLX-like use case
✔ Smart contract-based payments
✔ Full-stack Web3 integration
✔ Production-style architecture
✔ Clean modular folder structure

---

# 🚀 Future Improvements

* 🌐 Deploy on Polygon / Ethereum mainnet
* 📦 Integrate IPFS for decentralized storage
* ⚖️ Add dispute resolution system
* 📱 Convert to React / Next.js frontend
* 🔔 Add real-time notifications

---
