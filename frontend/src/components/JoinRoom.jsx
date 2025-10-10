import React, { useState } from "react";

export default function JoinRoom({ onJoin }) {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const u = username.trim();
    const r = roomId.trim().toUpperCase();
    if (!u || !r) return;
    onJoin({ username: u, roomId: r, isCreator: false });
  };

  const createRoom = () => {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    setRoomId(random);
    const u = username.trim();
    if (!u) return;
    onJoin({ username: u, roomId: random, isCreator: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-amber-900/60 to-slate-950 font-sans">
      <div className="w-full max-w-md bg-white border-4 border-black rounded-none shadow-[10px_10px_0_0_#000] p-6">
        <h2 className="text-2xl font-extrabold tracking-tight mb-6 text-center">
          Join or Create a Room
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full px-4 py-3 bg-yellow-200 text-black placeholder-black/60 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              className="col-span-1 sm:col-span-2 px-4 py-3 bg-lime-200 text-black placeholder-black/60 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button
              type="button"
              onClick={createRoom}
              className="col-span-1 px-4 py-3 bg-white text-black border-4 border-black rounded-none font-bold shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all"
            >
              New ID
            </button>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-black text-white border-4 border-black rounded-none font-bold shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}
