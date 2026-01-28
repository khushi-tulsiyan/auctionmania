import React, { useState, useEffect, useContext, useCallback } from 'react';
import AuctionContext from '../context/AuctionContext';
import AuctionCard from './AuctionCard';
import { fetchAuctions } from '../utils/api';
import { useSocket, SOCKET_EVENTS } from '../hooks/useSocket';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const {
    auctions,
    setAuctions,
    userBids,
    updateUserBid,
    syncServerTime,
    getClientServerTime,
  } = useContext(AuctionContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId] = useState(`user_${Date.now()}`);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const handleBidUpdate = useCallback(
    (data) => {
      const { auctionId, newBid, highestBidder } = data;

      setAuctions((prev) =>
        prev.map((auction) =>
          auction.id === auctionId
            ? {
                ...auction,
                currentBid: newBid,
                highestBidder,
              }
            : auction
        )
      );

      if (highestBidder === userId) {
        updateUserBid(auctionId, true);
      }
    },
    [setAuctions, updateUserBid, userId]
  );

  const handleBidError = useCallback(
    (data) => {
      console.log('[BID_ERROR]', data);
    },
    []
  );

  const handleBidSuccess = useCallback(
    (data) => {
      console.log('[BID_SUCCESS]', data);
    },
    []
  );

  const handleOutbid = useCallback(
    (data) => {
      const { auctionId } = data;
      updateUserBid(auctionId, false);
    },
    [updateUserBid]
  );

  const handleAuctionState = useCallback(
    (data) => {
      const { auction, serverTime } = data;
      syncServerTime(serverTime);

      setAuctions((prev) =>
        prev.map((a) => (a.id === auction.id ? auction : a))
      );
    },
    [setAuctions, syncServerTime]
  );

  const handleHeartbeatAck = useCallback(
    (data) => {
      const { serverTime } = data;
      syncServerTime(serverTime);
    },
    [syncServerTime]
  );

  const socketEventHandlers = {
    [SOCKET_EVENTS.BID_UPDATE]: handleBidUpdate,
    [SOCKET_EVENTS.BID_ERROR]: handleBidError,
    [SOCKET_EVENTS.BID_SUCCESS]: handleBidSuccess,
    [SOCKET_EVENTS.OUTBID]: handleOutbid,
    [SOCKET_EVENTS.AUCTION_STATE]: handleAuctionState,
    [SOCKET_EVENTS.HEARTBEAT_ACK]: handleHeartbeatAck,
  };

  const { placeBid, joinAuction, leaveAuction, connected } = useSocket(
    userId,
    socketEventHandlers
  );

  useEffect(() => {
    setConnectionStatus(connected ? 'connected' : 'disconnected');
  }, [connected]);

  useEffect(() => {
    const loadAuctions = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchAuctions();

        if (result.success) {
          setAuctions(result.data);
          syncServerTime(result.serverTime);
        } else {
          setError('Failed to load auctions');
        }
      } catch (err) {
        setError('Error loading auctions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAuctions();
  }, [setAuctions, syncServerTime]);

  const handleBid = (auctionId, amount) => {
    if (!connected) {
      alert('Not connected to server. Please wait...');
      return;
    }

    placeBid(auctionId, amount);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🏆 AuctionMania</h1>
          <p className="subtitle">Real-time Bidding Platform</p>
        </div>
        <div className="header-status">
          <div className={`status-indicator ${connectionStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {connectionStatus === 'connected'
                ? 'Connected'
                : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading auctions...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="auction-grid">
            {auctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onBid={handleBid}
                userId={userId}
                isWinning={userBids[auction.id] || false}
                onJoinAuction={joinAuction}
                onLeaveAuction={leaveAuction}
              />
            ))}
          </div>
        )}

        {!loading && !error && auctions.length === 0 && (
          <div className="empty-state">
            <p>No auctions available</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
