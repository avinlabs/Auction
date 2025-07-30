
import React, { useState, useCallback } from 'react';
import { Player } from '../types.ts';
import { PlayIcon } from './icons.tsx';

interface SpinWheelProps {
  players: Player[];
  onPlayerSelected: (player: Player) => void;
}

const SpinWheel: React.FC<SpinWheelProps> = ({ players, onPlayerSelected }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const spin = useCallback(() => {
    if (isSpinning || players.length === 0) return;

    setIsSpinning(true);
    const totalPlayers = players.length;
    const randomPlayerIndex = Math.floor(Math.random() * totalPlayers);
    const segmentAngle = 360 / totalPlayers;
    
    const randomSpins = 5 + Math.random() * 5;
    const newRotation = (360 * randomSpins) - (randomPlayerIndex * segmentAngle) - (segmentAngle / 2);
    
    setRotation(newRotation);

    setTimeout(() => {
      onPlayerSelected(players[randomPlayerIndex]);
      setIsSpinning(false);
    }, 6000); // Match this to the CSS transition duration
  }, [isSpinning, players, onPlayerSelected]);
  
  if (players.length === 0) {
      return <div className="text-center text-gray-500 p-8">No players in this pool to spin.</div>
  }

  const segmentAngle = 360 / players.length;
  const colors = ['#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac'];


  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
        <div 
          className="absolute w-full h-full rounded-full border-8 border-cricket-700 shadow-2xl"
          style={{ 
            transition: 'transform 6s cubic-bezier(0.25, 1, 0.5, 1)',
            transform: `rotate(${rotation}deg)` 
          }}
        >
          {players.map((player, index) => {
            const angle = segmentAngle * index;
            const backgroundColor = colors[index % colors.length];
            return (
              <div
                key={player.id}
                className="absolute w-1/2 h-1/2"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: '100% 100%',
                  clipPath: `polygon(0 0, 100% 0, 100% 100%)`,
                }}
              >
                <div
                  className="absolute w-full h-full"
                  style={{
                    backgroundColor,
                    transform: `rotate(${segmentAngle / 2}deg)`,
                    transformOrigin: '0 0',
                  }}
                >
                  <span
                    className="absolute text-white text-sm font-bold"
                    style={{
                      transform: `translate(40px, 80px) rotate(${90 - segmentAngle / 2}deg)`,
                      display: 'inline-block',
                      width: '120px',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                    }}
                  >
                    {player.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute w-0 h-0 border-l-8 border-r-8 border-t-16 border-l-transparent border-r-transparent border-t-gold-400" style={{top: '-8px'}}></div>
        <div className="absolute w-16 h-16 bg-cricket-800 rounded-full border-4 border-cricket-700 shadow-inner"></div>
      </div>
      <button 
        onClick={spin} 
        disabled={isSpinning} 
        className="mt-8 bg-gold-500 hover:bg-gold-400 text-cricket-950 font-bold py-3 px-8 rounded-lg text-xl transition-all duration-300 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2 transform active:scale-95"
      >
        <PlayIcon className="h-6 w-6"/>
        SPIN
      </button>
    </div>
  );
};

export default SpinWheel;
