/**
 * Tier Match - Serwer główny Node.js (Express + Socket.io)
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../../src/types/socket';
import { RoomManager } from './roomManager';
import { setupSocketHandlers } from './socketHandler';

const PORT = process.env.PORT || 4000;
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const isOriginAllowed = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  if (
    !origin ||
    allowedOrigins.includes('*') ||
    allowedOrigins.includes(origin) ||
    origin.endsWith('.github.io') ||
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.onrender.com')
  ) {
    callback(null, true);
  } else {
    callback(null, true);
  }
};

const app = express();
app.use(cors({ origin: isOriginAllowed, credentials: true }));
app.use(express.json());

// Endpoint diagnostyczny (Healthcheck wymagany m.in. przez Render)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
  httpServer,
  {
    cors: {
      origin: isOriginAllowed,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  }
);

const roomManager = new RoomManager(io);
setupSocketHandlers(io, roomManager);

httpServer.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  🎮 TIER MATCH SERVER RUNNING ON PORT ${PORT} `);
  console.log(`  📡 WebSocket Gateway Ready for Clients       `);
  console.log(`===============================================`);
});

export { app, httpServer, io };
