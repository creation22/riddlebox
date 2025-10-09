import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import JoinRoom from './components/JoinRoom';
import RiddleGame from './components/RiddleGame';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [userData, setUserData] = useState(null);

  const handleGetStarted = () => {
    setCurrentView('join');
  };

  const handleJoin = ({ username, roomId }) => {
    setUserData({ username, roomId });
    setCurrentView('game');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setUserData(null);
  };

  return (
    <>
      {currentView === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} />
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
      {currentView === 'game' && userData && (
        <RiddleGame username={userData.username} roomId={userData.roomId} />
      )}
    </>
  );
}