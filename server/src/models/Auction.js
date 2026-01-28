class Auction {
  constructor(id, title, startingPrice, duration) {
    this.id = id;
    this.title = title;
    this.startingPrice = startingPrice;
    this.currentBid = startingPrice;
    this.highestBidder = null;
    this.endTime = Date.now() + duration;
    this.biddingLock = false;
    this.bidHistory = [];
    this.minBidIncrement = 10; 
  }

 
  isActive() {
    return Date.now() < this.endTime;
  }

  getTimeRemaining() {
    return Math.max(0, this.endTime - Date.now());
  }

  getMinimumNextBid() {
    return this.currentBid + this.minBidIncrement;
  }

  placeBid(userId, bidAmount) {
    if (!this.isActive()) {
      return { success: false, message: 'Auction has ended' };
    }

    const minBid = this.getMinimumNextBid();
    if (bidAmount < minBid) {
      return {
        success: false,
        message: `Bid must be at least ${minBid}`,
        minimumBid: minBid,
      };
    }

    if (this.biddingLock) {
      return {
        success: false,
        message: 'Another bid is being processed, please try again',
      };
    }

    this.biddingLock = true;

    try {
      if (!this.isActive()) {
        return { success: false, message: 'Auction has ended' };
      }
      const currentMinBid = this.getMinimumNextBid();
      if (bidAmount < currentMinBid) {
        return {
          success: false,
          message: `Outbid! Current bid is ${this.currentBid}`,
          currentBid: this.currentBid,
          highestBidder: this.highestBidder,
        };
      }

      const previousBidder = this.highestBidder;
      const previousBid = this.currentBid;

      this.currentBid = bidAmount;
      this.highestBidder = userId;

      this.bidHistory.push({
        userId,
        amount: bidAmount,
        timestamp: Date.now(),
      });

      return {
        success: true,
        message: 'Bid placed successfully',
        newBid: bidAmount,
        previousBid,
        previousBidder,
        highestBidder: userId,
      };
    } finally {
      this.biddingLock = false;
    }
  }
  getState() {
    return {
      id: this.id,
      title: this.title,
      startingPrice: this.startingPrice,
      currentBid: this.currentBid,
      highestBidder: this.highestBidder,
      endTime: this.endTime,
      timeRemaining: this.getTimeRemaining(),
      isActive: this.isActive(),
      minBidIncrement: this.minBidIncrement,
    };
  }
}

module.exports = Auction;
