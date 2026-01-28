const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const AuctionService = require('./services/AuctionService');
const { initializeSocketHandlers } = require('./utils/socketHandlers');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
});

app.use(cors());
app.use(express.json());
app.use(express.static('../client/build'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

app.get('/items', (req, res) => {
  try {
    const items = AuctionService.getAllAuctions();
    res.status(200).json({
      success: true,
      data: items,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
      error: error.message,
    });
  }
});

app.get('/items/:auctionId', (req, res) => {
  try {
    const { auctionId } = req.params;
    const auction = AuctionService.getAuction(auctionId);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found',
      });
    }

    res.status(200).json({
      success: true,
      data: auction,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching auction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auction',
      error: error.message,
    });
  }
});

app.get('/items/:auctionId/bid-history', (req, res) => {
  try {
    const { auctionId } = req.params;
    const history = AuctionService.getBidHistory(auctionId);

    if (history === null) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found',
      });
    }

    res.status(200).json({
      success: true,
      data: history,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching bid history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bid history',
      error: error.message,
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile('../client/build/index.html', { root: __dirname });
});

io.on('connection', (socket) => {
  initializeSocketHandlers(io, socket);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   AuctionMania Server Started 🚀       ║
╠════════════════════════════════════════╣
║   HTTP: http://localhost:${PORT}        ║
║   WebSocket: ws://localhost:${PORT}     ║
║   CORS: ${process.env.CLIENT_URL || 'http://localhost:3001'}
╚════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
