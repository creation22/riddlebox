import WebSocket, { WebSocketServer } from "ws";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// =======================================================
// CONSTANTS
// =======================================================

const MAX_ROOMS = 1000;
const MAX_PLAYERS_PER_ROOM = 10;
const MAX_MESSAGE_LENGTH = 500;
const MAX_ROOMID_LENGTH = 20;
const MIN_ROOMID_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;
const ROOM_INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// =======================================================
// UTILITIES
// =======================================================

function sanitizeString(str, maxLength = 500) {
  return String(str || '').trim().slice(0, maxLength);
}

async function ensureFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
}

async function getPollinationsRiddle() {
    try {
      const _fetch = await ensureFetch();
      const prompt = encodeURIComponent(
        'Give a short computer science or logic riddle. Respond ONLY in compact JSON like: {"question":"<riddle>","answer":"<one-word lowercase answer>"}'
      );
  
      const resp = await _fetch(`https://text.pollinations.ai/${prompt}`, { timeout: 10000 });
  
      const text = await resp.text().then(t => t.trim());
  
      // Log the raw response from the API
      console.log("📝 Pollinations raw response:", text);
  
      // Try parsing as direct JSON
      if (text.startsWith("{") && text.endsWith("}")) {
        const parsed = JSON.parse(text);
        if (parsed.question && parsed.answer) {
          return parsed;
        }
      }
  
      // Try extracting JSON from text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.question && parsed.answer) {
          return parsed;
        }
      }
  
      // Try pattern matching
      const qMatch = text.match(/question[:\s]*["']?([^"'\n]+)["']?/i);
      const aMatch = text.match(/answer[:\s]*["']?([^"'\n]+)["']?/i);
      if (qMatch && aMatch) {
        return { 
          question: qMatch[1].trim(), 
          answer: aMatch[1].trim().toLowerCase() 
        };
      }
  
      throw new Error("No valid JSON or parseable pattern in Pollinations output");
  
    } catch (err) {
      console.log("⚠️ Pollinations fetch failed, using fallback:", err?.message || err);
      return { 
        question: "What has an eye but cannot see?", 
        answer: "needle" 
      };
    }
  }
  

// =======================================================
// GAME STATE CLASSES
// =======================================================

class Player {
  constructor(socket, userId, name) {
    this.socket = socket;
    this.userId = userId;
    this.name = sanitizeString(name, MAX_USERNAME_LENGTH);
    this.score = 0;
    this.socket.userId = userId;
    this.socket.name = this.name;
  }

  send(data) {
    if (this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (err) {
        console.error(`Failed to send to player ${this.userId}:`, err.message);
      }
    }
  }

  getPublicData() {
    return { 
      userId: this.userId, 
      name: this.name, 
      score: this.score 
    };
  }
}

class Room {
  constructor(roomId, creatorId) {
    this.roomId = roomId;
    this.creatorId = creatorId;
    this.players = new Map();
    this.currentRiddle = null;
    this.isGameActive = false;
    this.currentRound = 0;
    this.totalRounds = 5;
    this.roundTimer = null;
    this.nextRiddleTimeout = null;
    this.roundStartTime = null;
    this.ROUND_DURATION_MS = 60_000;
    this.lastActivity = Date.now();
    this.inactivityTimer = null;
    
    console.log(`✅ Room ${roomId} created by ${creatorId}`);
    this.startInactivityTimer();
  }

  updateActivity() {
    this.lastActivity = Date.now();
    this.startInactivityTimer();
  }

  startInactivityTimer() {
    this.clearInactivityTimer();
    
    this.inactivityTimer = setTimeout(() => {
      if (!this.isGameActive && this.players.size === 0) {
        console.log(`🗑️ Room ${this.roomId} auto-deleted due to inactivity`);
        rooms.delete(this.roomId);
      }
    }, ROOM_INACTIVITY_TIMEOUT);
  }

  clearInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  broadcast(data, excludeSocket = null) {
    const message = JSON.stringify(data);
    this.players.forEach(player => {
      if (player.socket !== excludeSocket && player.socket.readyState === WebSocket.OPEN) {
        try {
          player.socket.send(message);
        } catch (err) {
          console.error(`Failed to broadcast to player ${player.userId}:`, err.message);
        }
      }
    });
  }

  getPublicPlayerList() {
    return Array.from(this.players.values()).map(p => p.getPublicData());
  }

  getScoreboard() {
    const scoreboard = {};
    this.players.forEach(player => {
      scoreboard[player.name] = player.score;
    });
    return scoreboard;
  }

  addPlayer(socket, userId, name) {
    if (this.players.size >= MAX_PLAYERS_PER_ROOM) {
      console.warn(`Room ${this.roomId} is full (${MAX_PLAYERS_PER_ROOM} players)`);
      return false;
    }

    if (this.players.has(userId)) {
      console.warn(`User ${userId} attempting to re-join room ${this.roomId}`);
      return false;
    }

    const player = new Player(socket, userId, name);
    this.players.set(userId, player);
    socket.roomId = this.roomId;

    this.updateActivity();
    this.broadcast({ type: "system", message: `${player.name} joined the room.` });
    this.broadcast({ type: "players", payload: this.getPublicPlayerList() });

    // Send current game state to the newly joined player
    if (this.isGameActive && this.currentRiddle) {
      const timeRemaining = Math.max(0, this.ROUND_DURATION_MS - (Date.now() - this.roundStartTime));
      player.send({
        type: "gameState",
        payload: {
          question: this.currentRiddle.question,
          round: this.currentRound,
          totalRounds: this.totalRounds,
          timeRemainingMs: timeRemaining,
        }
      });
      player.send({
        type: "scoreboard",
        payload: this.getScoreboard()
      });
    }
    
    return true;
  }

  removePlayer(userId) {
    const player = this.players.get(userId);
    if (!player) return this.players.size;

    this.players.delete(userId);
    console.log(`👋 User ${userId} (${player.name}) left room ${this.roomId}. Players remaining: ${this.players.size}`);

    // Handle creator disconnect
    if (userId === this.creatorId) {
      this.broadcast({ 
        type: "system", 
        message: `The room creator (${player.name}) disconnected.` 
      });
      
      if (this.isGameActive) {
        this.broadcast({ 
          type: "system", 
          message: "Game automatically ended due to creator disconnect." 
        });
        this.endGame();
      } else if (this.players.size > 0) {
        const nextCreator = this.players.values().next().value;
        this.creatorId = nextCreator.userId;
        this.broadcast({ 
          type: "system", 
          message: `${nextCreator.name} is the new room creator.` 
        });
      }
    }

    this.broadcast({ type: "system", message: `${player.name} left the room.` });
    this.broadcast({ type: "players", payload: this.getPublicPlayerList() });
    
    this.updateActivity();
    return this.players.size;
  }

  clearRoundTimer() {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
  }

  clearNextRiddleTimeout() {
    if (this.nextRiddleTimeout) {
      clearTimeout(this.nextRiddleTimeout);
      this.nextRiddleTimeout = null;
    }
  }

  async sendNextRiddle() {
    this.clearRoundTimer();
    this.clearNextRiddleTimeout();

    if (this.currentRound >= this.totalRounds) {
      this.endGame();
      return;
    }

    const riddle = await getPollinationsRiddle();
    this.currentRiddle = riddle;
    this.currentRound++;

    this.broadcast({
      type: "riddle",
      payload: {
        question: riddle.question,
        round: this.currentRound,
        totalRounds: this.totalRounds,
        durationMs: this.ROUND_DURATION_MS
      }
    });

    this.roundStartTime = Date.now();
    this.updateActivity();

    this.roundTimer = setTimeout(() => {
      if (this.currentRiddle) {
        this.broadcast({ 
          type: "system", 
          message: `⏰ Time's up! The answer was: ${this.currentRiddle.answer}` 
        });
        this.broadcast({ 
          type: "riddleAnswer", 
          payload: { answer: this.currentRiddle.answer } 
        });
        this.nextRiddleTimeout = setTimeout(() => this.sendNextRiddle(), 2000);
      }
    }, this.ROUND_DURATION_MS);
  }

  processAnswer(userId, answer) {
    const player = this.players.get(userId);
    if (!this.isGameActive || !this.currentRiddle || !player) {
      return;
    }
    
    if (this.currentRiddle.winnerId) {
      return;
    }

    const sanitizedAnswer = sanitizeString(answer, 100);
    if (!sanitizedAnswer) return;

    const isCorrect = sanitizedAnswer.toLowerCase() === this.currentRiddle.answer.trim().toLowerCase();

    if (isCorrect) {
      player.score += 1;
      this.currentRiddle.winnerId = userId;
      
      this.broadcast({
        type: "riddleResult",
        payload: {
          user: player.name,
          answer: sanitizedAnswer,
          isCorrect: true,
          scores: this.getScoreboard()
        }
      });
      
      this.clearRoundTimer();
      this.broadcast({ 
        type: "riddleAnswer", 
        payload: { answer: this.currentRiddle.answer } 
      });
      
      this.nextRiddleTimeout = setTimeout(() => this.sendNextRiddle(), 2000);
    } else {
      this.broadcast({
        type: "riddleResult",
        payload: { 
          user: player.name, 
          answer: sanitizedAnswer, 
          isCorrect: false 
        }
      });
    }
    
    this.updateActivity();
  }

  startGame() {
    if (this.isGameActive) {
      return;
    }
    
    if (this.players.size === 0) {
      return;
    }

    this.players.forEach(p => p.score = 0);
    this.isGameActive = true;
    this.currentRound = 0;
    this.currentRiddle = null;
    
    this.broadcast({ 
      type: "system", 
      message: "🎮 Game started! Total 5 rounds." 
    });
    this.broadcast({ 
      type: "scoreboard", 
      payload: this.getScoreboard() 
    });
    
    this.updateActivity();
    this.sendNextRiddle();
  }

  endGame() {
    this.clearRoundTimer();
    this.clearNextRiddleTimeout();

    const finalScores = {};
    this.getPublicPlayerList()
      .sort((a, b) => b.score - a.score)
      .forEach(p => {
        finalScores[p.name] = p.score;
      });
    
    this.broadcast({ 
      type: "gameOver", 
      payload: { scores: finalScores } 
    });
    
    this.isGameActive = false;
    this.currentRound = 0;
    this.currentRiddle = null;
    this.updateActivity();
  }

  cleanup() {
    this.clearRoundTimer();
    this.clearNextRiddleTimeout();
    this.clearInactivityTimer();
    this.players.clear();
  }
}

// =======================================================
// SERVER INSTANCE AND ROOM MAP
// =======================================================

const PORT = process.env.PORT || 8000;
const rooms = new Map();

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (socket) => {
  console.log("🔌 Client connected");

  socket.on("close", () => {
    const roomId = socket.roomId;
    const userId = socket.userId;
    
    if (!roomId || !userId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
  
    const remainingPlayers = room.removePlayer(userId);
  
    if (remainingPlayers === 0) {
      room.cleanup();
      rooms.delete(roomId);
      console.log(`🗑️ Room ${roomId} deleted (empty)`);
    }
  });

  socket.on("error", (err) => {
    console.error("❌ Socket error:", err.message);
  });

  socket.on("message", async (message) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch {
      socket.send(JSON.stringify({ 
        status: "error", 
        message: "Invalid JSON format" 
      }));
      return;
    }

    const { type, payload = {} } = data;

    // =======================================================
    // ROOM MANAGEMENT (CREATE / JOIN)
    // =======================================================
    
    if (type === "create" || type === "join") {
      let { roomId, name } = payload;
      
      // Always generate unique userId on server
      const userId = uuidv4();
      
      // Sanitize and validate inputs
      roomId = sanitizeString(roomId, MAX_ROOMID_LENGTH).toUpperCase();
      name = sanitizeString(name, MAX_USERNAME_LENGTH);

      if (roomId.length < MIN_ROOMID_LENGTH) {
        socket.send(JSON.stringify({ 
          status: "error", 
          message: `Room ID must be at least ${MIN_ROOMID_LENGTH} characters.` 
        }));
        return;
      }

      if (!name) {
        socket.send(JSON.stringify({ 
          status: "error", 
          message: "Username is required." 
        }));
        return;
      }

      if (socket.roomId) {
        socket.send(JSON.stringify({ 
          status: "error", 
          message: `You are already in room ${socket.roomId}.` 
        }));
        return;
      }
      
      if (type === "create") {
        if (rooms.has(roomId)) {
          socket.send(JSON.stringify({ 
            status: "error", 
            message: `Room ${roomId} already exists.` 
          }));
          return;
        }

        if (rooms.size >= MAX_ROOMS) {
          socket.send(JSON.stringify({ 
            status: "error", 
            message: "Server is at capacity. Please try again later." 
          }));
          return;
        }

        const room = new Room(roomId, userId);
        rooms.set(roomId, room);
        room.addPlayer(socket, userId, name);
        socket.send(JSON.stringify({ 
          status: "success", 
          message: `Room ${roomId} created.`, 
          userId: userId,
          creatorId: userId 
        }));
        return;

      } else if (type === "join") {
        const room = rooms.get(roomId);
        if (!room) {
          socket.send(JSON.stringify({ 
            status: "error", 
            message: "Room not found." 
          }));
          return;
        }
        
        if (!room.addPlayer(socket, userId, name)) {
          socket.send(JSON.stringify({ 
            status: "error", 
            message: "Unable to join room. It may be full or you may already be in it." 
          }));
          return;
        }

        socket.send(JSON.stringify({ 
          status: "success", 
          message: `Joined room ${roomId}.`,
          userId: userId 
        }));
        return;
      }
    }

    // =======================================================
    // GAME/ROOM ACTIONS (REQUIRE EXISTING ROOM)
    // =======================================================
    
    const room = rooms.get(socket.roomId);
    if (!room || !socket.userId) {
      socket.send(JSON.stringify({ 
        status: "error", 
        message: "Must create or join a room first." 
      }));
      return;
    }

    const isCreator = socket.userId === room.creatorId;

    // Chat message
    if (type === "chat") {
      const message = sanitizeString(payload.message, MAX_MESSAGE_LENGTH);
      if (!message) return;
      
      room.broadcast({ 
        type: "chat", 
        payload: { message, name: socket.name } 
      });
      room.updateActivity();
    }

    // Start game (creator only)
    if (type === "startGame" && isCreator) {
      room.startGame();
    }

    // Answer riddle
    if (type === "answerRiddle") {
      if (!room.isGameActive || !room.currentRiddle) {
        socket.send(JSON.stringify({ 
          status: "error", 
          message: "No active riddle to answer." 
        }));
        return;
      }
      
      if (!payload.answer || typeof payload.answer !== 'string') {
        return;
      }
      
      room.processAnswer(socket.userId, payload.answer);
    }

    // Skip riddle (creator only)
    if (type === "skip" && isCreator && room.isGameActive && room.currentRiddle) {
      room.broadcast({ 
        type: "system", 
        message: `${socket.name} skipped the riddle.` 
      });
      room.broadcast({ 
        type: "riddleAnswer", 
        payload: { answer: room.currentRiddle.answer } 
      });
      room.clearRoundTimer();
      room.nextRiddleTimeout = setTimeout(() => room.sendNextRiddle(), 1500);
    }
    
    // End game (creator only)
    if (type === "endGame" && isCreator) {
      room.endGame();
    }

    // Get players list
    if (type === "getPlayers") {
      socket.send(JSON.stringify({ 
        type: "players", 
        payload: room.getPublicPlayerList() 
      }));
    }

    // Get scoreboard
    if (type === "getScore") {
      socket.send(JSON.stringify({ 
        type: "scoreboard", 
        payload: room.getScoreboard() 
      }));
    }

    // Get free riddle (practice mode)
    if (type === "freeRiddle") {
      const riddle = await getPollinationsRiddle();
      socket.send(JSON.stringify({ 
        type: "riddle", 
        payload: { question: riddle.question } 
      }));
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Cleaning up...');
  rooms.forEach(room => room.cleanup());
  rooms.clear();
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

console.log(`🚀 WebSocket Riddle Game Server running on port ${PORT}`);