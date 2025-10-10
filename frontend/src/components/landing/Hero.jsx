import React from 'react';

export default function Hero({ onGetStarted, onJoin }) {
  const [username, setUsername] = React.useState('');
  const [roomId, setRoomId] = React.useState('');

  const handleJoin = () => {
    const u = username.trim();
    const r = roomId.trim().toUpperCase();
    if (!u || !r) return;
    onJoin?.({ username: u, roomId: r, isCreator: false });
  };

  const handleCreate = () => {
    const id = Math.random().toString(36).slice(2,8).toUpperCase();
    setRoomId(id);
    const u = username.trim();
    if (!u) return;
    onJoin?.({ username: u, roomId: id, isCreator: true });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20 bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(0,0,0,0.1) 49px, rgba(0,0,0,0.1) 50px),
                          repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(0,0,0,0.1) 49px, rgba(0,0,0,0.1) 50px)`
      }}></div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Text content */}
        <div className="text-center lg:text-left space-y-8">
          <div className="inline-block">
            <span className="px-5 py-2 bg-yellow-300 border-4 border-black rounded-none text-black text-sm font-black uppercase shadow-[4px_4px_0_0_#000] rotate-[-2deg] inline-block">
              🎮 Real-Time Multiplayer
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-black leading-[0.9] tracking-tight">
            Challenge Your
            <span className="block mt-2 text-white" style={{
              textShadow: '6px 6px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'
            }}>
              Mind & Friends
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-black font-bold max-w-2xl bg-white/80 p-4 border-4 border-black shadow-[8px_8px_0_0_#000] rotate-[1deg]">
            Dive into the ultimate riddle-solving experience. Compete in real-time, 
            race against the clock, and prove you're the sharpest mind in the room.
          </p>

          <div className="flex flex-col gap-4 justify-center lg:justify-start">
            {/* Neo-brutalist quick join/create */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-7 gap-3 items-stretch">
              <input
                className="sm:col-span-3 px-4 py-3 bg-yellow-300 text-black placeholder-black/60 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none focus:-translate-y-1 focus:shadow-[8px_8px_0_0_#000] transition-all font-bold"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                className="sm:col-span-3 px-4 py-3 bg-lime-300 text-black placeholder-black/60 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none focus:-translate-y-1 focus:shadow-[8px_8px_0_0_#000] transition-all font-bold uppercase"
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
              <div className="sm:col-span-1 grid grid-rows-2 gap-3">
                <button
                  type="button"
                  onClick={handleJoin}
                  className="w-full px-4 py-3 bg-white text-black border-4 border-black rounded-none font-black shadow-[6px_6px_0_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all"
                >
                  Join
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="w-full px-4 py-3 bg-black text-white border-4 border-black rounded-none font-black shadow-[6px_6px_0_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#fff] transition-all"
                >
                  Create
                </button>
              </div>
            </div>
          </div>

          {/* Stats - Neo-brutalist cards */}
          <div className="flex gap-6 justify-center lg:justify-start pt-8 flex-wrap">
            <div className="bg-rose-300 border-4 border-black p-4 shadow-[6px_6px_0_0_#000] rotate-[-2deg] hover:rotate-0 transition-transform">
              <div className="text-4xl font-black text-black">1000+</div>
              <div className="text-sm font-bold text-black uppercase">Active Players</div>
            </div>
            <div className="bg-lime-300 border-4 border-black p-4 shadow-[6px_6px_0_0_#000] rotate-[2deg] hover:rotate-0 transition-transform">
              <div className="text-4xl font-black text-black">500+</div>
              <div className="text-sm font-bold text-black uppercase">Riddles</div>
            </div>
            <div className="bg-cyan-300 border-4 border-black p-4 shadow-[6px_6px_0_0_#000] rotate-[-1deg] hover:rotate-0 transition-transform">
              <div className="text-4xl font-black text-black">24/7</div>
              <div className="text-sm font-bold text-black uppercase">Live Games</div>
            </div>
          </div>
        </div>

        {/* Right side - Neo-brutalist card composition */}
        <div className="relative">
          {/* Main card */}
          <div className="relative bg-white border-8 border-black shadow-[12px_12px_0_0_#000] p-2 rotate-[2deg] hover:rotate-0 transition-transform">
            <img 
              src="https://images.unsplash.com/photo-1645361528154-a1ed4329734e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw2fHxicmFpbiUyMHB1enpsZSUyMGFic3RyYWN0JTIwZ2VvbWV0cmljfGVufDB8MHx8cHVycGxlfDE3NjAwMTQ1ODF8MA&ixlib=rb-4.1.0&q=85"
              alt="Abstract colorful brain puzzle illustration"
              className="w-full aspect-[4/3] object-cover border-4 border-black"
            />
          </div>

          {/* Floating accent cards */}
          <div className="absolute -top-8 -right-8 bg-yellow-300 border-4 border-black shadow-[8px_8px_0_0_#000] p-6 rotate-12 hover:rotate-6 transition-transform hidden sm:block">
            <div className="text-5xl">🧩</div>
          </div>
          
          <div className="absolute -bottom-8 -left-8 bg-rose-400 border-4 border-black shadow-[8px_8px_0_0_#000] p-6 rotate-[-12deg] hover:rotate-[-6deg] transition-transform hidden sm:block">
            <div className="text-5xl">⚡</div>
          </div>

          {/* Small accent squares */}
          <div className="absolute top-1/4 -left-4 w-12 h-12 bg-lime-300 border-4 border-black shadow-[4px_4px_0_0_#000] rotate-45 hidden lg:block"></div>
          <div className="absolute bottom-1/3 -right-4 w-16 h-16 bg-cyan-300 border-4 border-black shadow-[4px_4px_0_0_#000] rotate-12 hidden lg:block"></div>
        </div>
      </div>
    </section>
  );
}


