/**
 * Tier Match - Obsługa połączeń i zdarzeń WebSocket (Socket.io)
 */

import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../../src/types/socket';
import { RoomManager } from './roomManager';

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
  roomManager: RoomManager
): void {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>) => {
    console.log(`[Socket.io] Nowe połączenie: ${socket.id}`);

    // 1. Tworzenie pokoju
    socket.on('room:create', ({ playerName, avatarUrl }, callback) => {
      try {
        const { room, hostId } = roomManager.createRoom(playerName, avatarUrl);
        socket.data.playerId = hostId;
        socket.data.roomCode = room.code;

        socket.join(room.code);

        socket.emit('room:joined', { playerId: hostId, roomCode: room.code });
        roomManager.broadcastState(room.code);

        if (callback) {
          callback({ success: true, roomCode: room.code });
        }
      } catch (err: any) {
        console.error('Błąd podczas tworzenia pokoju:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 2. Dołączanie do pokoju
    socket.on('room:join', ({ roomCode, playerName, avatarUrl }, callback) => {
      const normalizedCode = roomCode.trim().toUpperCase();
      const result = roomManager.joinRoom(normalizedCode, playerName, avatarUrl);

      if (!result.success || !result.playerId) {
        if (callback) callback({ success: false, error: result.error });
        socket.emit('game:error', { message: result.error || 'Nie udało się dołączyć do pokoju.' });
        return;
      }

      socket.data.playerId = result.playerId;
      socket.data.roomCode = normalizedCode;

      socket.join(normalizedCode);
      socket.emit('room:joined', { playerId: result.playerId, roomCode: normalizedCode });
      roomManager.broadcastState(normalizedCode);

      if (callback) callback({ success: true });
    });

    // 3. Start gry przez Hosta
    socket.on('game:start', () => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) return;

      const started = roomManager.startGame(roomCode, playerId);
      if (!started) {
        socket.emit('game:error', { message: 'Nie można rozpocząć gry. Wymaganych co najmniej 2 graczy.' });
      }
    });

    // 3b. Wybór kategorii przez Twórcę
    socket.on('creator:select_category', ({ categoryId }) => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) return;

      const success = roomManager.selectCategory(roomCode, playerId, categoryId);
      if (!success) {
        socket.emit('game:error', { message: 'Nie możesz wybrać kategorii w tym momencie.' });
      }
    });

    // 4. Aktualizacja szkicu (live draft)
    socket.on('placement:draft', ({ placement }) => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) return;

      roomManager.updateDraft(roomCode, playerId, placement);
    });

    // 5. Zatwierdzenie ułożenia przez Twórcę
    socket.on('creator:submit', ({ placement }) => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) return;

      const success = roomManager.submitCreatorPlacement(roomCode, playerId, placement);
      if (!success) {
        socket.emit('game:error', { message: 'Nie jesteś Twórcą lub runda tworzenia wygasła.' });
      }
    });

    // 6. Zatwierdzenie typowania przez Zgadującego
    socket.on('guesser:submit', ({ placement }) => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) return;

      const success = roomManager.submitGuesserPlacement(roomCode, playerId, placement);
      if (!success) {
        socket.emit('game:error', { message: 'Nie można zatwierdzić typu w obecnej fazie.' });
      }
    });

    // 7. Przejście do następnej rundy
    socket.on('game:next_round', () => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) return;

      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      const player = room.players.get(playerId);
      if (!player || !player.isHost) {
        socket.emit('game:error', { message: 'Tylko gospodarz pokoju może przejść do kolejnej rundy.' });
        return;
      }

      roomManager.startNextRound(room);
    });

    // 8. Rozłączenie gracza
    socket.on('disconnect', () => {
      const { roomCode, playerId } = socket.data;
      if (roomCode && playerId) {
        console.log(`[Socket.io] Gracz ${playerId} rozłączony z pokoju ${roomCode}`);
        roomManager.handleDisconnect(roomCode, playerId);
      }
    });
  });
}
