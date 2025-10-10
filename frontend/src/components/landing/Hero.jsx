import React from 'react';

export default function Hero({ onGetStarted, onJoin }) {
  const [username, setUsername] = React.useState('');
  const [roomId, setRoomId] = React.useState('');

  const submit = (e) => {
    e.preventDefault();
    const u = username.trim();
    const r = roomId.trim().toUpperCase();
    if (!u || !r) return;
    onJoin?.({ username: u, roomId: r, isCreator: false });
  };
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 md:w-96 h-80 md:h-96 bg-amber-400/15 rounded-full blur-3xl animate-soft-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-lime-400/15 rounded-full blur-3xl animate-soft-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-72 md:w-96 h-72 md:h-96 bg-rose-400/15 rounded-full blur-3xl animate-soft-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Left side - Text content */}
        <div className="text-center lg:text-left space-y-8">
          <div className="inline-block">
            <span className="px-4 py-2 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-full text-amber-300 text-sm font-medium">
              🎮 Real-Time Multiplayer
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Challenge Your
            <span className="block bg-gradient-to-r from-amber-400 via-rose-400 to-lime-400 bg-clip-text text-transparent">
              Mind & Friends
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 max-w-2xl">
            Dive into the ultimate riddle-solving experience. Compete in real-time, 
            race against the clock, and prove you're the sharpest mind in the room.
          </p>

          <div className="flex flex-col gap-4 justify-center lg:justify-start">
            {/* Neo-brutalist quick join/create */}
            <form onSubmit={submit} className="mt-4 grid grid-cols-1 sm:grid-cols-7 gap-2 sm:gap-3 items-stretch">
              <input
                className="sm:col-span-3 px-3 py-2 sm:px-4 sm:py-3 bg-yellow-200 text-black placeholder-black/60 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none focus:-translate-y-0.5 transition-transform"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                className="sm:col-span-3 px-3 py-2 sm:px-4 sm:py-3 bg-lime-200 text-black placeholder-black/60 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none focus:-translate-y-0.5 transition-transform"
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
              <div className="sm:col-span-1 grid grid-rows-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const u = username.trim();
                    const r = roomId.trim().toUpperCase();
                    if (!u || !r) return;
                    onJoin?.({ username: u, roomId: r, isCreator: false });
                  }}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white text-black border-4 border-black rounded-none font-bold shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all"
                >
                  Join
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = Math.random().toString(36).slice(2,8).toUpperCase();
                    setRoomId(id);
                    const u = username.trim();
                    if (!u) return;
                    onJoin?.({ username: u, roomId: id, isCreator: true });
                  }}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-black text-white border-4 border-black rounded-none font-bold shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>

          {/* Stats */}
          <div className="flex gap-8 justify-center lg:justify-start pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">1000+</div>
              <div className="text-sm text-slate-400">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-slate-400">Riddles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-sm text-slate-400">Live Games</div>
            </div>
          </div>
        </div>

        {/* Right side - Hero image with glassmorphism card */}
        <div className="relative">
          <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 p-4 sm:p-8 shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1645361528154-a1ed4329734e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw2fHxicmFpbiUyMHB1enpsZSUyMGFic3RyYWN0JTIwZ2VvbWV0cmljfGVufDB8MHx8cHVycGxlfDE3NjAwMTQ1ODF8MA&ixlib=rb-4.1.0&q=85"
              alt="Abstract colorful brain puzzle illustration - Ozgu Ozden on Unsplash"
              className="w-full max-w-[600px] mx-auto aspect-[3/2] rounded-2xl object-cover"
            />
            
            {/* Floating cards */}
            <div className="hidden sm:block absolute -top-4 -right-4 bg-gradient-to-br from-amber-500 to-rose-500 rounded-2xl p-4 shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="text-white text-2xl font-bold">🧩</div>
            </div>
            
            <div className="hidden sm:block absolute -bottom-4 -left-4 bg-gradient-to-br from-lime-500 to-amber-500 rounded-2xl p-4 shadow-xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}>
              <div className="text-white text-2xl font-bold">⚡</div>
            </div>
          </div>
        </div>
      </div>

     
    </section>
  );
}