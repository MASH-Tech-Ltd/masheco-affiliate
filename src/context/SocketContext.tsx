'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

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

const getWsUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_WS_URL || '';
  return raw.split('#')[0].trim();
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);
  const [isConnected, setIsConnected] = useState(globalSocket?.connected || false);
  const pathname = usePathname();

  useEffect(() => {
    const storedUser =
      typeof window !== 'undefined'
        ? localStorage.getItem('affiliate_user') ||
          sessionStorage.getItem('affiliate_user') ||
          localStorage.getItem('merchantUser') ||
          sessionStorage.getItem('merchantUser') ||
          localStorage.getItem('user')
        : null;

    if (!storedUser) {
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

    let user: any = null;
    try {
      user = JSON.parse(storedUser);
    } catch {}

    if (currentJoinedUserId && currentJoinedUserId !== user?._id) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket.close();
        globalSocket = null;
      }
      currentJoinedUserId = null;
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

    const joinRooms = () => {
      if (!user?._id) return;
      if (currentJoinedUserId !== user._id) {
        currentJoinedUserId = user._id;
        currentSocket.emit('join_user_room', user._id);
        const affId = user?.affiliateId || user?._id;
        if (affId) {
          currentSocket.emit('join_affiliate_room', affId);
        }
      }
    };

    const onConnect = () => {
      setIsConnected(true);
      joinRooms();
    };

    const onDisconnect = () => {
      setIsConnected(false);
      currentJoinedUserId = null;
    };

    if (currentSocket.connected) {
      setIsConnected(true);
      joinRooms();
    }

    currentSocket.on('connect', onConnect);
    currentSocket.on('disconnect', onDisconnect);

    return () => {
      currentSocket.off('connect', onConnect);
      currentSocket.off('disconnect', onDisconnect);
    };
  }, [pathname]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
