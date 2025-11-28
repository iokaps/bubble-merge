import { kmClient } from '@/services/km-client';

export interface PlayerState {
	name: string;
	currentView:
		| 'lobby'
		| 'shared-state'
		| 'connections'
		| 'game-setup'
		| 'bubble-game'
		| 'round-results';
	setupMode: 'manual' | 'ai';
}

const initialState: PlayerState = {
	name: '',
	currentView: 'lobby',
	setupMode: 'manual'
};

export const playerStore = kmClient.localStore<PlayerState>(
	'player',
	initialState
);
