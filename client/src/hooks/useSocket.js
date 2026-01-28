import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_AUCTION: 'JOIN_AUCTION',
  LEAVE_AUCTION: 'LEAVE_AUCTION',
  BID_PLACED: 'BID_PLACED',
  BID_UPDATE: 'BID_UPDATE',
  BID_SUCCESS: 'BID_SUCCESS',
  BID_ERROR: 'BID_ERROR',
  AUCTION_STATE: 'AUCTION_STATE',
  OUTBID: 'OUTBID',
  HEARTBEAT: 'HEARTBEAT',
  HEARTBEAT_ACK: 'HEARTBEAT_ACK',
  GET_AUCTION_STATE: 'GET_AUCTION_STATE',
  USER_JOINED: 'USER_JOINED',
  USER_LEFT: 'USER_LEFT',
};

export const useSocket = (userId, onEvents = {}) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || window.location.origin;

    socketRef.current = io(serverUrl, {
      query: { userId: userId || `user_${Date.now()}` },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('[Socket] Connected to server');
      setConnected(true);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      setConnected(false);
    });

    Object.entries(onEvents).forEach(([event, handler]) => {
      if (handler && typeof handler === 'function') {
        socket.on(event, handler);
      }
    });

    const heartbeatInterval = setInterval(() => {
      if (socket?.connected) {
        socket.emit(SOCKET_EVENTS.HEARTBEAT, {
          clientTime: Date.now(),
        });
      }
    }, 5000);

    return () => {
      clearInterval(heartbeatInterval);
      socket.disconnect();
    };
  }, [userId, onEvents]);

  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;
    Object.entries(onEvents).forEach(([event, handler]) => {
      if (handler && typeof handler === 'function') {
        socket.on(event, handler);
      }
    });

    return () => {
      Object.keys(onEvents).forEach((event) => {
        socket.off(event);
      });
    };
  }, [onEvents]);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const joinAuction = useCallback((auctionId) => {
    emit(SOCKET_EVENTS.JOIN_AUCTION, auctionId);
  }, [emit]);

  const leaveAuction = useCallback((auctionId) => {
    emit(SOCKET_EVENTS.LEAVE_AUCTION, auctionId);
  }, [emit]);

  const placeBid = useCallback((auctionId, amount) => {
    emit(SOCKET_EVENTS.BID_PLACED, {
      auctionId,
      amount,
    });
  }, [emit]);

  const getAuctionState = useCallback((auctionId) => {
    emit(SOCKET_EVENTS.GET_AUCTION_STATE, auctionId);
  }, [emit]);

  return {
    socket: socketRef.current,
    connected,
    emit,
    joinAuction,
    leaveAuction,
    placeBid,
    getAuctionState,
  };
};

export { SOCKET_EVENTS };
export default useSocket;
