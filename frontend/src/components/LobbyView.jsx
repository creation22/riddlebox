import React, { useState, useEffect, useRef } from "react";
import { initSocket, addSocketListener, sendMessage } from "./socket";

export default function LobbyView({ username, roomId, isCreator, onStartGame, onBackToWelcome }) {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [players, setPlayers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [userId, setUserId] = useState(null);
  const [canStartGame, setCanStartGame] = useState(false);
  const [gameStartCountdown, setGameStartCountdown] = useState(0);
  
  const messagesEndRef = useRef(null);
  const onStartGameRef = useRef(onStartGame);

  useEffect(() => {
    onStartGameRef.current = onStartGame;
  }, [onStartGame]);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update game start availability
  useEffect(() => {
    setCanStartGame(isCreator && players.length >= 1 && connectionStatus === "connected");
  }, [isCreator, players.length, connectionStatus]);

  useEffect(() => {
    const ws = initSocket();
    let reconnectTimeout = null;

    const removeListener = addSocketListener((data) => {
      // Handle error responses
      if (data.status === "error") {
        setMessages((prev) => [...prev, `❌ ${data.message}`]);
        return;
      }

      // Handle success responses (create/join)
      if (data.status === "success") {
        if (data.userId) {
          setUserId(data.userId);
          setConnectionStatus("connected");
        }
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

      // Handle players list updates
      if (data.type === "players") {
        const playerList = data.payload || [];
        setPlayers(playerList.map((p) => ({ 
          name: p.name, 
          userId: p.userId,
          score: p.score || 0 
        })));
      }

      // Handle scoreboard (convert to players format)
      if (data.type === "scoreboard") {
        const scoreboardData = data.payload || {};
        const playerList = Object.entries(scoreboardData).map(([name, score]) => ({ 
          name, 
          score 
        }));
        setPlayers(playerList);
      }

      // Handle game start (riddle received)
      if (data.type === "riddle") {
        console.log("🎮 Game starting - received first riddle");
        setMessages((prev) => [...prev, "🎮 Game is starting!"]);
        // Small delay to show the message before transitioning
        setTimeout(() => {
          onStartGameRef.current?.();
        }, 500);
      }
    });

    ws.onopen = () => {
      console.log("✅ Connected to lobby");
      setConnectionStatus("connected");
      
      // Backend now generates userId, just send room and name
      sendMessage(isCreator ? "create" : "join", { 
        roomId, 
        name: username 
      });
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      setConnectionStatus("error");
      setMessages((prev) => [...prev, "❌ Connection error occurred"]);
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket closed");
      setConnectionStatus("disconnected");
      setMessages((prev) => [...prev, "⚠️ Disconnected from server"]);
      
      // Attempt reconnection after 3 seconds
      reconnectTimeout = setTimeout(() => {
        setMessages((prev) => [...prev, "🔄 Reconnecting..."]);
        window.location.reload();
      }, 3000);
    };

    return () => {
      removeListener();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [roomId, username, isCreator]);

  const sendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    
    if (connectionStatus !== "connected") {
      setMessages((prev) => [...prev, "❌ Cannot send - not connected"]);
      return;
    }
    
    setMessages((prev) => [...prev, `You: ${trimmed}`]);
    sendMessage("chat", { message: trimmed, name: username });
    setChatInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  const startGame = () => {
    if (!canStartGame) {
      setMessages((prev) => [...prev, "❌ Cannot start game yet"]);
      return;
    }
    
    setMessages((prev) => [...prev, "🎮 Starting game in 3 seconds..."]);
    setGameStartCountdown(3);
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setGameStartCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          sendMessage("startGame", { roomId });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-900/50 to-slate-950 text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={onBackToWelcome} 
            className="mb-4 text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <span>←</span> Back to Welcome
          </button>
          
          <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
              <h1 className="text-3xl font-extrabold flex items-center gap-2">
  Room: <span className="font-mono">{roomId}</span>
  <button
    onClick={() => {
      navigator.clipboard.writeText(roomId);
    }}
    className="text-sm px-2 py-1 border-2 border-black bg-yellow-200 hover:bg-yellow-300 font-bold shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#000] transition-all"
  >
    📋 Copy
  </button>
</h1>

                <p className="text-sm mt-1">
                  You are <span className="font-bold">{username}</span>
                  {isCreator && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-400 text-black text-xs font-bold rounded">
                      HOST
                    </span>
                  )}
                </p>
              </div>
              
              {/* Connection status */}
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
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Players & Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Players List */}
            <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-4">
              <h3 className="text-xl font-extrabold mb-3 flex items-center justify-between">
                <span>👥 Players</span>
                <span className="text-sm font-normal bg-neutral-200 px-2 py-1 rounded">
                  {players.length}
                </span>
              </h3>
              
              {players.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {players.map((player, index) => (
                    <div
                      key={player.userId || index}
                      className={`flex justify-between items-center px-3 py-2 border-4 border-black rounded-none shadow-[4px_4px_0_0_#000] ${
                        player.name === username ? "bg-amber-100" : "bg-neutral-100"
                      }`}
                    >
                      <span className="font-medium truncate">{player.name}</span>
                      <span className="text-xs px-2 py-1 bg-green-200 border-2 border-black rounded font-bold">
                        READY
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Waiting for players...</p>
                  <p className="text-xs mt-2">Share room code: <span className="font-bold">{roomId}</span></p>
                </div>
              )}
            </div>

            {/* Host Controls */}
            {isCreator && (
              <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-4">
                <h4 className="text-lg font-extrabold mb-3 flex items-center gap-2">
                  <span>👑</span> Host Controls
                </h4>
                
                <button
                  onClick={startGame}
                  disabled={!canStartGame || gameStartCountdown > 0}
                  className={`w-full px-4 py-3 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] transition-all ${
                    canStartGame && gameStartCountdown === 0
                      ? "bg-lime-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000]"
                      : "bg-gray-300 cursor-not-allowed opacity-60"
                  }`}
                >
                  {gameStartCountdown > 0 ? `⏰ Starting in ${gameStartCountdown}...` : canStartGame ? "🎮 Go to Room" : "⏳ Waiting..."}
                </button>
                
                {!canStartGame && connectionStatus === "connected" && (
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    {players.length === 0 
                      ? "Waiting for players to join" 
                      : "Ready to start!"
                    }
                  </p>
                )}
              </div>
            )}

            {/* Non-host waiting message */}
            {!isCreator && (
              <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-4">
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-sm font-medium">Waiting for host to start the game</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Chat with other players while you wait!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-6">
              <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                <span>💬</span> Lobby Chat
              </h3>
              
              {/* Messages */}
              <div className="h-64 sm:h-[50vh] overflow-y-auto space-y-2 mb-4 pr-2 scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No messages yet.</p>
                    <p className="text-sm mt-2">Say hello to other players!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isSystem = typeof message === "string" && 
                      (message.includes("✅") || message.includes("❌") || message.includes("⚠️") || message.includes("🎮"));
                    const isError = typeof message === "string" && message.includes("❌");
                    const isSuccess = typeof message === "string" && message.includes("✅");
                    
                    const bg = isError 
                      ? "bg-red-100" 
                      : isSuccess 
                      ? "bg-green-100" 
                      : isSystem 
                      ? "bg-blue-100" 
                      : "bg-neutral-100";
                    
                    return (
                      <div
                        key={index}
                        className={`px-3 py-2 ${bg} border-4 border-black rounded-none shadow-[4px_4px_0_0_#000] break-words animate-fade-in-up`}
                      >
                        {message}
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
                  placeholder="Type a message..."
                  maxLength={500}
                  disabled={connectionStatus !== "connected"}
                  className="flex-1 px-4 py-3 bg-yellow-200 placeholder-black/60 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || connectionStatus !== "connected"}
                  className="px-6 py-3 bg-black text-white border-4 border-black rounded-none font-bold shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💬 Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}