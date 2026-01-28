import React, { useState, useEffect, useContext } from 'react';
import AuctionContext from '../context/AuctionContext';
import useCountdownTimer from '../hooks/useCountdownTimer';
import '../styles/AuctionCard.css';

const AuctionCard = ({
  auction,
  onBid,
  userId,
  isWinning,
  onJoinAuction,
  onLeaveAuction,
}) => {
  const { getClientServerTime } = useContext(AuctionContext);
  const { formatted, isExpired } = useCountdownTimer(
    auction.endTime,
    getClientServerTime
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousBid, setPreviousBid] = useState(auction.currentBid);
  const [bidError, setBidError] = useState(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (auction.currentBid > previousBid) {
      setIsAnimating(true);
      setPreviousBid(auction.currentBid);

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [auction.currentBid, previousBid]);

  useEffect(() => {
    if (isExpired && isActive) {
      setIsActive(false);
    }
  }, [isExpired, isActive]);

  useEffect(() => {
    onJoinAuction?.(auction.id);
    return () => {
      onLeaveAuction?.(auction.id);
    };
  }, [auction.id, onJoinAuction, onLeaveAuction]);

  const handleBidClick = () => {
    setBidError(null);
    const nextBid = auction.currentBid + 10;

    if (!isActive || isExpired) {
      setBidError('Auction has ended');
      return;
    }

    onBid?.(auction.id, nextBid);
  };

  return (
    <div className="auction-card">
      <div className="auction-header">
        <h3 className="auction-title">{auction.title}</h3>
        {isWinning && !isExpired && (
          <span className="badge badge-winning">Winning</span>
        )}
        {isExpired && <span className="badge badge-ended">Ended</span>}
      </div>

      <div className="auction-body">
        <div className={`bid-section ${isAnimating ? 'animate-flash' : ''}`}>
          <p className="bid-label">Current Bid</p>
          <p className="bid-amount">${auction.currentBid}</p>
        </div>

        <div className="starting-price">
          Starting: ${auction.startingPrice}
        </div>

        <div className="countdown-section">
          <div className="countdown">
            {isExpired ? (
              <span className="countdown-text countdown-expired">
                Auction Ended
              </span>
            ) : (
              <>
                <span className="countdown-time">
                  {formatted.minutes}:{formatted.seconds}
                </span>
                <span className="countdown-ms">.{formatted.milliseconds}</span>
              </>
            )}
          </div>
        </div>

        {auction.highestBidder && !isExpired && (
          <div className="highest-bidder">
            {auction.highestBidder === userId ? (
              <p className="your-bid">You are the highest bidder</p>
            ) : (
              <p className="other-bid">
                Leader: {auction.highestBidder.substring(0, 8)}...
              </p>
            )}
          </div>
        )}

        {isExpired && auction.highestBidder && (
          <div className="final-result">
            {auction.highestBidder === userId ? (
              <p className="won-badge">🏆 You Won!</p>
            ) : (
              <p className="final-price">Sold for ${auction.currentBid}</p>
            )}
          </div>
        )}

        {bidError && <div className="error-message">{bidError}</div>}
      </div>

      <div className="auction-footer">
        <button
          className={`bid-button ${
            !isActive || isExpired ? 'bid-button-disabled' : ''
          }`}
          onClick={handleBidClick}
          disabled={!isActive || isExpired}
        >
          {isExpired ? 'Auction Ended' : `Bid +$10`}
        </button>
        <div className="min-bid-info">
          Min: ${auction.currentBid + auction.minBidIncrement}
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;
