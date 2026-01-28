const Auction = require('../models/Auction');
const { v4: uuidv4 } = require('uuid');

class AuctionService {
  constructor() {
    this.auctions = new Map();
    this.initializeSampleAuctions();
  }

  initializeSampleAuctions() {
    const items = [
      { title: 'Vintage Camera', startingPrice: 50 },
      { title: 'Rare Book Collection', startingPrice: 30 },
      { title: 'Antique Watch', startingPrice: 100 },
      { title: 'Leather Jacket', startingPrice: 40 },
      { title: 'Gaming Console', startingPrice: 200 },
      { title: 'Original Painting', startingPrice: 150 },
    ];

    items.forEach((item) => {
      const id = uuidv4();
      const auction = new Auction(id, item.title, item.startingPrice, 5 * 60 * 1000);
      this.auctions.set(id, auction);
    });
  }

  getAllAuctions() {
    return Array.from(this.auctions.values()).map((auction) =>
      auction.getState()
    );
  }

  getAuction(auctionId) {
    const auction = this.auctions.get(auctionId);
    return auction ? auction.getState() : null;
  }

  placeBid(auctionId, userId, bidAmount) {
    const auction = this.auctions.get(auctionId);

    if (!auction) {
      return {
        success: false,
        message: 'Auction not found',
        statusCode: 404,
      };
    }

    if (typeof bidAmount !== 'number' || bidAmount <= 0) {
      return {
        success: false,
        message: 'Invalid bid amount',
        statusCode: 400,
      };
    }

    const result = auction.placeBid(userId, bidAmount);

    return {
      ...result,
      auctionId,
      statusCode: result.success ? 200 : 400,
    };
  }

  getMinimumBid(auctionId) {
    const auction = this.auctions.get(auctionId);
    return auction ? auction.getMinimumNextBid() : null;
  }

  getBidHistory(auctionId) {
    const auction = this.auctions.get(auctionId);
    return auction ? auction.bidHistory : [];
  }
}

module.exports = new AuctionService();
