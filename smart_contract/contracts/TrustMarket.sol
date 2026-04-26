// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TrustMarket {
    enum TxState { Created, Paid, Confirmed, Disputed, Refunded }

    struct Transaction {
        uint256 txId;
        uint256 productId;
        address buyer;
        address seller;
        uint256 amount;
        TxState state;
        uint256 timestamp;
    }

    struct Review {
        address reviewer;
        uint8 rating;
        string comment;
        uint256 timestamp;
    }

    mapping(address => uint256) public trustScores;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => Transaction[]) public productTransactions;
    mapping(uint256 => Review[]) public productReviews;
    mapping(uint256 => mapping(address => bool)) public hasBought;

    uint256 public transactionCount;

    event ProductPurchased(
        uint256 indexed transactionId,
        uint256 indexed productId,
        address indexed buyer,
        address seller,
        uint256 amount,
        uint256 timestamp
    );
    
    event EscrowConfirmed(
        uint256 indexed transactionId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event ReviewAdded(
        uint256 indexed productId,
        address indexed reviewer,
        uint8 rating,
        string comment,
        uint256 timestamp
    );

    event TrustScoreUpdated(address indexed user, uint256 newScore, string reason);

    function purchaseProduct(uint256 _productId, address payable _seller) public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(msg.sender != _seller, "Seller cannot buy their own product");

        transactionCount++;
        
        Transaction memory newTx = Transaction({
            txId: transactionCount,
            productId: _productId,
            buyer: msg.sender,
            seller: _seller,
            amount: msg.value,
            state: TxState.Paid,
            timestamp: block.timestamp
        });

        transactions[transactionCount] = newTx;
        productTransactions[_productId].push(newTx);
        hasBought[_productId][msg.sender] = true;

        // Funds are held in contract (Escrow)
        emit ProductPurchased(transactionCount, _productId, msg.sender, _seller, msg.value, block.timestamp);
    }
    
    function confirmReceipt(uint256 _txId) public {
        Transaction storage txn = transactions[_txId];
        require(txn.buyer == msg.sender, "Only buyer can confirm receipt");
        require(txn.state == TxState.Paid, "Transaction not in Paid state");
        
        txn.state = TxState.Confirmed;
        
        // Transfer funds to seller
        (bool success, ) = payable(txn.seller).call{value: txn.amount}("");
        require(success, "Transfer failed");

        // Reward trust points
        _updateTrustScore(msg.sender, 5, "Successful purchase");
        _updateTrustScore(txn.seller, 10, "Successful sale");

        emit EscrowConfirmed(_txId, msg.sender, txn.seller, txn.amount);
    }

    function leaveReview(uint256 _productId, uint8 _rating, string memory _comment) public {
        require(hasBought[_productId][msg.sender], "Only verified buyers can leave a review");
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");

        Review memory newReview = Review({
            reviewer: msg.sender,
            rating: _rating,
            comment: _comment,
            timestamp: block.timestamp
        });

        productReviews[_productId].push(newReview);
        
        // Reward for leaving a review
        _updateTrustScore(msg.sender, 2, "Left a review");

        emit ReviewAdded(_productId, msg.sender, _rating, _comment, block.timestamp);
    }

    function getReviews(uint256 _productId) public view returns (Review[] memory) {
        return productReviews[_productId];
    }

    function _updateTrustScore(address _user, uint256 _points, string memory reason) internal {
        if (trustScores[_user] == 0) {
            trustScores[_user] = 50 + _points;
        } else {
            trustScores[_user] += _points;
        }
        if (trustScores[_user] > 100) {
            trustScores[_user] = 100;
        }
        emit TrustScoreUpdated(_user, trustScores[_user], reason);
    }

    function getTrustScore(address _user) public view returns (uint256) {
        return trustScores[_user] == 0 ? 50 : trustScores[_user];
    }
}
