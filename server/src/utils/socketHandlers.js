const AuctionService = require('../services/AuctionService');

function initializeSocketHandlers(io, socket) {
  const userId = socket.handshake.query.userId || socket.id;
  const userSocketId = socket.id;

  console.log(`[Socket] User ${userId} connected (${userSocketId})`);

  socket.on('JOIN_AUCTION', (auctionId) => {
    socket.join(`auction:${auctionId}`);
    const auctionState = AuctionService.getAuction(auctionId);

    if (auctionState) {
      socket.emit('AUCTION_STATE', {
        auction: auctionState,
        serverTime: Date.now(),
      });

      io.to(`auction:${auctionId}`).emit('USER_JOINED', {
        auctionId,
        totalUsers: io.sockets.adapter.rooms.get(`auction:${auctionId}`).size,
      });

      console.log(
        `[Socket] User ${userId} joined auction ${auctionId}`
      );
    }
  });

  socket.on('LEAVE_AUCTION', (auctionId) => {
    socket.leave(`auction:${auctionId}`);
    io.to(`auction:${auctionId}`).emit('USER_LEFT', {
      auctionId,
      totalUsers: io.sockets.adapter.rooms.get(`auction:${auctionId}`)?.size || 0,
    });
    console.log(`[Socket] User ${userId} left auction ${auctionId}`);
  });

  socket.on('BID_PLACED', (data) => {
    const { auctionId, amount } = data;

    const result = AuctionService.placeBid(auctionId, userId, amount);

    if (result.success) {
      io.to(`auction:${auctionId}`).emit('BID_UPDATE', {
        auctionId,
        newBid: result.newBid,
        highestBidder: result.highestBidder,
        previousBidder: result.previousBidder,
        previousBid: result.previousBid,
        timestamp: Date.now(),
      });

      socket.emit('BID_SUCCESS', {
        auctionId,
        message: 'Your bid was accepted!',
        newBid: result.newBid,
      });

      console.log(
        `[Bid] User ${userId} bid $${amount} on auction ${auctionId}`
      );

      if (result.previousBidder && result.previousBidder !== userId) {
        io.to(`user:${result.previousBidder}`).emit('OUTBID', {
          auctionId,
          newBid: result.newBid,
          outbidBy: userId,
          timestamp: Date.now(),
        });
      }
    } else {
      socket.emit('BID_ERROR', {
        auctionId,
        message: result.message,
        currentBid: result.currentBid,
        minimumBid: result.minimumBid,
        timestamp: Date.now(),
      });

      console.log(
        `[Bid] User ${userId} failed to bid on ${auctionId}: ${result.message}`
      );
    }
  });

  socket.on('HEARTBEAT', (clientData) => {
    socket.emit('HEARTBEAT_ACK', {
      serverTime: Date.now(),
      clientTime: clientData?.clientTime,
    });
  });

  socket.on('GET_AUCTION_STATE', (auctionId) => {
    const auctionState = AuctionService.getAuction(auctionId);
    socket.emit('AUCTION_STATE', {
      auction: auctionState,
      serverTime: Date.now(),
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] User ${userId} disconnected: ${reason}`);
  });

  socket.on('error', (error) => {
    console.error(`[Socket] Error for user ${userId}:`, error);
  });
}

module.exports = { initializeSocketHandlers };
