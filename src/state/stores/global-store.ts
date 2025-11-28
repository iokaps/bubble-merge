import { kmClient } from '@/services/km-client';

export interface BubbleData {
	id: string;
	label: string;
	isCorrect: boolean;
}

export interface RoundConfig {
	correctCount: number;
	incorrectCount: number;
	speedMultiplier: number;
	targetScale: number;
	gravityY: number;
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
	gamePhase: 'setup' | 'playing' | 'results' | 'idle';
	currentRound: number;
	totalRounds: number;
	roundStartTime: number;

	// Round configuration
	roundConfig: RoundConfig;

	// Puzzle content
	targetBubble: {
		label: string;
		category: string;
	};
	bubbles: BubbleData[];

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

	roundConfig: {
		correctCount: 4,
		incorrectCount: 2,
		speedMultiplier: 1.0,
		targetScale: 1.0,
		gravityY: 0.3
	},

	targetBubble: {
		label: '',
		category: ''
	},
	bubbles: [],

	playerProgress: {},
	roundWinners: []
};

export const globalStore = kmClient.store<GlobalState>('global', initialState);
