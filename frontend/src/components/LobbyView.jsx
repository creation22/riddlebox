import React, { useState, useEffect, useRef } from 'react';

export default function LobbyView({ username, roomId, isCreator, onStartGame, onBackToWelcome }) {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [players, setPlayers] = useState([]);
  const socketRef = useRef(null);
  const onStartGameRef = useRef(onStartGame);

  // Keep callback ref updated without retriggering useEffect
  useEffect(() => {
    onStartGameRef.current = onStartGame;
  }, [onStartGame]);

  useEffect(() => {
    // prevent double connection
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.warn('Socket already open, skipping new connection');
      return;
    }

    const ws = new WebSocket('ws://localhost:8000');
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to lobby');
      const payload = { roomId, userId: username, name: username };
      ws.send(JSON.stringify({
        type: isCreator ? 'create' : 'join',
        payload,
      }));
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.warn('❌ Invalid JSON from server:', event.data);
        return;
      }

      console.log('📩 Received:', data.type || data.status, data);

      // handle error
      if (data.status === 'error' && /Room not found/i.test(data.message || '')) {
        setMessages(prev => [...prev, 'Room not found. Please check the Room ID.']);
        return;
      }

      if (data.type === 'chat') {
        const from = data.payload?.name;
        const msg = data.payload?.message;
        if (!from || !msg) return;
        if (from === username) return; // skip echo
        setMessages(prev => [...prev, `${from}: ${msg}`]);
      }

      if (data.type === 'system') {
        setMessages(prev => [...prev, data.message]);
        if (data.message.includes('joined the room')) {
          ws.send(JSON.stringify({ type: 'getScore' }));
        }
      }

      if (data.type === 'scoreboard') {
        setPlayers(Object.keys(data.payload).map(name => ({
          name,
          score: data.payload[name],
        })));
      }

      if (data.type === 'riddle') {
        console.log('🎮 Starting game...');
        onStartGameRef.current?.(); // safe call without re-running effect
      }
    };

    ws.onerror = (err) => {
      console.error('⚠️ WebSocket error:', err);
    };

    ws.onclose = (ev) => {
      console.log(`❌ Disconnected from lobby (code: ${ev.code}, reason: ${ev.reason || 'none'})`);
    };

    return () => {
      console.log('🔌 Closing WebSocket...');
      try {
        ws.close();
      } catch (e) {
        console.error('Error closing socket:', e);
      }
    };
  }, [roomId, username, isCreator]); // removed onStartGame

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, `You: ${chatInput}`]);
    socketRef.current?.send(JSON.stringify({
      type: 'chat',
      payload: { message: chatInput },
    }));
    setChatInput('');
  };

  const startGame = () => {
    socketRef.current?.send(JSON.stringify({ type: 'startGame' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-900/50 to-slate-950 text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBackToWelcome}
            className="mb-4 text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Welcome
          </button>
          <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-4">
            <h1 className="text-3xl font-extrabold">Room: {roomId}</h1>
            <p className="text-sm">
              You are <span className="font-bold">{username}</span> {isCreator && '(Host)'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Player List */}
          <div className="lg:col-span-1">
            <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-4 mb-4">
              <h3 className="text-xl font-extrabold mb-3">Players ({players.length})</h3>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center px-3 py-2 bg-neutral-100 border-4 border-black rounded-none shadow-[4px_4px_0_0_#000]"
                  >
                    <span className="font-medium">{player.name}</span>
                    <span className="text-sm text-gray-600">Ready</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Controls (Host only) */}
            {isCreator && (
              <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-4">
                <h4 className="text-lg font-extrabold mb-3">Host Controls</h4>
                <button
                  onClick={startGame}
                  className="w-full px-4 py-3 bg-lime-200 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all"
                >
                  Start Game
                </button>
                <p className="text-xs text-gray-600 mt-2">Or type "startgame" in chat</p>
              </div>
            )}
          </div>

          {/* Right: Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white text-black border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-6">
              <h3 className="text-xl font-extrabold mb-4">Lobby Chat</h3>
              <div className="h-64 sm:h-[50vh] overflow-y-auto space-y-2 mb-4 pr-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-neutral-100 border-4 border-black rounded-none shadow-[4px_4px_0_0_#000]"
                  >
                    {message}
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-yellow-200 placeholder-black/60 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none"
                />
                <button
                  onClick={sendChat}
                  className="px-4 py-3 bg-black text-white border-4 border-black rounded-none font-bold shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
