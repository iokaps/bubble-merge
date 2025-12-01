import { kmClient } from '@/services/km-client';

export interface BubbleData {
	id: string;
	label: string;
	isCorrect: boolean;
}

export interface RoundConfig {
	correctCount: number;
	incorrectCount: number;
}

export interface PlayerProgress {
	absorbedCount: number;
	incorrectAttempts: number;
	completionTime: number | null;
	accuracy: number;
	score: number;
}

export interface RoundWinner {
	clientId: string;
	playerName: string;
	round: number;
	score: number;
	completionTime: number;
}

export interface GlobalState {
	controllerConnectionId: string;
	started: boolean;
	startTimestamp: number;
	players: Record<string, { name: string }>;

	// Game state
	gamePhase: 'setup' | 'playing' | 'countdown' | 'results' | 'idle';
	currentRound: number;
	totalRounds: number;
	roundStartTime: number;
	roundTimeRemaining: number; // Milliseconds remaining in round
	countdownStartTime: number; // For countdown between rounds

	// Round configuration
	roundConfig: RoundConfig;

	// Puzzle content
	targetBubble: {
		label: string;
		category: string;
	};
	bubbles: BubbleData[];

	// Store all rounds puzzles (for AI-generated games)
	allRoundsPuzzles: Array<{
		targetCategory: string;
		correctBubbles: string[];
		incorrectBubbles: string[];
	}>;

	// Player progress tracking
	playerProgress: Record<string, PlayerProgress>;

	// Leaderboard (round winners)
	roundWinners: RoundWinner[];
}

const initialState: GlobalState = {
	controllerConnectionId: '',
	started: false,
	startTimestamp: 0,
	players: {},

	gamePhase: 'idle',
	currentRound: 0,
	totalRounds: 3,
	roundStartTime: 0,
	roundTimeRemaining: 0,
	countdownStartTime: 0,

	roundConfig: {
		correctCount: 4,
		incorrectCount: 2
	},

	targetBubble: {
		label: '',
		category: ''
	},
	bubbles: [],

	allRoundsPuzzles: [],

	playerProgress: {},
	roundWinners: []
};

export const globalStore = kmClient.store<GlobalState>('global', initialState);
