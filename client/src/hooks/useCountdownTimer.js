import { useState, useEffect, useCallback } from 'react';

export const useCountdownTimer = (endTime, getClientServerTime) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeRemaining = useCallback(() => {
    if (!getClientServerTime) return 0;
    const now = getClientServerTime();
    const remaining = Math.max(0, endTime - now);
    return remaining;
  }, [endTime, getClientServerTime]);

  useEffect(() => {
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);
    setIsExpired(remaining === 0);

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      setIsExpired(remaining === 0);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [endTime, calculateTimeRemaining]);

  const formatTime = useCallback((ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    return {
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      milliseconds: String(milliseconds).padStart(2, '0'),
      totalSeconds,
    };
  }, []);

  return {
    timeRemaining,
    isExpired,
    formatted: formatTime(timeRemaining),
  };
};

export default useCountdownTimer;
