
import React from 'react';

const WaitingRoom: React.FC = () => {
  return (
    <div className="text-center flex flex-col items-center justify-center p-8 bg-cricket-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-cricket-700 min-h-[400px]">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-600 h-24 w-24 mb-6"></div>
      <style>{`.loader { border-top-color: #FBBF24; -webkit-animation: spinner 1.5s linear infinite; animation: spinner 1.5s linear infinite; } @-webkit-keyframes spinner { 0% { -webkit-transform: rotate(0deg); } 100% { -webkit-transform: rotate(360deg); } } @keyframes spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <h2 className="text-3xl font-bold text-gold-300">Waiting for Auction to Start</h2>
      <p className="text-lg mt-3 text-gray-400">The auction is being prepared by the admin.</p>
      <p className="text-lg text-gray-400">This screen will update automatically when the auction begins.</p>
    </div>
  );
};

export default WaitingRoom;