require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Models
const User = require('./models/User');
const Listing = require('./models/Listing');
const Transaction = require('./models/Transaction');
const AuditLog = require('./models/AuditLog');
const Review = require('./models/Review');

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({ origin: true, credentials: true })); // Allow frontend

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trustmarket', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const setTokenCookie = (res, token) => {
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`);
};

// Middleware to get user from token
const authMiddleware = async (req, res, next) => {
  const cookieHeader = req.headers.cookie;
  let token = null;
  if (cookieHeader) {
    const match = cookieHeader.match(/token=([^;]+)/);
    if (match) token = match[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = await User.findById(decoded.id);
    } catch(e) {}
  }
  next();
};

const createAuditLog = async (user, action, details, txHash = null, oldTrustScore, newTrustScore) => {
  await AuditLog.create({
    userId: user?._id,
    userEmail: user?.email || user?.name || 'Guest',
    action,
    details,
    txHash,
    oldTrustScore,
    newTrustScore
  });
};

// =======================
// AUTH ROUTES
// =======================

app.post('/api/auth/email/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });

    user = new User({ name, email, password });
    await user.save();
    
    await createAuditLog(user, 'Account Created', `User ${name} signed up`, null, 0, 50);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    setTokenCookie(res, token);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.post('/api/auth/email/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) return res.status(400).json({ error: 'Invalid credentials' });

    const oldScore = user.trustScore;
    user.trustScore = Math.min(100, user.trustScore + 1);
    await user.save();
    
    await createAuditLog(user, 'Login', `User ${email} signed in`, null, oldScore, user.trustScore);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    setTokenCookie(res, token);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.post('/api/auth/metamask', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    // In production: Verify signature using ethers.utils.verifyMessage
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      user = new User({ name: 'Web3 User', walletAddress: walletAddress.toLowerCase() });
      await user.save();
      await createAuditLog(user, 'Wallet Connected', `New wallet ${walletAddress.slice(0,6)}... registered`, null, 0, 50);
    } else {
      const oldScore = user.trustScore;
      user.trustScore = Math.min(100, user.trustScore + 1);
      await user.save();
      await createAuditLog(user, 'Login', `Wallet ${walletAddress.slice(0,6)}... signed in`, null, oldScore, user.trustScore);
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    setTokenCookie(res, token);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.post('/api/auth/guest', async (req, res) => {
  const user = new User({ name: 'Guest User', isGuest: true });
  await user.save();
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  setTokenCookie(res, token);
  res.json({ token, user });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
  res.json({ msg: 'Logged out' });
});


// =======================
// LISTING ROUTES
// =======================

app.get('/api/listings', async (req, res) => {
  try {
    const listings = await Listing.find({ isSold: false }).sort({ createdAt: -1 });
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.get('/api/listings/my', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if(!user) return res.json({ listings: [] });
    const listings = await Listing.find({ sellerId: user._id });
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.get('/api/listings/purchased', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if(!user) return res.json({ listings: [] });
    const listings = await Listing.find({ buyerId: user._id });
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.get('/api/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.post('/api/listings', authMiddleware, upload.array('images', 4), async (req, res) => {
  try {
    const user = req.user;
    if(!user) return res.status(401).json({ error: 'Unauthorized' });

    const { title, description, price, category, condition, location, sellerWallet } = req.body;
    
    // Get uploaded file paths
    const images = req.files ? req.files.map(f => `http://localhost:5000/uploads/${f.filename}`) : [];
    
    // Update user's wallet if they didn't have one
    if (sellerWallet && !user.walletAddress) {
      user.walletAddress = sellerWallet;
      await user.save();
    }

    const listing = new Listing({ 
      title, description, price: parseFloat(price), images, category, condition, location, 
      sellerId: user._id, sellerName: user.name, sellerWallet: sellerWallet || user.walletAddress,
      trust: user.trustScore
    });
    await listing.save();
    
    await createAuditLog(user, 'Created Listing', `Listed item "${title}" for $${price}`, null, user.trustScore, user.trustScore);
    
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.delete('/api/listings/:id', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if(!user) return res.status(401).json({ error: 'Unauthorized' });

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.sellerId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can delete this listing' });
    }

    await Listing.deleteOne({ _id: listing._id });
    
    await createAuditLog(user, 'Deleted Listing', `Removed item "${listing.title}"`, null, user.trustScore, user.trustScore);
    
    res.json({ success: true, msg: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// =======================
// WISHLIST ROUTES
// =======================

app.get('/api/user/wishlist', authMiddleware, async (req, res) => {
  const user = req.user;
  if(!user) return res.json({ wishlist: [] });
  res.json({ wishlist: user.wishlist });
});

app.post('/api/user/wishlist/toggle', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if(!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { listingId } = req.body;
    let added = false;
    
    if (user.wishlist.includes(listingId)) {
      user.wishlist = user.wishlist.filter(id => id !== listingId);
    } else {
      user.wishlist.push(listingId);
      added = true;
    }
    
    await user.save();
    res.json({ wishlist: user.wishlist, added });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// =======================
// TRANSACTION ROUTES
// =======================

app.post('/api/transaction/prepare', authMiddleware, async (req, res) => {
  try {
    const { listingId } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (!listing.sellerWallet) return res.status(400).json({ error: 'Seller has no wallet' });
    
    // Mock conversion: $1 = 0.0005 ETH
    const amountEth = (listing.price * 0.0005).toFixed(4);
    
    res.json({ sellerWallet: listing.sellerWallet, amountEth });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.post('/api/transaction/confirm', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if(!user) return res.status(401).json({ error: 'Unauthorized' });

    const { listingId, txHash, amountEth } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    
    listing.isSold = true;
    listing.buyerId = user._id;
    listing.buyerName = user.name || user.email;
    await listing.save();
    
    user.totalPurchases += 1;
    const oldScore = user.trustScore;
    user.trustScore = Math.min(100, user.trustScore + 5);
    await user.save();
    
    const seller = await User.findById(listing.sellerId);
    if (seller) {
      seller.totalSales += 1;
      seller.trustScore = Math.min(100, seller.trustScore + 10);
      await seller.save();
    }
    
    await createAuditLog(user, 'Purchased Item', `Bought "${listing.title}" via Escrow`, txHash, oldScore, user.trustScore);
    
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// =======================
// AUDIT ROUTES
// =======================

app.get('/api/audit/logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.get('/api/audit/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find({ trustScore: { $gte: 80 } }).sort({ trustScore: -1 }).limit(5).select('name email trustScore');
    const lowUsers = await User.find({ trustScore: { $lt: 50 } }).sort({ trustScore: 1 }).limit(5).select('name email trustScore');
    res.json({ topUsers, lowUsers });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.get('/api/audit/search', async (req, res) => {
  try {
    const q = req.query.q;
    // Search user by email, name, or wallet
    const user = await User.findOne({
      $or: [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { walletAddress: new RegExp(q, 'i') }
      ]
    });
    
    if (user) {
      res.json({ user, transactions: [] });
    } else {
      res.json({ user: null });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// =======================
// REVIEW ROUTES
// =======================

app.get('/api/reviews/:listingId', async (req, res) => {
  try {
    const reviews = await Review.find({ listingId: req.params.listingId }).sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.get('/api/user/reviews', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if(!user) return res.status(401).json({ error: 'Unauthorized' });
    const reviews = await Review.find({ reviewerId: user._id }).populate('listingId', 'title images').sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.post('/api/reviews', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if(!user) return res.status(401).json({ error: 'Unauthorized' });

    const { listingId, rating, text } = req.body;
    
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    
    // In a real app we'd check if user actually purchased this listing or is highly verified
    const isBuyer = listing.buyerId && listing.buyerId.toString() === user._id.toString();
    if (user.trustScore < 60 && !isBuyer) {
      return res.status(403).json({ error: 'Only verified users or the actual buyer can leave a review' });
    }

    const reviewerInitials = (user.name || user.email || 'U').substring(0, 2).toUpperCase();
    
    const review = new Review({
      listingId,
      reviewerId: user._id,
      reviewerName: user.name || user.email,
      reviewerInitials,
      rating,
      text
    });
    await review.save();
    
    // Update listing review count
    listing.reviews += 1;
    await listing.save();
    
    // Increase user trust for leaving a review
    user.positiveReviews += 1;
    const oldScore = user.trustScore;
    user.trustScore = Math.min(100, user.trustScore + 2);
    await user.save();
    
    await createAuditLog(user, 'Left Review', `Reviewed "${listing.title}" with ${rating} stars`, null, oldScore, user.trustScore);
    
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
