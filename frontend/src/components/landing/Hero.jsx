
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
    <div className="min-h-screen flex flex-col">
      <section className="relative flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400">
        {/* Enhanced animated grid pattern */}
        <div className="absolute inset-0 opacity-25" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.2) 39px, rgba(0,0,0,0.2) 40px),
                            repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.2) 39px, rgba(0,0,0,0.2) 40px)`,
          backgroundSize: '80px 80px'
        }}></div>

        {/* Enhanced floating shapes with animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-16 left-6 w-16 h-16 bg-yellow-300 border-[5px] border-black rotate-45 animate-float-slow"></div>
          <div className="absolute top-32 right-16 w-20 h-20 bg-rose-400 border-[5px] border-black rounded-full animate-float-medium"></div>
          <div className="absolute bottom-32 left-1/4 w-14 h-14 bg-lime-300 border-[5px] border-black rotate-12 animate-float-fast"></div>
          <div className="absolute top-1/2 right-12 w-10 h-10 bg-cyan-300 border-[5px] border-black animate-pulse"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - Enhanced text content */}
            <div className="text-center lg:text-left space-y-6 sm:space-y-8">
              {/* Badge */}
              <div className="inline-block transform hover:scale-105 transition-transform duration-300">
                <span className="px-4 py-2 bg-yellow-300 border-[4px] border-black rounded-none text-black text-xs sm:text-sm font-black uppercase shadow-[4px_4px_0_0_#000] rotate-[-2deg] inline-block hover:rotate-0 transition-all duration-300">
                  🎮 Real-Time Multiplayer
                </span>
              </div>
              
              {/* Centered Main heading */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black leading-[0.95] tracking-tight">
                  <span className="text-white block" style={{
                    textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'
                  }}>
                    Challenge
                  </span>
                  <span className="block mt-2">
                    Your Mind
                  </span>
                </h1>
                
                <div className="inline-flex items-center gap-2 bg-black px-3 py-1 border-[3px] border-white shadow-[4px_4px_0_0_#fff] rotate-[1deg] mt-4">
                  <span className="text-lg">⚡</span>
                  <span className="text-white font-black text-sm uppercase">Vs Friends</span>
                  <span className="text-lg">🧠</span>
                </div>
              </div>

              {/* Enhanced description */}
              <div className="max-w-xl mx-auto lg:mx-0">
                <p className="text-base sm:text-lg md:text-xl text-black font-bold bg-white/90 p-4 border-[4px] border-black shadow-[6px_6px_0_0_#000] rotate-[1deg] hover:rotate-0 transition-transform duration-300">
                  Dive into the ultimate riddle-solving arena. Compete in real-time, 
                  race against the clock, and prove you're the sharpest mind alive! 🏆⚡
                </p>
              </div>

              {/* Enhanced quick join/create form */}
              <div className="space-y-3 sm:space-y-4 max-w-md mx-auto lg:mx-0">
                <div className="transform hover:scale-[1.02] transition-transform duration-300">
                  <input
                    className="w-full px-4 py-3 bg-yellow-300 text-black placeholder-black/60 border-[4px] border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none focus:-translate-y-1 focus:shadow-[8px_8px_0_0_#000] transition-all duration-300 font-bold text-sm sm:text-base placeholder:font-bold"
                    placeholder="🎯 ENTER USERNAME"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 transform hover:scale-[1.02] transition-transform duration-300">
                  <input
                    className="flex-1 px-4 py-3 bg-lime-300 text-black placeholder-black/60 border-[4px] border-black rounded-none shadow-[6px_6px_0_0_#000] focus:outline-none focus:-translate-y-1 focus:shadow-[8px_8px_0_0_#000] transition-all duration-300 font-bold uppercase text-sm sm:text-base placeholder:font-bold"
                    placeholder="🚪 ROOM ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={!username.trim() || !roomId.trim()}
                    className="px-4 py-3 bg-white text-black border-[4px] border-black rounded-none font-black text-sm sm:text-base shadow-[6px_6px_0_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    JOIN 🚀
                  </button>
                </div>
                
                {/* Enhanced separator */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-[3px] border-black"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-cyan-300 px-4 py-1 text-black font-black text-sm border-[3px] border-black shadow-[3px_3px_0_0_#000]">
                      ⚡ OR ⚡
                    </span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!username.trim()}
                  className="w-full px-4 py-3 bg-black text-white border-[4px] border-black rounded-none font-black text-base shadow-[6px_6px_0_0_#fff] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#fff] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-[1.02]"
                >
                  🎨 CREATE ROOM
                </button>
              </div>

              {/* Stats Heading */}
              <div className="mt-8 text-center lg:text-left ">
                <h2 className="text-2xl sm:text-3xl font-black text-black bg-white/90 p-3 border-[4px] border-black shadow-[6px_6px_0_0_#000] rotate-[-1deg] inline-block mt-20">
                  📊 LIVE STATS
                </h2>
              </div>

              {/* Enhanced Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  { number: "1K+", label: "Players", bg: "bg-rose-300", rotate: "-2deg" },
                  { number: "500+", label: "Riddles", bg: "bg-lime-300", rotate: "1deg" },
                  { number: "24/7", label: "Live", bg: "bg-cyan-300", rotate: "-1deg" }
                ].map((stat, index) => (
                  <div 
                    key={index}
                    className={`${stat.bg} border-[4px] border-black p-3 shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:rotate-0 hover:shadow-[6px_6px_0_0_#000] transition-all duration-300 ${stat.rotate}`}
                  >
                    <div className="text-xl sm:text-2xl font-black text-black mb-1">{stat.number}</div>
                    <div className="text-xs font-black text-black uppercase tracking-wide">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Optimized for space */}
            <div className="relative hidden lg:block">
              {/* Main card */}
              <div className="relative bg-white border-[8px] border-black shadow-[12px_12px_0_0_#000] p-2 rotate-[2deg] hover:rotate-0 transition-transform duration-500 group">
                <img 
                  src="https://plus.unsplash.com/premium_vector-1743985813494-e1cf9bb3c0bf?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDZ8fHxlbnwwfHx8fHw%3D&auto=format&fit=crop&q=60&w=600" 
                  alt="Abstract colorful brain puzzle"
                  className="w-full aspect-[4/3] object-cover border-[4px] border-black group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Floating accent cards */}
              <div className="absolute -top-4 -right-4 bg-yellow-300 border-[4px] border-black shadow-[6px_6px_0_0_#000] p-4 rotate-12 hover:rotate-6 transition-transform duration-300">
                <div className="text-4xl">🧩</div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-rose-400 border-[4px] border-black shadow-[6px_6px_0_0_#000] p-4 rotate-[-12deg] hover:rotate-[-6deg] transition-transform duration-300">
                <div className="text-4xl">⚡</div>
              </div>
            </div>
          </div>

          {/* Features Heading */}
          <div className="mt-12 sm:mt-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-black bg-white/90 p-4 border-[4px] border-black shadow-[6px_6px_0_0_#000] rotate-[1deg] inline-block">
              🚀 FEATURES
            </h2>
          </div>

          {/* Compact Features Section */}
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: "⚡", title: "Lightning Fast", desc: "Real-time WebSocket gameplay" },
              { icon: "🎯", title: "Competitive", desc: "Live scoreboard & rankings" },
              { icon: "👥", title: "Multiplayer", desc: "Private & public rooms" },
              { icon: "🧠", title: "Brain Training", desc: "Hundreds of riddles" }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white border-[4px] border-black p-3 shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all duration-300"
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h3 className="font-black text-base mb-1 text-black">{feature.title}</h3>
                <p className="text-xs text-black/70 font-medium leading-tight">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add custom animations */}
        <style>{`
          @keyframes float-slow {
            0%, 100% { transform: translateY(0) rotate(45deg); }
            50% { transform: translateY(-10px) rotate(45deg); }
          }
          @keyframes float-medium {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes float-fast {
            0%, 100% { transform: translateY(0) rotate(12deg); }
            50% { transform: translateY(-6px) rotate(12deg); }
          }
          .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
          .animate-float-medium { animation: float-medium 4s ease-in-out infinite; }
          .animate-float-fast { animation: float-fast 3s ease-in-out infinite; }
        `}</style>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t-[6px] border-white py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Left side - Logo and tagline */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <div className="w-8 h-8 bg-yellow-300 border-[3px] border-white rotate-45"></div>
                <span className="text-white font-black text-lg sm:text-xl">RIDDLE BOX</span>
              </div>
              <p className="text-gray-400 text-sm mt-1 font-medium">
                Where minds collide and riddles are solved ⚡
              </p>
            </div>

            {/* Center - Simple links */}
            <div className="flex gap-4 sm:gap-6">
              <a
                href="https://twitter.com/_creation22"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-yellow-300 font-bold text-sm transition-colors duration-300 hover:scale-110 transform flex items-center gap-1"
              >
                <span>🐦</span> Twitter
              </a>
              <a
                href="https://buymeacoffee.com/creation22"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-yellow-300 font-bold text-sm transition-colors duration-300 hover:scale-110 transform flex items-center gap-1"
              >
                <span>☕</span> Buy Me Coffee
              </a>
              <a
                href="https://www.linkedin.com/in/ssrajangupta22/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-yellow-300 font-bold text-sm transition-colors duration-300 hover:scale-110 transform flex items-center gap-1"
              >
                <span>💼</span> LinkedIn
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t-2 border-gray-800 mt-4 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-gray-500 text-xs font-medium">
              © 2024 Riddle Box. All rights reserved. Made with ❤️ for puzzle lovers
            </p>
            <div className="flex gap-4">
              <button className="text-gray-500 hover:text-white text-xs font-medium transition-colors">
                Privacy Policy
              </button>
              <button className="text-gray-500 hover:text-white text-xs font-medium transition-colors">
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}