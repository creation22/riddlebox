import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import JoinRoom from './components/JoinRoom';
import LobbyView from './components/LobbyView';
import RiddleGame from './components/RiddleGame';
import GameOverView from './components/GameOverView';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [userData, setUserData] = useState(null);
  const [gameData, setGameData] = useState(null);

  const handleGetStarted = () => {
    setCurrentView('join');
  };

  const handleJoin = ({ username, roomId, isCreator = false }) => {
    setUserData({ username, roomId, isCreator });
    setCurrentView('lobby');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setUserData(null);
    setGameData(null);
  };

  const handleStartGame = () => {
    setCurrentView('game');
  };

  const handleGameOver = (finalScores) => {
    setGameData({ finalScores });
    setCurrentView('gameover');
  };

  const handleBackToLobby = () => {
    setCurrentView('lobby');
    setGameData(null);
  };

  const handlePlayAgain = () => {
    setCurrentView('lobby');
    setGameData(null);
    // Reset game state by reloading the page to reconnect to lobby
    window.location.reload();
  };

  return (
    <>
      {currentView === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} onJoin={handleJoin} />
      )}
      {currentView === 'join' && (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
          <div className="w-full max-w-md">
            <button 
              onClick={handleBackToLanding}
              className="mb-4 text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </button>
            <JoinRoom onJoin={handleJoin} />
          </div>
        </div>
      )}
      {currentView === 'lobby' && userData && (
        <LobbyView 
          username={userData.username} 
          roomId={userData.roomId} 
          isCreator={userData.isCreator}
          onStartGame={handleStartGame}
          onBackToWelcome={handleBackToLanding}
        />
      )}
      {currentView === 'game' && userData && (
        <RiddleGame 
          username={userData.username} 
          roomId={userData.roomId} 
          isCreator={userData.isCreator}
          onGameOver={handleGameOver}
          onBackToLobby={handleBackToLobby}
        />
      )}
      {currentView === 'gameover' && gameData && (
        <GameOverView 
          finalScores={gameData.finalScores}
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </>
  );
}
