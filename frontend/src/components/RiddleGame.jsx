import React, { useState, useEffect, useRef } from "react";
import { initSocket, addSocketListener, sendMessage } from "./socket";

export default function RiddleGame({ username, roomId, isCreator, onGameOver, onBackToLobby }) {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [riddle, setRiddle] = useState(null);
  const [scoreboard, setScoreboard] = useState({});
  const [countdown, setCountdown] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);

  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    const ws = initSocket();

    const removeListener = addSocketListener((data) => {
      if (data.status === "error") {
        setMessages((prev) => [...prev, `❌ ${data.message}`]);
        return;
      }

      if (data.type === "chat") {
        const from = data.payload?.name;
        const msg = data.payload?.message;
        if (!from || !msg) return;
        if (from === username) return;
        setMessages((prev) => [...prev, `${from}: ${msg}`]);
      }

      if (data.type === "system") {
        setMessages((prev) => [...prev, data.message]);
      }

      if (data.type === "riddle") {
        setRiddle(data.payload);
        setCountdown(60);
        setIsGameActive(Boolean(data.payload?.round));
      }

      if (data.type === "riddleResult") {
        const { user, answer, isCorrect, scores } = data.payload;
        const label = isCorrect
          ? `✅ ${user} answered correctly`
          : `❌ ${user} guessed "${answer}"`;
        setMessages((prev) => [...prev, label]);

        if (scores) setScoreboard(scores);
      }

      if (data.type === "scoreboard") {
        setScoreboard(data.payload);
      }

      if (data.type === "gameOver") {
        setMessages((prev) => [...prev, "Game Over!"]);
        const finalScores = Object.fromEntries(data.payload.scores);
        setScoreboard(finalScores);
        setRiddle(null);
        setIsGameActive(false);
        onGameOverRef.current(finalScores);
      }
    });

    ws.onopen = () => {
      console.log("Connected to server");
      sendMessage("join", { roomId, userId: username, name: username });
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => removeListener();
  }, [roomId, username, isCreator]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, `You: ${chatInput}`]);
    sendMessage("chat", { message: chatInput, name: username });
    setChatInput("");
  };

  const sendAnswer = () => {
    if (!riddle || !chatInput.trim()) return;
    sendMessage("answerRiddle", { answer: chatInput, name: username });
    setChatInput("");
  };

  const getFreeRiddle = () => sendMessage("freeRiddle");

  const startGame = () => sendMessage("startGame", { roomId });
  const skipRiddle = () => sendMessage("skip");
  const getScores = () => sendMessage("getScore");
  const endGame = () => sendMessage("endGame");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-900/60 to-slate-950 text-white p-4 sm:p-6">
      <div className="mb-6">
        <button
          onClick={onBackToLobby}
          className="mb-4 text-slate-400 hover:text-white transition-colors"
        >
          ← Back to Lobby
        </button>

        <h2 className="text-2xl font-extrabold">Room: {roomId}</h2>
        <p className="text-sm">
          You are <span className="font-bold">{username}</span>
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Sidebar - Controls + Scoreboard */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-4 space-y-2">
            <button
              onClick={getFreeRiddle}
              className="w-full px-4 py-2 bg-yellow-200 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000]"
            >
              Get Free Riddle
            </button>

            <button
              disabled={!isCreator}
              onClick={startGame}
              className={`w-full px-4 py-2 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] ${
                isCreator ? "bg-lime-200" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Start Game
            </button>

            <button
              disabled={!isCreator}
              onClick={skipRiddle}
              className={`w-full px-4 py-2 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] ${
                isCreator ? "bg-pink-200" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Skip Riddle
            </button>

            <button
              onClick={getScores}
              className="w-full px-4 py-2 bg-sky-200 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000]"
            >
              Get Scores
            </button>

            <button
              disabled={!isCreator}
              onClick={endGame}
              className={`w-full px-4 py-2 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] ${
                isCreator ? "bg-red-200" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              End Game
            </button>
          </div>

          <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-4">
            <h4 className="text-xl font-extrabold mb-2">Scoreboard</h4>
            <ul className="space-y-1">
              {Object.entries(scoreboard).map(([user, score]) => (
                <li
                  key={user}
                  className="flex justify-between px-3 py-2 bg-neutral-100 border-4 border-black rounded-none shadow-[4px_4px_0_0_#000]"
                >
                  <span>{user}</span>
                  <span className="font-bold">{score}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Riddle Display */}
          <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-6 min-h-32">
            <h3 className="text-xl font-extrabold mb-2">Riddle</h3>
            {riddle ? (
              <div>
                <div className="font-semibold">{riddle.question}</div>
                <div className="text-sm mt-1 flex items-center gap-3">
                  <span>Round {riddle.round || "-"}</span>
                  <span
                    className={`px-2 py-1 border-2 border-black rounded-none font-bold ${
                      countdown <= 10 ? "bg-red-200" : "bg-green-200"
                    }`}
                  >
                    ⏳ {countdown}s
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm">
                No riddle yet. Click "Get Free Riddle" or start the game.
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-6">
            <h4 className="text-xl font-extrabold mb-2">Chat</h4>
            <div className="h-64 sm:h-[60vh] overflow-y-auto space-y-2 mb-4 pr-2">
              {messages.map((m, i) => {
                const isWrong = typeof m === "string" && m.startsWith("❌");
                const isRight = typeof m === "string" && m.startsWith("✅");
                const bg = isWrong
                  ? "bg-red-100"
                  : isRight
                  ? "bg-emerald-100"
                  : "bg-neutral-100";
                return (
                  <div
                    key={i}
                    className={`px-3 py-2 ${bg} border-4 border-black rounded-none shadow-[4px_4px_0_0_#000]`}
                  >
                    {m}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  (isGameActive && riddle ? sendAnswer() : sendChat())
                }
                placeholder="Type chat or answer here"
                className="flex-1 px-4 py-3 bg-yellow-200 placeholder-black/60 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none"
              />
              <button
                onClick={isGameActive && riddle ? sendAnswer : sendChat}
                className="px-4 py-3 bg-black text-white border-4 border-black rounded-none font-bold shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000]"
              >
                {isGameActive && riddle ? "Answer" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
