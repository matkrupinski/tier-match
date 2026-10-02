/**
 * Tier Match - RoomManager: Autorytatywna maszyna stanów pokoju
 * Cykl: LOBBY -> CREATING -> GUESSING -> REVEAL -> SCOREBOARD
 */

import { Server, Socket } from 'socket.io';
import {
  Player,
  PlayerRoundResult,
  RoomPhase,
  ServerRoom,
  TierPlacement,
  PHASE_DURATIONS,
} from '../../src/types/game';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../../src/types/socket';
import {
  createEmptyPlacement,
  evaluateGuesser,
  sanitizeRoomState,
  selectRandomCategory,
  selectCategoryOptions,
} from './gameEngine';

export class RoomManager {
  private rooms: Map<string, ServerRoom> = new Map();
  private io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>) {
    this.io = io;
  }

  /**
   * Generuje unikalny 5-znakowy kod pokoju
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Tworzy nowy pokój i ustawia gracza jako Hosta
   */
  public createRoom(hostPlayerName: string, avatarUrl?: string): { room: ServerRoom; hostId: string } {
    const roomCode = this.generateRoomCode();
    const hostId = `player_${Math.random().toString(36).substring(2, 9)}`;

    const host: Player = {
      id: hostId,
      name: hostPlayerName,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${hostPlayerName}`,
      score: 0,
      isHost: true,
      isConnected: true,
      hasSubmitted: false,
    };

    const playersMap = new Map<string, Player>();
    playersMap.set(hostId, host);

    const newRoom: ServerRoom = {
      code: roomCode,
      phase: 'LOBBY',
      players: playersMap,
      currentRound: 0,
      maxRounds: 3,
      creatorId: hostId,
      categoryOptions: [],
      currentCategory: null,
      timeRemaining: 0,
      secretCreatorPlacement: null,
      guesserPlacements: new Map(),
      roundResults: null,
    };

    this.rooms.set(roomCode, newRoom);
    return { room: newRoom, hostId };
  }

  /**
   * Pobiera pokój po kodzie
   */
  public getRoom(roomCode: string): ServerRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  /**
   * Dołączanie gracza do istniejącego pokoju
   */
  public joinRoom(roomCode: string, playerName: string, avatarUrl?: string): { success: boolean; playerId?: string; error?: string } {
    const room = this.getRoom(roomCode);
    if (!room) {
      return { success: false, error: 'Pokój o podanym kodzie nie istnieje.' };
    }

    if (room.phase !== 'LOBBY') {
      // Jeśli gra już trwa, sprawdź czy to powracający gracz
      const existingPlayer = Array.from(room.players.values()).find((p) => p.name.toLowerCase() === playerName.trim().toLowerCase());
      if (existingPlayer) {
        existingPlayer.isConnected = true;
        if (room.cleanupTimeout) {
          clearTimeout(room.cleanupTimeout);
          room.cleanupTimeout = undefined;
        }
        return { success: true, playerId: existingPlayer.id };
      }
      return { success: false, error: 'Gra w tym pokoju już trwa.' };
    }

    if (room.cleanupTimeout) {
      clearTimeout(room.cleanupTimeout);
      room.cleanupTimeout = undefined;
    }

    // Sprawdź czy gracz o takim nicku już był w pokoju (np. przed nawigacją strony)
    const existingPlayer = Array.from(room.players.values()).find((p) => p.name.toLowerCase() === playerName.trim().toLowerCase());
    if (existingPlayer) {
      existingPlayer.isConnected = true;
      return { success: true, playerId: existingPlayer.id };
    }

    if (room.players.size >= 8) {
      return { success: false, error: 'Pokój osiągnął maksymalny limit graczy (8).' };
    }

    const playerId = `player_${Math.random().toString(36).substring(2, 9)}`;
    const player: Player = {
      id: playerId,
      name: playerName.trim(),
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${playerName.trim()}`,
      score: 0,
      isHost: false,
      isConnected: true,
      hasSubmitted: false,
    };

    room.players.set(playerId, player);
    return { success: true, playerId };
  }

  /**
   * Obsługa opuszczenia pokoju lub rozłączenia gracza
   */
  public handleDisconnect(roomCode: string, playerId: string): void {
    const room = this.getRoom(roomCode);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    player.isConnected = false;

    // Nie usuwamy od razu pokoju ani gracza - dajemy 30 sekund na odświeżenie strony lub przejście do pokoju
    const activePlayers = Array.from(room.players.values()).filter((p) => p.isConnected);
    if (activePlayers.length === 0) {
      if (room.cleanupTimeout) clearTimeout(room.cleanupTimeout);
      room.cleanupTimeout = setTimeout(() => {
        const stillActive = Array.from(room.players.values()).filter((p) => p.isConnected);
        if (stillActive.length === 0) {
          this.clearRoomTimer(room);
          this.rooms.delete(room.code);
          console.log(`[RoomManager] Pokój ${room.code} usunięty po upływie 30s bez aktywnych graczy.`);
        }
      }, 30000);
    }

    this.broadcastState(room.code);
  }

  /**
   * Start rozgrywki (wywoływany przez Hosta)
   */
  public startGame(roomCode: string, requestingPlayerId: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room) return false;

    const player = room.players.get(requestingPlayerId);
    if (!player || !player.isHost) return false;

    if (room.players.size < 2) {
      return false; // Wymaganych co najmniej 2 graczy
    }

    room.currentRound = 0;
    room.maxRounds = Math.max(3, room.players.size);
    this.startNextRound(room);
    return true;
  }

  /**
   * Inicjalizacja kolejnej rundy gry
   */
  public startNextRound(room: ServerRoom): void {
    this.clearRoomTimer(room);

    room.currentRound += 1;
    if (room.currentRound > room.maxRounds) {
      // Koniec całej rozgrywki -> powrót do LOBBY z zachowaniem wyników
      room.phase = 'LOBBY';
      this.broadcastState(room.code);
      return;
    }

    // Wybór kolejnego Twórcy w systemie Round-Robin
    const playersList = Array.from(room.players.values());
    const creatorIndex = (room.currentRound - 1) % playersList.length;
    room.creatorId = playersList[creatorIndex].id;

    // Losujemy 3 opcje kategorii do wyboru przez Twórcę
    room.categoryOptions = selectCategoryOptions(3);
    room.currentCategory = null;
    room.secretCreatorPlacement = null;
    room.guesserPlacements.clear();
    room.roundResults = null;

    for (const p of room.players.values()) {
      p.hasSubmitted = false;
      p.roundScore = 0;
    }

    // Przejście do fazy CATEGORY_SELECTION
    this.transitionPhase(room, 'CATEGORY_SELECTION');
  }

  /**
   * Zmiana fazy w maszynie stanów z uruchomieniem odpowiedniego zegara
   */
  private transitionPhase(room: ServerRoom, nextPhase: RoomPhase): void {
    this.clearRoomTimer(room);
    room.phase = nextPhase;
    room.timeRemaining = PHASE_DURATIONS[nextPhase];

    this.io.to(room.code).emit('phase:changed', {
      phase: nextPhase,
      timeLimit: room.timeRemaining,
    });

    if (nextPhase === 'CATEGORY_SELECTION') {
      this.startTimer(room, () => {
        // Po upływie czasu, jeśli Twórca nie wybrał, automatycznie przypisz pierwszą opcję
        if (!room.currentCategory && room.categoryOptions.length > 0) {
          room.currentCategory = room.categoryOptions[0];
        }
        this.transitionPhase(room, 'CREATING');
      });
    } else if (nextPhase === 'CREATING') {
      this.startTimer(room, () => {
        // Po upływie czasu Twórcy, przechodzimy do GUESSING
        this.transitionPhase(room, 'GUESSING');
      });
    } else if (nextPhase === 'GUESSING') {
      this.startTimer(room, () => {
        // Po upływie czasu Zgadujących, przechodzimy do REVEAL
        this.finishRoundAndReveal(room);
      });
    } else if (nextPhase === 'REVEAL') {
      this.startTimer(room, () => {
        // Po prezentacji wyników, przechodzimy do SCOREBOARD
        this.transitionPhase(room, 'SCOREBOARD');
      });
    }

    this.broadcastState(room.code);
  }

  /**
   * Wybór kategorii przez Twórcę na początku rundy
   */
  public selectCategory(roomCode: string, playerId: string, categoryId: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room || room.creatorId !== playerId || room.phase !== 'CATEGORY_SELECTION') return false;

    const chosen =
      room.categoryOptions.find((c) => c.id === categoryId) ||
      room.categoryOptions[0] ||
      selectRandomCategory();

    room.currentCategory = chosen;
    this.transitionPhase(room, 'CREATING');
    return true;
  }

  /**
   * Zapisanie szkicu ułożenia (Draft placement)
   */
  public updateDraft(roomCode: string, playerId: string, placement: TierPlacement): void {
    const room = this.getRoom(roomCode);
    if (!room) return;

    if (room.creatorId === playerId && room.phase === 'CREATING') {
      room.secretCreatorPlacement = placement;
    } else if (room.creatorId !== playerId && (room.phase === 'CREATING' || room.phase === 'GUESSING')) {
      room.guesserPlacements.set(playerId, placement);
    }
  }

  /**
   * Zatwierdzenie ułożenia przez Twórcę
   */
  public submitCreatorPlacement(roomCode: string, playerId: string, placement: TierPlacement): boolean {
    const room = this.getRoom(roomCode);
    if (!room || room.creatorId !== playerId || room.phase !== 'CREATING') return false;

    room.secretCreatorPlacement = placement;
    const creator = room.players.get(playerId);
    if (creator) creator.hasSubmitted = true;

    // Twórca skończył -> płynnie przechodzimy do fazy GUESSING dla reszty graczy
    this.transitionPhase(room, 'GUESSING');
    return true;
  }

  /**
   * Zatwierdzenie typowania przez Zgadującego
   */
  public submitGuesserPlacement(roomCode: string, playerId: string, placement: TierPlacement): boolean {
    const room = this.getRoom(roomCode);
    if (!room || room.creatorId === playerId || room.phase !== 'GUESSING') return false;

    room.guesserPlacements.set(playerId, placement);
    const guesser = room.players.get(playerId);
    if (guesser) guesser.hasSubmitted = true;

    // Sprawdzamy czy wszyscy zgadujący oddali już swoje głosy
    const guessers = Array.from(room.players.values()).filter((p) => p.id !== room.creatorId && p.isConnected);
    const allSubmitted = guessers.every((g) => g.hasSubmitted);

    this.broadcastState(room.code);

    if (allSubmitted && guessers.length > 0) {
      // Wszyscy skończyli przed czasem -> natychmiastowy REVEAL!
      this.finishRoundAndReveal(room);
    }

    return true;
  }

  /**
   * Zakończenie zgadywania, kalkulacja punktów i przejście do REVEAL
   */
  private finishRoundAndReveal(room: ServerRoom): void {
    if (!room.currentCategory) return;

    // Jeśli Twórca nie ułożył do końca, tworzymy bezpieczny fallback
    const creatorPlacement = room.secretCreatorPlacement || createEmptyPlacement();
    const results: PlayerRoundResult[] = [];

    // Obliczanie punktów dla każdego zgadującego
    for (const [playerId, player] of room.players.entries()) {
      if (playerId === room.creatorId) continue;

      const guesserPlacement = room.guesserPlacements.get(playerId) || createEmptyPlacement();
      const evaluation = evaluateGuesser(creatorPlacement, guesserPlacement, room.currentCategory);

      player.score += evaluation.totalPointsGained;
      player.roundScore = evaluation.totalPointsGained;

      results.push({
        playerId: player.id,
        playerName: player.name,
        totalPointsGained: evaluation.totalPointsGained,
        itemDetails: evaluation.itemDetails,
      });
    }

    room.roundResults = results;
    this.transitionPhase(room, 'REVEAL');

    this.io.to(room.code).emit('reveal:started', {
      revealedCreatorPlacement: creatorPlacement,
      results,
    });
  }

  /**
   * Zegar odliczający czas rundy
   */
  private startTimer(room: ServerRoom, onComplete: () => void): void {
    this.clearRoomTimer(room);

    room.timerIntervalId = setInterval(() => {
      room.timeRemaining -= 1;
      this.io.to(room.code).emit('timer:tick', room.timeRemaining);

      if (room.timeRemaining <= 0) {
        this.clearRoomTimer(room);
        onComplete();
      }
    }, 1000);
  }

  private clearRoomTimer(room: ServerRoom): void {
    if (room.timerIntervalId) {
      clearInterval(room.timerIntervalId);
      room.timerIntervalId = undefined;
    }
  }

  /**
   * Bezpieczny broadcast stanu pokoju:
   * Każdy klient otrzymuje dedykowaną, zsanitizowaną wersję stanu.
   */
  public broadcastState(roomCode: string): void {
    const room = this.getRoom(roomCode);
    if (!room) return;

    // Pobieramy wszystkie podłączone sockety w danym pokoju
    const roomSockets = this.io.sockets.adapter.rooms.get(roomCode);
    if (!roomSockets) return;

    for (const socketId of roomSockets) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.data.playerId) {
        const sanitized = sanitizeRoomState(room, socket.data.playerId);
        socket.emit('sync:state', sanitized);
      }
    }
  }
}
