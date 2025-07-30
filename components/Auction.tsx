
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Team, Pool, Player, AuctionState, User } from '../types.ts';
import SpinWheel from './SpinWheel.tsx';
import { TrophyIcon, GavelIcon, DownloadIcon, ClockIcon } from './icons.tsx';

interface AuctionProps {
  state: AuctionState;
  currentUser: User;
  onStateChange: (newState: Partial<AuctionState>) => void;
}

const TeamStatusCard: React.FC<{team: Team; maxPlayers: number; isMyTeam: boolean; isBiddingTurn: boolean;}> = ({ team, maxPlayers, isMyTeam, isBiddingTurn }) => {
    const cardClasses = [
        "bg-cricket-800/80 rounded-lg p-3 shadow-lg flex-shrink-0 w-64 transition-all duration-300",
        isBiddingTurn ? "border-2 border-gold-400 scale-105" : "border-2 border-transparent",
        isMyTeam ? "ring-2 ring-offset-2 ring-offset-cricket-950 ring-gold-500" : ""
    ].join(" ");

    return (
        <div className={cardClasses}>
            <h3 className="text-lg font-bold text-gold-400 truncate">{team.name} <span className="text-sm text-gray-400">({team.controller})</span></h3>
            <p className="text-2xl font-semibold text-yellow-300">{team.points.toLocaleString()} <span className="text-sm text-gray-400">Points</span></p>
            <div className="mt-2 border-t border-cricket-700 pt-2">
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-1">Squad ({team.players.length} / {maxPlayers})</h4>
                <ul className="text-sm space-y-1 max-h-24 overflow-y-auto">
                    {team.players.length > 0 ? team.players.map(p => <li key={p.id} className="bg-cricket-700 px-2 py-0.5 rounded-md truncate">{p.name}</li>) : <li className="text-gray-500">No players yet</li>}
                </ul>
            </div>
        </div>
    );
}

const BidTimer: React.FC<{expiresAt: number | null}> = ({ expiresAt }) => {
    const [remainingTime, setRemainingTime] = useState(0);

    useEffect(() => {
        if (!expiresAt) {
            setRemainingTime(0);
            return;
        }

        const calculateRemaining = () => {
            const timeLeft = Math.round((expiresAt - Date.now()) / 1000);
            setRemainingTime(Math.max(0, timeLeft));
        };

        calculateRemaining();
        const intervalId = setInterval(calculateRemaining, 1000);

        return () => clearInterval(intervalId);
    }, [expiresAt]);
    
    if (!expiresAt || remainingTime <= 0) return null;

    const percentage = (remainingTime / 20) * 100; // Assuming 20s max for visual consistency, could be passed as prop
    const barColor = percentage > 50 ? 'bg-green-500' : percentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="flex items-center gap-3 text-lg font-mono text-amber-300">
            <ClockIcon className="h-6 w-6"/>
            <span>{String(remainingTime).padStart(2, '0')}s</span>
            <div className="w-24 h-2 bg-cricket-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor} transition-all duration-1000 linear`} style={{width: `${percentage}%`}}></div>
            </div>
        </div>
    )
}

const Auction: React.FC<AuctionProps> = ({ state, currentUser, onStateChange }) => {
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  const { teams, pools, config, isAuctionFinished, biddingState } = state;
  const { currentPlayer, currentBid, highestBidder, biddingTeamIndex, passedTeams, lastMessage, turnExpiresAt } = biddingState || {};

  const maxPlayersPerTeam = useMemo(() => {
    if (!config) return 0;
    const totalPlayers = pools.reduce((acc, p) => p.players.length, 0);
    return Math.ceil(totalPlayers / teams.length) || 1;
  }, [pools, teams, config]);

  const activePools = pools.filter(p => p.players.length > 0 && p.id !== 'unsold-pool');
  const unsoldPool = pools.find(p => p.id === 'unsold-pool');
  const availablePools = [...activePools, (unsoldPool && unsoldPool.players.length > 0 && activePools.length === 0) ? unsoldPool : null].filter(Boolean) as Pool[];
  
  const getNextAvailableTeamIndex = useCallback((startIndex: number): number => {
      let nextIndex = startIndex;
      const currentPassedTeams = new Set(passedTeams || []);
      for (let i = 0; i < teams.length; i++) {
        const team = teams[nextIndex];
        if (
            !currentPassedTeams.has(team.id) &&
            team.points >= (highestBidder ? (currentBid || 0) + config!.baseIncrement : config!.baseIncrement) &&
            team.players.length < maxPlayersPerTeam
        ) {
          return nextIndex;
        }
        nextIndex = (nextIndex + 1) % teams.length;
      }
      return -1; // No available teams
  }, [teams, passedTeams, currentBid, config, highestBidder, maxPlayersPerTeam]);
  
  const sellPlayer = useCallback(() => {
    if (!highestBidder || !currentPlayer) return;
    
    const newTeams = teams.map(t => t.id === highestBidder.id ? { ...t, points: t.points - currentBid!, players: [...t.players, currentPlayer] } : t);
    const newPools = pools.map(p => p.id === selectedPoolId ? { ...p, players: p.players.filter(pl => pl.id !== currentPlayer.id) } : p);
    
    onStateChange({
        teams: newTeams,
        pools: newPools,
        biddingState: {
            ...biddingState!,
            lastMessage: `${currentPlayer.name} sold to ${highestBidder.name} for ${currentBid}!`,
            currentPlayer: null,
            turnExpiresAt: null,
        }
    });

  }, [highestBidder, currentPlayer, currentBid, teams, pools, selectedPoolId, onStateChange, biddingState]);

  const markPlayerUnsold = useCallback(() => {
     if (!currentPlayer) return;
     const newPools = pools.map(p => {
         if (p.id === selectedPoolId) return { ...p, players: p.players.filter(pl => pl.id !== currentPlayer.id) };
         if (p.id === 'unsold-pool') return { ...p, players: [...p.players, currentPlayer] };
         return p;
     });
     onStateChange({
        pools: newPools,
        biddingState: {
            ...biddingState!,
            lastMessage: `${currentPlayer.name} is unsold.`,
            currentPlayer: null,
            turnExpiresAt: null,
        }
     });
  }, [currentPlayer, pools, selectedPoolId, onStateChange, biddingState]);
  
  const handlePass = useCallback(() => {
    const passingTeam = teams[biddingTeamIndex!];
    if (passingTeam.controller !== currentUser.username) return;

    const newPassedTeams = [...(passedTeams || []), passingTeam.id];
    const newLastMessage = `${passingTeam.name} passes.`;
    
    const tempPassedSet = new Set(newPassedTeams);
    const remainingBidders = teams.filter(t => !tempPassedSet.has(t.id) && t.players.length < maxPlayersPerTeam && t.points >= (highestBidder ? currentBid! + config!.baseIncrement : config!.baseIncrement));

    if (highestBidder && remainingBidders.length === 0) {
        sellPlayer();
    } else if (!highestBidder && remainingBidders.length === 0) {
        markPlayerUnsold();
    } else {
        const nextIndex = getNextAvailableTeamIndex((biddingTeamIndex! + 1) % teams.length);
        if (nextIndex === -1) {
            highestBidder ? sellPlayer() : markPlayerUnsold();
        } else {
            onStateChange({
                biddingState: {
                    ...biddingState!,
                    passedTeams: newPassedTeams,
                    lastMessage: newLastMessage,
                    biddingTeamIndex: nextIndex,
                    turnExpiresAt: Date.now() + config!.bidTimeout * 1000,
                }
            });
        }
    }
  }, [teams, biddingTeamIndex, currentUser.username, passedTeams, highestBidder, currentBid, config, maxPlayersPerTeam, sellPlayer, markPlayerUnsold, onStateChange, getNextAvailableTeamIndex, biddingState]);

  useEffect(() => {
    if (turnExpiresAt && Date.now() >= turnExpiresAt) {
      const team = teams[biddingTeamIndex!];
      if (team && team.controller === currentUser.username) {
        handlePass();
      }
    }
  }, [turnExpiresAt, teams, biddingTeamIndex, currentUser.username, handlePass]);

  const handleBid = useCallback(() => {
    const biddingTeam = teams[biddingTeamIndex!];
    if (biddingTeam.controller !== currentUser.username) return;

    if (biddingTeam.players.length >= maxPlayersPerTeam || biddingTeam.points < (highestBidder ? currentBid! + config!.baseIncrement : currentBid!)) {
      handlePass();
      return;
    }

    const newBid = highestBidder ? currentBid! + config!.baseIncrement : currentBid!;
    const newHighestBidder = biddingTeam;
    
    onStateChange({
        biddingState: {
            ...biddingState!,
            currentBid: newBid,
            highestBidder: newHighestBidder,
            lastMessage: `${biddingTeam.name} bids ${newBid}!`,
            biddingTeamIndex: getNextAvailableTeamIndex((biddingTeamIndex! + 1) % teams.length),
            passedTeams: [], // Reset passed teams on a new bid
            turnExpiresAt: Date.now() + config!.bidTimeout * 1000,
        }
    });
  }, [teams, biddingTeamIndex, currentUser.username, maxPlayersPerTeam, highestBidder, currentBid, config, onStateChange, getNextAvailableTeamIndex, biddingState, handlePass]);

  const handlePlayerSelected = useCallback((player: Player) => {
    onStateChange({
        biddingState: {
            ...biddingState!,
            currentPlayer: player,
            currentBid: config!.baseIncrement,
            highestBidder: null,
            passedTeams: [],
            lastMessage: `Now bidding for ${player.name}. Opening bid is ${config!.baseIncrement}.`,
            biddingTeamIndex: getNextAvailableTeamIndex(0),
            turnExpiresAt: Date.now() + config!.bidTimeout * 1000,
        }
    })
  }, [config, onStateChange, getNextAvailableTeamIndex, biddingState]);

  useEffect(() => {
      if(availablePools.length === 0 && !currentPlayer) {
          onStateChange({ isAuctionFinished: true });
      }
  }, [availablePools, currentPlayer, onStateChange]);

  const handleExport = useCallback(() => {
    const winner = teams.reduce((prev, current) => (prev.players.length > current.players.length) ? prev : current);
    const dataToExport = {
        auctionWinner: winner.name,
        teams: teams.map(team => ({
            name: team.name,
            controller: team.controller,
            finalPoints: team.points,
            playersAcquired: team.players.length,
            squad: team.players.map(p => p.name)
        })),
        unsoldPlayers: unsoldPool?.players.map(p => p.name) || []
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'cricket-auction-results.json';
    link.click();
  }, [teams, unsoldPool]);

  if (isAuctionFinished) {
      const winner = teams.reduce((prev, current) => (prev.players.length > current.players.length) ? prev : current);
      return (
          <div className="text-center flex flex-col items-center justify-center p-8 bg-cricket-800 rounded-xl shadow-2xl">
              <TrophyIcon className="h-24 w-24 text-gold-400 mb-4"/>
              <h2 className="text-4xl font-bold text-gold-300">Auction Finished!</h2>
              <p className="text-xl mt-2 text-gray-300">Congratulations to</p>
              <p className="text-3xl font-bold my-4 text-gold-400">{winner.name}</p>
              <p className="text-lg text-gray-300">for acquiring the most players!</p>
              <button onClick={handleExport} className="mt-8 flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                  <DownloadIcon className="h-5 w-5"/> Export Results
              </button>
          </div>
      )
  }

  const currentPool = pools.find(p => p.id === selectedPoolId);
  const currentBiddingTeam = biddingTeamIndex !== -1 && biddingTeamIndex != null ? teams[biddingTeamIndex] : null;
  const isMyTurn = currentBiddingTeam?.controller === currentUser.username;
  const canBid = isMyTurn && currentBiddingTeam && currentBiddingTeam.players.length < maxPlayersPerTeam && currentBiddingTeam.points >= (highestBidder ? currentBid! + config!.baseIncrement : currentBid!);

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {teams.map(team => <TeamStatusCard key={team.id} team={team} maxPlayers={maxPlayersPerTeam} isMyTeam={team.controller === currentUser.username} isBiddingTurn={team.id === currentBiddingTeam?.id}/>)}
      </div>
      <div className="bg-cricket-900/60 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-cricket-700 min-h-[400px] flex flex-col justify-center items-center">
        {!selectedPoolId ? (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gold-300 mb-4">Select a Pool to Begin</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    {availablePools.map(pool => (
                        <button key={pool.id} onClick={() => setSelectedPoolId(pool.id)} className="bg-cricket-700 hover:bg-cricket-800 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg text-lg">
                           {pool.name} ({pool.players.length} players)
                        </button>
                    ))}
                </div>
            </div>
        ) : !currentPlayer ? (
            <div className="w-full flex flex-col items-center">
                <h2 className="text-2xl font-bold text-gold-300 mb-4">Spin for the next player from <span className="text-yellow-400">{currentPool?.name}</span></h2>
                <SpinWheel players={currentPool?.players || []} onPlayerSelected={handlePlayerSelected} />
                 <button onClick={() => setSelectedPoolId(null)} className="mt-6 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Change Pool
                </button>
            </div>
        ) : (
            <div className="w-full text-center">
                <p className="text-lg text-gray-400">Up for Auction</p>
                <h2 className="text-5xl font-extrabold my-2 bg-clip-text text-transparent bg-gradient-to-r from-gold-300 to-amber-400">{currentPlayer.name}</h2>
                <div className="my-6 p-4 bg-cricket-950 rounded-lg inline-block shadow-inner">
                    <p className="text-md text-gray-400">Current Bid</p>
                    <p className="text-4xl font-bold text-green-400">{currentBid!.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Highest Bidder: <span className="font-semibold text-gold-400">{highestBidder?.name || 'None'}</span></p>
                </div>
                
                {currentBiddingTeam ? (
                    <div className="mt-4 p-4 border-2 border-dashed border-gold-500/50 rounded-lg">
                        <div className="flex justify-center items-center gap-4 mb-3">
                           <p className="text-lg text-white">It's <span className="font-bold text-2xl text-gold-400">{currentBiddingTeam.name}'s</span> turn to bid.</p>
                           <BidTimer expiresAt={turnExpiresAt || null} />
                        </div>
                        <p className="text-gray-400 text-sm">Remaining Points: {currentBiddingTeam.points.toLocaleString()} | Squad: {currentBiddingTeam.players.length}/{maxPlayersPerTeam}</p>
                        <div className="flex justify-center gap-4 mt-4">
                            <button onClick={handleBid} disabled={!canBid} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-xl transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none">
                                BID {(currentBid! + config!.baseIncrement).toLocaleString()}
                            </button>
                            <button onClick={handlePass} disabled={!isMyTurn} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg text-xl transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none">
                                PASS
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 p-4 text-xl text-gold-400">Processing...</div>
                )}
            </div>
        )}
        <div className="mt-6 text-center text-amber-300 font-mono h-6 flex items-center justify-center gap-2">
            <GavelIcon className="h-5 w-5"/>
            <span>{lastMessage}</span>
        </div>
      </div>
    </div>
  );
};

export default Auction;
