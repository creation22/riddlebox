import React from 'react';
import Hero from './landing/Hero';
import Navbar from './landing/Navbar';

export default function LandingPage({ onGetStarted, onJoin }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-900/50 to-slate-950">
      <Navbar />
      <Hero onGetStarted={onGetStarted} onJoin={onJoin} />
    </div>
  );
}