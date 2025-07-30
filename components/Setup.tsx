
import React, { useState, useEffect } from 'react';
import { SetupStep, Team, Pool, Player, AuctionConfig } from '../types.ts';
import { PlusIcon, TrashIcon, ArrowLeftIcon, ArrowRightIcon, UserCircleIcon } from './icons.tsx';

interface SetupProps {
  onSetupComplete: (
    teams: Team[],
    pools: Pool[],
    config: AuctionConfig
  ) => void;
}

const Setup: React.FC<SetupProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState<SetupStep>(SetupStep.TEAMS);
  const [teams, setTeams] = useState<Team[]>([]);
  const [poolCount, setPoolCount] = useState(1);
  const [pools, setPools] = useState<Pool[]>([
    { id: 'pool-0', name: 'Pool 1', players: [] },
  ]);
  const [newPlayers, setNewPlayers] = useState<{ [poolId: string]: string }>({});
  const [config, setConfig] = useState({ startingPoints: 1000, baseIncrement: 50, bidTimeout: 20 });
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('cricket-auction-users') || '[]');
    const regularUsers = storedUsers
        .filter((u: any) => u.role === 'user')
        .map((u: any) => u.username);
    
    setUsers(regularUsers);
    
    setTeams(regularUsers.map((username: string, i: number) => ({
      id: `team-${Date.now() + i}`,
      name: `Team ${i + 1}`,
      points: 0,
      players: [],
      controller: username
    })));
  }, []);

  const handleTeamNameChange = (id: string, name: string) => {
    setTeams(teams.map((team) => (team.id === id ? { ...team, name } : team)));
  };
  
  const handlePoolCountChange = (count: number) => {
    const newCount = Math.max(1, count);
    setPoolCount(newCount);
    const newPools = Array.from({ length: newCount }, (_, i) => {
        return pools[i] || { id: `pool-${i}`, name: `Pool ${i + 1}`, players: [] };
    });
    setPools(newPools);
  };
  
  const handlePoolNameChange = (id: string, name: string) => {
    setPools(pools.map(p => p.id === id ? {...p, name} : p));
  };
  
  const handleNewPlayerChange = (poolId: string, name: string) => {
    setNewPlayers({...newPlayers, [poolId]: name });
  };
  
  const handleAddPlayer = (poolId: string) => {
    const playerName = newPlayers[poolId]?.trim();
    if (!playerName) return;
    
    const newPlayer: Player = { id: `player-${Date.now()}`, name: playerName };
    setPools(pools.map(p => p.id === poolId ? {...p, players: [...p.players, newPlayer]} : p));
    setNewPlayers({...newPlayers, [poolId]: ''});
  };

  const handleRemovePlayer = (poolId: string, playerId: string) => {
    setPools(pools.map(p => p.id === poolId ? {...p, players: p.players.filter(pl => pl.id !== playerId)} : p));
  };

  const nextStep = () => {
    if (step === SetupStep.TEAMS) {
        if(teams.every(t => t.name.trim())) {
            setStep(SetupStep.POOLS_PLAYERS);
        } else {
            alert("Please fill in all team names.");
        }
    } else if (step === SetupStep.POOLS_PLAYERS) {
        if(pools.every(p => p.name.trim()) && pools.some(p => p.players.length > 0)) {
            setStep(SetupStep.AUCTION_CONFIG);
        } else {
            alert("Please ensure all pools have a name and at least one player is added to the auction.");
        }
    }
  };

  const prevStep = () => {
    if (step === SetupStep.POOLS_PLAYERS) setStep(SetupStep.TEAMS);
    if (step === SetupStep.AUCTION_CONFIG) setStep(SetupStep.POOLS_PLAYERS);
  };
  
  const finishSetup = () => {
    if (config.startingPoints > 0 && config.baseIncrement > 0 && config.bidTimeout > 0) {
        onSetupComplete(teams, pools, config);
    } else {
        alert("Points, increment, and timeout must be greater than zero.");
    }
  };

  const renderStep = () => {
    switch (step) {
      case SetupStep.TEAMS:
        return (
          <>
            <h2 className="text-2xl font-bold text-gold-300 mb-2">Step 1: Setup Your Teams</h2>
            <p className="text-gray-400 mb-6">Teams are automatically created for each registered user. You can customize their names.</p>
            <div>
                <div className="space-y-3">
                {teams.map((team, index) => (
                    <div key={team.id} className="flex items-center gap-3 bg-cricket-800/50 p-3 rounded-lg">
                      <div className="flex-shrink-0 flex items-center gap-2 text-gold-400">
                        <UserCircleIcon className="h-6 w-6"/>
                        <span className="font-semibold w-20 truncate">{team.controller}</span>
                      </div>
                      <input type="text" value={team.name} onChange={(e) => handleTeamNameChange(team.id, e.target.value)} placeholder={`Team ${index + 1} Name`} className="flex-grow bg-cricket-900 border border-cricket-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold-500 focus:outline-none"/>
                    </div>
                ))}
                {teams.length === 0 && <p className="text-yellow-400">No users found to create teams for. Please register user accounts first.</p>}
                </div>
            </div>
          </>
        );
      case SetupStep.POOLS_PLAYERS:
        return (
          <>
            <h2 className="text-2xl font-bold text-gold-300 mb-6">Step 2: Pools & Players</h2>
            <div className="space-y-6">
                <div>
                    <label htmlFor="poolCount" className="block text-sm font-medium text-gray-300 mb-2">How many player pools?</label>
                    <input id="poolCount" type="number" value={poolCount} onChange={(e) => handlePoolCountChange(parseInt(e.target.value))} min="1" className="w-full bg-cricket-800 border border-cricket-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold-500 focus:outline-none"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pools.map((pool, index) => (
                        <div key={pool.id} className="bg-cricket-900 p-4 rounded-lg">
                            <input type="text" value={pool.name} onChange={(e) => handlePoolNameChange(pool.id, e.target.value)} placeholder={`Pool ${index + 1} Name`} className="w-full bg-cricket-800 border border-cricket-700 rounded-lg px-4 py-2 mb-4 font-bold text-lg focus:ring-2 focus:ring-gold-500 focus:outline-none"/>
                            <div className="flex gap-2 mb-4">
                                <input type="text" value={newPlayers[pool.id] || ''} onChange={(e) => handleNewPlayerChange(pool.id, e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer(pool.id)} placeholder="Enter player name" className="flex-grow bg-cricket-700 border border-cricket-800 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-gold-500 focus:outline-none"/>
                                <button onClick={() => handleAddPlayer(pool.id)} className="bg-gold-500 hover:bg-gold-400 text-cricket-950 p-2 rounded-lg"><PlusIcon className="h-5 w-5"/></button>
                            </div>
                            <ul className="space-y-2 max-h-48 overflow-y-auto">
                                {pool.players.map(player => (
                                    <li key={player.id} className="flex justify-between items-center bg-cricket-800 px-3 py-1.5 rounded-md">
                                        <span>{player.name}</span>
                                        <button onClick={() => handleRemovePlayer(pool.id, player.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-4 w-4"/></button>
                                    </li>
                                ))}
                                {pool.players.length === 0 && <li className="text-gray-500 text-sm text-center py-2">No players added yet.</li>}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
          </>
        );
      case SetupStep.AUCTION_CONFIG:
        return (
          <>
            <h2 className="text-2xl font-bold text-gold-300 mb-6">Step 3: Auction Rules</h2>
            <div className="space-y-6 max-w-md mx-auto">
                <div>
                    <label htmlFor="points" className="block text-sm font-medium text-gray-300 mb-2">How many points per team to start?</label>
                    <input id="points" type="number" value={config.startingPoints} onChange={(e) => setConfig({...config, startingPoints: parseInt(e.target.value)})} min="1" className="w-full bg-cricket-800 border border-cricket-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold-500 focus:outline-none"/>
                </div>
                <div>
                    <label htmlFor="increment" className="block text-sm font-medium text-gray-300 mb-2">Base Increment Price</label>
                    <input id="increment" type="number" value={config.baseIncrement} onChange={(e) => setConfig({...config, baseIncrement: parseInt(e.target.value)})} min="1" className="w-full bg-cricket-800 border border-cricket-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold-500 focus:outline-none"/>
                </div>
                <div>
                    <label htmlFor="timeout" className="block text-sm font-medium text-gray-300 mb-2">Bid Timeout (seconds)</label>
                    <input id="timeout" type="number" value={config.bidTimeout} onChange={(e) => setConfig({...config, bidTimeout: parseInt(e.target.value)})} min="1" className="w-full bg-cricket-800 border border-cricket-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold-500 focus:outline-none"/>
                </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-cricket-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl border border-cricket-700">
      <div className="mb-8">{renderStep()}</div>
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-cricket-700">
        <button onClick={prevStep} disabled={step === SetupStep.TEAMS} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
          <ArrowLeftIcon className="h-5 w-5"/>
          Back
        </button>
        {step === SetupStep.AUCTION_CONFIG ? (
          <button onClick={finishSetup} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 text-lg">
            Start Auction!
          </button>
        ) : (
          <button onClick={nextStep} className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-cricket-950 font-bold py-2 px-4 rounded-lg transition-colors duration-300">
            Next
            <ArrowRightIcon className="h-5 w-5"/>
          </button>
        )}
      </div>
    </div>
  );
};

export default Setup;
