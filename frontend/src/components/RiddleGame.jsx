import React, { useState, useEffect, useRef } from "react";
import { initSocket, addSocketListener, sendMessage } from "./socket";

export default function RiddleGame({ username, roomId, isCreator, onGameOver, onBackToLobby }) {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [riddle, setRiddle] = useState(null);
  const [scoreboard, setScoreboard] = useState({});
  const [countdown, setCountdown] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [userId, setUserId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection and message handling
  useEffect(() => {
    const ws = initSocket();
    let reconnectTimeout = null;

    const removeListener = addSocketListener((data) => {
      // Handle error responses
      if (data.status === "error") {
        setMessages((prev) => [...prev, `❌ ${data.message}`]);
        return;
      }

      // Handle success responses (join/create)
      if (data.status === "success" && data.userId) {
        setUserId(data.userId);
        setConnectionStatus("connected");
        setMessages((prev) => [...prev, `✅ ${data.message}`]);
        return;
      }

      // Handle chat messages
      if (data.type === "chat") {
        const from = data.payload?.name;
        const msg = data.payload?.message;
        if (!from || !msg) return;
        // Don't show own messages twice
        if (from === username) return;
        setMessages((prev) => [...prev, `${from}: ${msg}`]);
      }

      // Handle system messages
      if (data.type === "system") {
        setMessages((prev) => [...prev, data.message]);
      }

      // Handle new riddle
      if (data.type === "riddle") {
        setRiddle(data.payload);
        const duration = data.payload?.durationMs || 60000;
        setCountdown(Math.floor(duration / 1000));
        setIsGameActive(Boolean(data.payload?.round));
      }

      // Handle game state (for late joiners)
      if (data.type === "gameState") {
        setRiddle(data.payload);
        const timeRemaining = data.payload?.timeRemainingMs || 60000;
        setCountdown(Math.floor(timeRemaining / 1000));
        setIsGameActive(true);
        setMessages((prev) => [...prev, "⚡ Joined game in progress"]);
      }

      // Handle riddle results
      if (data.type === "riddleResult") {
        const { user, answer, isCorrect, scores } = data.payload;
        const label = isCorrect
          ? `✅ ${user} answered correctly!`
          : `❌ ${user} guessed "${answer}"`;
        setMessages((prev) => [...prev, label]);

        if (scores) setScoreboard(scores);
      }

      // Handle riddle answer reveal
      if (data.type === "riddleAnswer") {
        const answer = data.payload?.answer;
        if (answer) {
          setMessages((prev) => [...prev, `💡 Answer: ${answer}`]);
        }
      }

      // Handle scoreboard updates
      if (data.type === "scoreboard") {
        setScoreboard(data.payload || {});
      }

      // Handle players list
      if (data.type === "players") {
        const players = data.payload || [];
        console.log("Players updated:", players);
      }

      // Handle game over
      if (data.type === "gameOver") {
        setMessages((prev) => [...prev, "🏁 Game Over!"]);
        // Backend now sends object format
        const finalScores = data.payload?.scores || {};
        setScoreboard(finalScores);
        setRiddle(null);
        setIsGameActive(false);
        setCountdown(0);
        onGameOverRef.current(finalScores);
      }
    });

    ws.onopen = () => {
      console.log("✅ Connected to game server");
      setConnectionStatus("connected");
      // Backend will generate userId, just send join request
      sendMessage("join", { roomId, name: username });
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      setConnectionStatus("error");
      setMessages((prev) => [...prev, "❌ Connection error"]);
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket closed");
      setConnectionStatus("disconnected");
      setMessages((prev) => [...prev, "⚠️ Connection lost"]);
      
      // Attempt reconnection after 3 seconds
      reconnectTimeout = setTimeout(() => {
        setMessages((prev) => [...prev, "🔄 Attempting to reconnect..."]);
        window.location.reload(); // Simple reconnect strategy
      }, 3000);
    };

    return () => {
      removeListener();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [roomId, username]);

  // Countdown timer (fixed to use setTimeout instead of setInterval)
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timeoutId = setTimeout(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [countdown]);

  // Send chat message
  const sendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    
    setMessages((prev) => [...prev, `You: ${trimmed}`]);
    sendMessage("chat", { message: trimmed, name: username });
    setChatInput("");
  };

  // Send answer to riddle
  const sendAnswer = () => {
    const trimmed = chatInput.trim();
    if (!riddle || !trimmed) return;
    
    setMessages((prev) => [...prev, `You answered: ${trimmed}`]);
    sendMessage("answerRiddle", { answer: trimmed, name: username });
    setChatInput("");
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isGameActive && riddle) {
        sendAnswer();
      } else {
        sendChat();
      }
    }
  };

  // Game control functions
  const getFreeRiddle = () => {
    sendMessage("freeRiddle");
    setMessages((prev) => [...prev, "🎲 Requesting practice riddle..."]);
  };

  const startGame = () => {
    sendMessage("startGame", { roomId });
    setMessages((prev) => [...prev, "🎮 Starting game..."]);
  };

  const skipRiddle = () => {
    if (!riddle) {
      setMessages((prev) => [...prev, "❌ No riddle to skip"]);
      return;
    }
    sendMessage("skip");
  };

  const getScores = () => {
    sendMessage("getScore");
  };

  const endGame = () => {
    sendMessage("endGame");
  };

  // Get sorted scoreboard entries
  const sortedScoreboard = Object.entries(scoreboard)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-900/60 to-slate-950 text-white p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBackToLobby}
          className="mb-4 text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2"
        >
          <span>←</span> Back to Lobby
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">Room: {roomId}</h2>
            <p className="text-sm">
              You are <span className="font-bold">{username}</span>
              {isCreator && <span className="ml-2 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded">HOST</span>}
            </p>
          </div>
          
          {/* Connection status indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === "connected" ? "bg-green-500" : 
              connectionStatus === "connecting" ? "bg-yellow-500 animate-pulse" : 
              "bg-red-500"
            }`}></div>
            <span className="text-sm capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Sidebar - Controls + Scoreboard */}
        <div className="lg:col-span-1 space-y-4">
          {/* Control Panel */}
          <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-4 space-y-2">
            <h3 className="text-lg font-extrabold mb-3">Game Controls</h3>
            
            <button
              onClick={getFreeRiddle}
              disabled={isGameActive}
              className={`w-full px-4 py-2 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] transition-all ${
                isGameActive 
                  ? "bg-gray-300 cursor-not-allowed" 
                  : "bg-yellow-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000]"
              }`}
            >
              🎲 Practice Riddle
            </button>

            <button
              disabled={!isCreator || isGameActive}
              onClick={startGame}
              className={`w-full px-4 py-2 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] transition-all ${
                isCreator && !isGameActive
                  ? "bg-lime-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000]" 
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              🎮 Start Game
            </button>

            <button
              disabled={!isCreator || !isGameActive}
              onClick={skipRiddle}
              className={`w-full px-4 py-2 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] transition-all ${
                isCreator && isGameActive
                  ? "bg-pink-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000]" 
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              ⏭️ Skip Riddle
            </button>

            <button
              onClick={getScores}
              className="w-full px-4 py-2 bg-sky-200 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all"
            >
              📊 Refresh Scores
            </button>

            <button
              disabled={!isCreator || !isGameActive}
              onClick={endGame}
              className={`w-full px-4 py-2 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] transition-all ${
                isCreator && isGameActive
                  ? "bg-red-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000]" 
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              🛑 End Game
            </button>
          </div>

          {/* Scoreboard */}
          <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-4">
            <h4 className="text-xl font-extrabold mb-3 flex items-center justify-between">
              <span>🏆 Scoreboard</span>
              <span className="text-sm font-normal">
                {sortedScoreboard.length} {sortedScoreboard.length === 1 ? "player" : "players"}
              </span>
            </h4>
            
            {sortedScoreboard.length > 0 ? (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {sortedScoreboard.map(([user, score], index) => (
                  <li
                    key={user}
                    className={`flex justify-between items-center px-3 py-2 border-4 border-black rounded-none shadow-[4px_4px_0_0_#000] ${
                      user === username ? "bg-amber-100" : "bg-neutral-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {index === 0 && <span>🥇</span>}
                      {index === 1 && <span>🥈</span>}
                      {index === 2 && <span>🥉</span>}
                      <span className="font-medium truncate">{user}</span>
                    </div>
                    <span className="font-bold text-lg">{score}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No scores yet. Start playing!
              </p>
            )}
          </div>
        </div>

        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Riddle Display */}
          <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-6 min-h-32">
            <h3 className="text-xl font-extrabold mb-3 flex items-center gap-2">
              <span>🧩</span> Current Riddle
            </h3>
            {riddle ? (
              <div className="space-y-3">
                <div className="text-lg font-semibold leading-relaxed">
                  {riddle.question}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {riddle.round && (
                    <span className="px-3 py-1 bg-neutral-200 border-2 border-black rounded-none text-sm font-bold">
                      Round {riddle.round}/{riddle.totalRounds || 5}
                    </span>
                  )}
                  {countdown > 0 && (
                    <span
                      className={`px-3 py-1 border-2 border-black rounded-none font-bold transition-colors ${
                        countdown <= 10 ? "bg-red-200 animate-pulse" : "bg-green-200"
                      }`}
                    >
                      ⏳ {countdown}s remaining
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 py-4">
                <p className="mb-2">🎯 No active riddle</p>
                <p>
                  {isCreator 
                    ? "Click 'Start Game' to begin or try a practice riddle!" 
                    : "Waiting for host to start the game..."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-6">
            <h4 className="text-xl font-extrabold mb-3 flex items-center gap-2">
              <span>💬</span> 
              {isGameActive && riddle ? "Submit Your Answer" : "Chat"}
            </h4>
            
            {/* Messages */}
            <div className="h-64 sm:h-[55vh] overflow-y-auto space-y-2 mb-4 pr-2 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet.</p>
                  <p className="text-sm mt-2">Start chatting or answer riddles!</p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isWrong = typeof m === "string" && m.includes("❌");
                  const isRight = typeof m === "string" && m.includes("✅");
                  const isSystem = typeof m === "string" && (m.includes("⚠️") || m.includes("🎮") || m.includes("🏁") || m.includes("💡") || m.includes("⏰"));
                  
                  const bg = isWrong
                    ? "bg-red-100"
                    : isRight
                    ? "bg-emerald-100"
                    : isSystem
                    ? "bg-blue-100"
                    : "bg-neutral-100";
                  
                  return (
                    <div
                      key={i}
                      className={`px-3 py-2 ${bg} border-4 border-black rounded-none shadow-[4px_4px_0_0_#000] break-words animate-fade-in-up`}
                    >
                      {m}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isGameActive && riddle 
                    ? "Type your answer..." 
                    : "Type a message..."
                }
                maxLength={500}
                disabled={connectionStatus !== "connected"}
                className="flex-1 px-4 py-3 bg-yellow-200 placeholder-black/60 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={isGameActive && riddle ? sendAnswer : sendChat}
                disabled={!chatInput.trim() || connectionStatus !== "connected"}
                className="px-6 py-3 bg-black text-white border-4 border-black rounded-none font-bold shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGameActive && riddle ? "📤 Submit" : "💬 Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}