
import React, { useState, useEffect, useCallback } from 'react';
import { GamePhase, Team, Pool, AuctionConfig, User, AuctionState } from './types.ts';
import Setup from './components/Setup.tsx';
import Auction from './components/Auction.tsx';
import Auth from './components/Auth.tsx';
import WaitingRoom from './components/WaitingRoom.tsx';
import { LogoIcon, LogoutIcon, UserCircleIcon, ClockIcon } from './components/icons.tsx';

const AUCTION_STATE_KEY = 'cricket-auction-state';
const USER_SESSION_KEY = 'cricket-auction-user';

const getInitialState = (): AuctionState => {
    try {
        const storedState = localStorage.getItem(AUCTION_STATE_KEY);
        if (storedState) {
            const parsedState = JSON.parse(storedState);
            return {
                ...parsedState,
                gamePhase: parsedState.gamePhase || GamePhase.SETUP,
            };
        }
    } catch (e) {
        console.error("Failed to parse auction state from localStorage", e);
    }
    return {
        gamePhase: GamePhase.SETUP,
        teams: [],
        pools: [],
        config: null,
        isAuctionFinished: false,
    };
};

const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm font-mono bg-cricket-900 px-3 py-1 rounded-md text-gold-300">
            <ClockIcon className="h-5 w-5" />
            <span>{time.toLocaleTimeString()}</span>
        </div>
    );
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState>(getInitialState());

  const updateAuctionState = useCallback((newState: Partial<AuctionState>) => {
    setAuctionState(prevState => {
        const updatedState = {...prevState, ...newState};
        localStorage.setItem(AUCTION_STATE_KEY, JSON.stringify(updatedState));
        return updatedState;
    });
  }, []);

  useEffect(() => {
    const loggedInUser = localStorage.getItem(USER_SESSION_KEY);
    if (loggedInUser) {
      setCurrentUser(JSON.parse(loggedInUser));
    }

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === AUCTION_STATE_KEY && event.newValue) {
            try {
                setAuctionState(JSON.parse(event.newValue));
            } catch (e) {
                console.error("Error parsing storage update", e);
            }
        }
        if (event.key === USER_SESSION_KEY && !event.newValue) {
            setCurrentUser(null);
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
        if (auctionState.gamePhase === GamePhase.SETUP) {
            updateAuctionState({ gamePhase: GamePhase.SETUP });
        }
    } else {
        if (auctionState.gamePhase !== GamePhase.AUCTION) {
            updateAuctionState({ gamePhase: GamePhase.WAITING_FOR_AUCTION });
        }
    }
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_SESSION_KEY);
  };
  
  const handleSetupComplete = (
    finalTeams: Team[],
    finalPools: Pool[],
    config: AuctionConfig
  ) => {
    const unsoldPool: Pool = {
      id: 'unsold-pool',
      name: 'Unsold Players',
      players: [],
    };

    updateAuctionState({
        gamePhase: GamePhase.AUCTION,
        teams: finalTeams.map(team => ({ ...team, points: config.startingPoints })),
        pools: [...finalPools, unsoldPool],
        config: config,
        isAuctionFinished: false,
        biddingState: {
            currentPlayer: null,
            currentBid: 0,
            highestBidder: null,
            biddingTeamIndex: -1,
            passedTeams: [],
            lastMessage: `Auction is starting! Select a pool to begin.`,
            turnExpiresAt: null,
        }
    });
  };
  
  const handleResetAuction = () => {
    if (currentUser?.role === 'admin') {
        const freshState: AuctionState = {
            gamePhase: GamePhase.SETUP,
            teams: [],
            pools: [],
            config: null,
            isAuctionFinished: false,
        };
        setAuctionState(freshState);
        localStorage.setItem(AUCTION_STATE_KEY, JSON.stringify(freshState));
    }
  };

  const renderContent = () => {
    if (!currentUser) {
        return <Auth onAuthSuccess={handleAuthSuccess} />;
    }
    
    if (currentUser.role === 'admin') {
        if (auctionState.gamePhase === GamePhase.SETUP) {
             return <Setup onSetupComplete={handleSetupComplete} />;
        }
    }
    
    if (currentUser.role === 'user' && (auctionState.gamePhase === GamePhase.SETUP || auctionState.gamePhase === GamePhase.WAITING_FOR_AUCTION)) {
        return <WaitingRoom />;
    }

    if (auctionState.gamePhase === GamePhase.AUCTION && auctionState.config) {
        return (
            <Auction
                state={auctionState}
                currentUser={currentUser}
                onStateChange={updateAuctionState}
            />
        );
    }
    
    return <WaitingRoom />;
  }

  return (
    <div className="min-h-screen bg-cricket-950 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="w-full max-w-7xl mx-auto flex justify-between items-center pb-4 border-b border-cricket-700 mb-8">
        <div className="flex items-center gap-3">
          <LogoIcon className="h-10 w-10 text-gold-400"/>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gold-400 to-amber-500">
            Cricket Premier Auction
          </h1>
        </div>
        {currentUser && (
            <div className="flex items-center gap-4">
                 <Clock />
                 <div className="flex items-center gap-2 text-sm text-gray-300">
                    <UserCircleIcon className="h-6 w-6"/>
                    <span>{currentUser.username} ({currentUser.role})</span>
                </div>
                {currentUser.role === 'admin' && (
                <button
                    onClick={handleResetAuction}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-lg"
                >
                    Reset Auction
                </button>
                )}
                 <button
                    onClick={handleLogout}
                    title="Logout"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded-lg transition-colors duration-300 shadow-lg"
                >
                    <LogoutIcon className="h-6 w-6"/>
                </button>
            </div>
        )}
      </header>

      <main className="w-full max-w-7xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
