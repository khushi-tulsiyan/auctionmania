import React, { createContext, useState, useCallback, useRef } from 'react';

const AuctionContext = createContext();

export const AuctionProvider = ({ children }) => {
  const [auctions, setAuctions] = useState([]);
  const [userBids, setUserBids] = useState({});
  const [serverTime, setServerTime] = useState(Date.now());
  const [timeOffset, setTimeOffset] = useState(0);
  const syncIntervalRef = useRef(null);

  const updateAuctionState = useCallback((auctionId, updates) => {
    setAuctions((prev) =>
      prev.map((auction) =>
        auction.id === auctionId ? { ...auction, ...updates } : auction
      )
    );
  }, []);

  const updateUserBid = useCallback((auctionId, isWinning) => {
    setUserBids((prev) => ({
      ...prev,
      [auctionId]: isWinning,
    }));
  }, []);

  const syncServerTime = useCallback((newServerTime) => {
    const now = Date.now();
    setTimeOffset(newServerTime - now);
    setServerTime(newServerTime);
  }, []);

  const getClientServerTime = useCallback(() => {
    return Date.now() + timeOffset;
  }, [timeOffset]);

  const value = {
    auctions,
    setAuctions,
    userBids,
    updateUserBid,
    updateAuctionState,
    serverTime,
    timeOffset,
    syncServerTime,
    getClientServerTime,
    syncIntervalRef,
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
};

export default AuctionContext;
