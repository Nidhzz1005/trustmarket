
# **TrustMarket Setup and Execution Guide**

You have successfully completed the full-stack setup of the **TrustMarket Web3 marketplace**.

Follow the steps below to run everything and verify that your system is working correctly.

---

## **1. Prerequisites**

* **Node.js**
  Ensure Node.js is installed *(v16+ recommended)*.

* **MongoDB**
  Ensure MongoDB is running locally on port `27017`,
  **OR** update the `MONGO_URI` in your backend environment variables.

* **MetaMask Extension**
  Install and configure MetaMask in your browser using a test network.

---

## **1.5 Start the Local Blockchain (Hardhat)**

Since TrustMarket uses smart contracts for escrow, you need a local Ethereum blockchain.

### Steps:

1. Open a new terminal

2. Navigate to the smart contract folder:

   ```bash
   cd smart_contract
   ```

3. Initialize Hardhat (if not already done):

   ```bash
   npx hardhat init
   ```

4. Start the local blockchain node:

   ```bash
   npx hardhat node
   ```

### Output:

* 20 test accounts will be generated
* Each account has **10,000 fake ETH**

👉 Import any private key into MetaMask to simulate transactions.

---

## **2. Start the Backend**

The backend uses **Express + MongoDB**.

### Steps:

1. Open a new terminal

2. Navigate to backend:

   ```bash
   cd backend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the server:

   ```bash
   node server.js
   ```

### Expected Output:

```
Server running on port 5000
MongoDB connected
```

---

## **3. Start the Frontend**

The frontend is a **Vanilla JavaScript SPA**.

### Steps:

1. Open another terminal

2. Navigate to project root

3. Run a static server:

   ```bash
   npx serve .
   ```

4. Open browser:

   ```
   http://localhost:3000
   ```

---

## **4. How to Test Features**

Follow these flows to verify your system:

---

### **1. Create Account & Login**

* Click **"Connect"** (top right)
* Go to **Sign Up**
* Enter email and password

### Expected:

* Initial Trust Score = **50%**
* Welcome message displayed

---

### **2. Sell an Item (MetaMask Required)**

* Click **"＋ Sell"**

* Enter product details:

  * Title
  * Price
  * Condition
  * Category

* Click **"Publish Listing"**

### MetaMask Action:

* Popup appears → Sign message to confirm listing

### Result:

* Item goes live in marketplace

---

### **3. Buy an Item (Escrow Logic)**

* Use another account
* Find your listed item
* Click **"Buy Now"**

### MetaMask Action:

* Confirm transaction

### Result:

* Simulated escrow executes
* Trust Score increases for both users

---

### **4. Leave a Review**

* Go to purchased product page

* Fill:

  * Star rating ⭐
  * Review text

* Click **"Post Review"**

### Rules:

* Only buyers or high-trust users can review

### Result:

* Review appears instantly

---

### **5. Trust & Audit Page**

* Click **"Profile"**

  * View items
  * Wishlist
  * Trust Score

* Click **"Audit"**

  * Search user by email/name

### Result:

* Full activity log:

  * Account creation
  * Listings
  * Purchases
  * Reviews
  * Trust score changes over time

---

## ✅ **Final Note**

You now have a fully working **decentralized marketplace with trust scoring and escrow simulation**.


