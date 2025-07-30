
export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  points: number;
  players: Player[];
  controller: string | null; // Username of the controlling user
}

export interface Pool {
  id: string;
  name: string;
  players: Player[];
}

export interface AuctionConfig {
  startingPoints: number;
  baseIncrement: number;
  bidTimeout: number;
}

export interface User {
  username: string;
  role: 'admin' | 'user';
}

export enum GamePhase {
  AUTH,
  SETUP,
  WAITING_FOR_AUCTION,
  AUCTION,
}

export enum SetupStep {
  TEAMS,
  POOLS_PLAYERS,
  AUCTION_CONFIG,
}

// Represents the shared state of the entire auction
export interface AuctionState {
    gamePhase: GamePhase;
    teams: Team[];
    pools: Pool[];
    config: AuctionConfig | null;
    biddingState?: {
      currentPlayer: Player | null;
      currentBid: number;
      highestBidder: Team | null;
      biddingTeamIndex: number;
      passedTeams: string[]; // Store as array for JSON compatibility
      lastMessage: string | null;
      turnExpiresAt: number | null;
    };
    isAuctionFinished: boolean;
}