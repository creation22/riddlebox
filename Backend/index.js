import WebSocket, { WebSocketServer } from "ws";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// =======================================================
// UTILITIES
// =======================================================

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

    const resp = await _fetch(`https://text.pollinations.ai/${prompt}`);
    const text = await resp.text().then(t => t.trim());
    
    if (text.startsWith("{") && text.endsWith("}")) {
      return JSON.parse(text);
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }

    const qMatch = text.match(/question[:\s]*["']?([^"'\n]+)["']?/i);
    const aMatch = text.match(/answer[:\s]*["']?([^"'\n]+)["']?/i);
    if (qMatch && aMatch) {
      return { question: qMatch[1].trim(), answer: aMatch[1].trim().toLowerCase() };
    }

    throw new Error("No valid JSON or parseable pattern in Pollinations output");

  } catch (err) {
    console.log("⚠️ Pollinations fetch failed, using fallback:", err?.message || err);
    return { question: "What has an eye but cannot see?", answer: "needle" };
  }
}

// =======================================================
// GAME STATE CLASSES
// =======================================================

class Player {
    constructor(socket, userId, name) {
        this.socket = socket;
        this.userId = userId;
        this.name = name;
        this.score = 0;
        this.socket.userId = userId;
        this.socket.name = name; 
    }

    send(data) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }

    getPublicData() {
        return { userId: this.userId, name: this.name, score: this.score };
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
        this.roundStartTime = null;
        this.ROUND_DURATION_MS = 60_000;
        console.log(`Room ${roomId} created by ${creatorId}`);
    }

    broadcast(data, excludeSocket = null) {
        const message = JSON.stringify(data);
        this.players.forEach(player => {
            if (player.socket !== excludeSocket && player.socket.readyState === WebSocket.OPEN) {
                player.socket.send(message);
            }
        });
    }

    getPublicPlayerList() {
        return Array.from(this.players.values()).map(p => p.getPublicData());
    }

    // FIX: Return scoreboard as object with name->score mapping
    getScoreboard() {
        const scoreboard = {};
        this.players.forEach(player => {
            scoreboard[player.name] = player.score;
        });
        return scoreboard;
    }

    addPlayer(socket, userId, name) {
        if (this.players.has(userId)) {
            console.warn(`User ${userId} attempting to re-join room ${this.roomId}`);
            return false;
        }

        const player = new Player(socket, userId, name);
        this.players.set(userId, player);
        socket.roomId = this.roomId;

        this.broadcast({ type: "system", message: `${name} joined the room.` });
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
        }
        return true;
    }

    removePlayer(userId) {
        const player = this.players.get(userId);
        if (!player) return;

        this.players.delete(userId);
        console.log(`User ${userId} disconnected from room ${this.roomId}. Players remaining: ${this.players.size}`);

        if (userId === this.creatorId) {
            this.broadcast({ type: "system", message: `The room creator (${player.name}) disconnected.` });
            if (this.isGameActive) {
                this.broadcast({ type: "system", message: "Game automatically ended due to creator disconnect." });
                this.endGame();
            } else if (this.players.size > 0) {
                const nextCreator = this.players.values().next().value;
                this.creatorId = nextCreator.userId;
                this.broadcast({ type: "system", message: `${nextCreator.name} is the new room creator.` });
            }
        }

        this.broadcast({ type: "system", message: `${player.name} left the room.` });
        this.broadcast({ type: "players", payload: this.getPublicPlayerList() });
        
        return this.players.size;
    }

    clearRoundTimer() {
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = null;
        }
    }

    async sendNextRiddle() {
        this.clearRoundTimer();

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

        this.roundTimer = setTimeout(() => {
            this.broadcast({ type: "system", message: `⏰ Time's up! The answer was: ${this.currentRiddle.answer}` });
            this.broadcast({ type: "riddleAnswer", payload: { answer: this.currentRiddle.answer } });
            this.sendNextRiddle();
        }, this.ROUND_DURATION_MS);
    }

    processAnswer(userId, answer) {
        const player = this.players.get(userId);
        if (!this.isGameActive || !this.currentRiddle || !player) return;
        
        if (this.currentRiddle.winnerId) return; 

        const isCorrect = answer.trim().toLowerCase() === this.currentRiddle.answer.trim().toLowerCase();

        if (isCorrect) {
            player.score += 1;
            this.currentRiddle.winnerId = userId;
            
            this.broadcast({
                type: "riddleResult",
                payload: {
                    user: player.name,
                    answer: answer,
                    isCorrect: true,
                    scores: this.getScoreboard() // FIX: Send scoreboard here
                }
            });
            this.clearRoundTimer();
            
            this.broadcast({ type: "riddleAnswer", payload: { answer: this.currentRiddle.answer } });
            
            setTimeout(() => this.sendNextRiddle(), 2000); 
        } else {
            this.broadcast({
                type: "riddleResult",
                payload: { user: player.name, answer: answer, isCorrect: false }
            });
        }
    }

    startGame() {
        if (this.isGameActive) return;
        this.players.forEach(p => p.score = 0);
        this.isGameActive = true;
        this.currentRound = 0;
        this.broadcast({ type: "system", message: "Game started! Total 5 rounds." });
        this.broadcast({ type: "scoreboard", payload: this.getScoreboard() }); // FIX: Send initial scoreboard
        this.sendNextRiddle();
    }

    endGame() {
        const finalScores = this.getPublicPlayerList()
            .sort((a, b) => b.score - a.score)
            .map(p => [p.name, p.score]);
        
        this.broadcast({ type: "gameOver", payload: { scores: finalScores } });
        
        this.isGameActive = false;
        this.currentRound = 0;
        this.currentRiddle = null;
        this.clearRoundTimer();
    }
}

// =======================================================
// SERVER INSTANCE AND ROOM MAP
// =======================================================

const PORT = process.env.PORT || 8000;
const rooms = new Map();

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("close", () => {
        const roomId = socket.roomId;
        const userId = socket.userId;
        
        if (!roomId || !userId) return;
        
        const room = rooms.get(roomId);
        if (!room) return;
      
        const remainingPlayers = room.removePlayer(userId);
      
        // FIX: Use Map.delete instead of delete keyword
        if (remainingPlayers === 0) {
            rooms.delete(roomId);
            console.log(`🗑️ Room ${roomId} deleted (empty)`);
        } else {
            console.log(`👋 ${userId} left room ${roomId}`);
        }
    });

    socket.on("message", async (message) => {
        let data;
        try {
            data = JSON.parse(message.toString());
        } catch {
            socket.send(JSON.stringify({ status: "error", message: "Invalid JSON format" }));
            return;
        }

        const { type, payload } = data;

        // Room Management
        if (type === "create" || type === "join") {
            let { roomId, name } = payload;
            
            const userId = payload.userId || uuidv4(); 
            
            roomId = String(roomId || '').trim().toUpperCase();
            name = String(name || '').trim();

            if (!roomId || !name) {
                socket.send(JSON.stringify({ status: "error", message: `Invalid ${type} payload: requires roomId and name.` }));
                return;
            }

            if (socket.roomId) {
                socket.send(JSON.stringify({ status: "error", message: `You are already in room ${socket.roomId}.` }));
                return;
            }
            
            if (type === "create") {
                if (rooms.has(roomId)) {
                    socket.send(JSON.stringify({ status: "error", message: `Room ${roomId} already exists.` }));
                    return;
                }
                const room = new Room(roomId, userId);
                rooms.set(roomId, room);
                room.addPlayer(socket, userId, name);
                socket.send(JSON.stringify({ status: "success", message: `Room ${roomId} created.`, creatorId: userId }));
                return;

            } else if (type === "join") {
                const room = rooms.get(roomId);
                if (!room) {
                    socket.send(JSON.stringify({ status: "error", message: "Room not found." }));
                    return;
                }
                
                if (!room.addPlayer(socket, userId, name)) {
                    socket.send(JSON.stringify({ status: "error", message: "A player with that ID is already in the room." }));
                    return;
                }

                socket.send(JSON.stringify({ status: "success", message: `Joined room ${roomId}.` }));
                return;
            }
        }

        // Game/Room Actions
        const room = rooms.get(socket.roomId);
        if (!room || !socket.userId) {
            socket.send(JSON.stringify({ status: "error", message: "Must create or join a room first." }));
            return;
        }

        const isCreator = socket.userId === room.creatorId;

        if (type === "chat") {
            room.broadcast({ type: "chat", payload: { message: payload.message, name: socket.name } });
        }

        if (type === "startGame" && isCreator) {
            room.startGame();
        }

        if (type === "answerRiddle" && room.isGameActive && room.currentRiddle) {
            if (!payload.answer || typeof payload.answer !== 'string') return;
            room.processAnswer(socket.userId, payload.answer);
        }

        if (type === "skip" && isCreator && room.isGameActive) {
            room.broadcast({ type: "system", message: `${socket.name} skipped the riddle.` });
            room.broadcast({ type: "riddleAnswer", payload: { answer: room.currentRiddle.answer } });
            setTimeout(() => room.sendNextRiddle(), 1500);
        }
        
        if (type === "endGame" && isCreator) {
            room.endGame();
        }

        // FIX: Handle getPlayers request
        if (type === "getPlayers") {
            socket.send(JSON.stringify({ type: "players", payload: room.getPublicPlayerList() }));
        }

        // FIX: Add getScore handler
        if (type === "getScore") {
            socket.send(JSON.stringify({ type: "scoreboard", payload: room.getScoreboard() }));
        }

        if (type === "freeRiddle") {
            const riddle = await getPollinationsRiddle();
            socket.send(JSON.stringify({ type: "riddle", payload: { question: riddle.question } }));
        }
    });
});

console.log(`WebSocket Riddle Game Server running on port ${PORT}`);