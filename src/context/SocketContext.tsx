'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { affiliateCache } from '@/utils/affiliateCache';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

let globalSocket: Socket | null = null;
let currentJoinedUserId: string | null = null;

const getWsUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return window.location.origin;
  }
  return 'http://localhost:8000';
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);
  const [isConnected, setIsConnected] = useState(globalSocket?.connected || false);
  const pathname = usePathname();

  useEffect(() => {
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password';

    const checkAuthAndConnect = () => {
      const storedUser =
        typeof window !== 'undefined'
          ? localStorage.getItem('affiliate_user') || sessionStorage.getItem('affiliate_user')
          : null;

      let user: any = null;
      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch {}
      } else if (affiliateCache.me?.user) {
        user = affiliateCache.me.user;
      }

      if (isAuthPage && !user) {
        if (globalSocket) {
          globalSocket.disconnect();
          globalSocket.close();
          globalSocket = null;
        }
        currentJoinedUserId = null;
        setSocket(null);
        setIsConnected(false);
        return;
      }

      if (!globalSocket) {
        const wsUrl = getWsUrl();
        globalSocket = io(wsUrl, {
          addTrailingSlash: false,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
        });
      }

      const currentSocket = globalSocket;
      if (!currentSocket.connected) {
        currentSocket.connect();
      }

      setSocket(currentSocket);
      setIsConnected(currentSocket.connected);

      if (user?._id && currentJoinedUserId !== user._id) {
        currentJoinedUserId = user._id;
        currentSocket.emit('join_user_room', user._id);
        const affId = user.affiliateId || affiliateCache.me?.affiliate?._id;
        if (affId) {
          currentSocket.emit('join_affiliate_room', affId);
        }
      }
    };

    checkAuthAndConnect();
    const interval = setInterval(checkAuthAndConnect, 2000);

    const onConnect = () => {
      setIsConnected(true);
      checkAuthAndConnect();
    };

    const onDisconnect = () => {
      setIsConnected(false);
      currentJoinedUserId = null;
    };

    if (globalSocket) {
      globalSocket.on('connect', onConnect);
      globalSocket.on('disconnect', onDisconnect);
    }

    return () => {
      clearInterval(interval);
      if (globalSocket) {
        globalSocket.off('connect', onConnect);
        globalSocket.off('disconnect', onDisconnect);
      }
    };
  }, [pathname]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
