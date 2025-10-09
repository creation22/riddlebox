import React from 'react';

export default function GameOverView({ finalScores, onPlayAgain, onBackToLobby }) {
  const sortedScores = Object.entries(finalScores || {})
    .sort(([,a], [,b]) => b - a)
    .map(([name, score], index) => ({ name, score, rank: index + 1 }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-900/50 to-slate-950 text-white p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-white text-black border-4 border-black rounded-none shadow-[12px_12px_0_0_#000] p-8 text-center animate-fade-in-up">
          {/* Trophy icon */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-rose-300 flex items-center justify-center border-4 border-black shadow-[6px_6px_0_0_#000] animate-scale-pop">
            <span className="text-4xl">🏆</span>
          </div>
          
          <h1 className="text-4xl font-extrabold mb-2">Game Over!</h1>
          <p className="text-lg text-black/70 mb-8">Here are the final results</p>

          {/* Final Scores */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Final Scores</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sortedScores.map((player, index) => (
                <div 
                  key={player.name}
                  className={`flex justify-between items-center px-4 py-3 border-4 border-black rounded-none shadow-[4px_4px_0_0_#000] ${
                    index === 0 ? 'bg-amber-200' : 
                    index === 1 ? 'bg-gray-200' : 
                    index === 2 ? 'bg-orange-200' : 'bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${player.rank}`}
                    </span>
                    <span className="font-bold text-lg">{player.name}</span>
                  </div>
                  <span className="text-xl font-bold">{player.score} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Winner announcement */}
          {sortedScores.length > 0 && (
            <div className="mb-8 p-4 bg-gradient-to-r from-amber-200 to-rose-200 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000]">
              <h3 className="text-2xl font-bold text-black">
                🎉 {sortedScores[0].name} wins! 🎉
              </h3>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onBackToLobby}
              className="px-6 py-3 bg-white border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all"
            >
              Back to Lobby
            </button>
            <button 
              onClick={onPlayAgain}
              className="px-6 py-3 bg-amber-200 border-4 border-black font-bold rounded-none shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_#000] transition-all"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
