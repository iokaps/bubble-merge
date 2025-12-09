import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { globalStore } from '../stores/global-store';

export const bubbleGameActions = {
	/**
	 * Handle bubble absorption (correct bubble)
	 */
	async absorbBubble(bubbleId: string) {
		const { playerStore } = await import('../stores/player-store');

		await kmClient.transact([globalStore], ([state]) => {
			const bubble = state.bubbles.find((b) => b.id === bubbleId);
			if (!bubble || !bubble.isCorrect) {
				return;
			}

			const clientId = kmClient.id;
			const progress = state.playerProgress[clientId];

			// Always ensure player name is synced
			const playerName = playerStore.proxy.name;
			if (playerName) {
				state.players[clientId] = { name: playerName };
			}

			if (!progress) {
				// Calculate points based on time remaining (10 points per second)
				const now = kmClient.serverTimestamp();
				const elapsed = now - state.roundStartTime;
				const remaining = Math.max(0, state.roundTimeRemaining - elapsed);
				const timePoints = Math.ceil(remaining / 1000) * 10;

				// Initialize progress if not exists
				state.playerProgress[clientId] = {
					absorbedCount: 1,
					incorrectAttempts: 0,
					completionTime: null,
					accuracy: 0,
					score: timePoints
				};
			} else {
				progress.absorbedCount += 1;
				
				// Calculate points based on time remaining (10 points per second)
				const now = kmClient.serverTimestamp();
				const elapsed = now - state.roundStartTime;
				const remaining = Math.max(0, state.roundTimeRemaining - elapsed);
				const timePoints = Math.ceil(remaining / 1000) * 10;
				
				progress.score += timePoints;

				// Check if round is complete
				const targetCount = state.roundConfig.correctCount;
				if (progress.absorbedCount >= targetCount) {
					const completionTime =
						kmClient.serverTimestamp() - state.roundStartTime;
					const accuracy =
						targetCount / (targetCount + progress.incorrectAttempts);

					progress.completionTime = completionTime;
					progress.accuracy = accuracy;

					// Add to round winners
					const playerName = state.players[clientId]?.name || 'Unknown';
					state.roundWinners.push({
						clientId,
						playerName,
						round: state.currentRound,
						score: progress.score,
						completionTime
					});

					// Sort winners by score (descending)
					state.roundWinners.sort((a, b) => b.score - a.score);
				}
			}
		});
	},

	/**
	 * Handle incorrect bubble collision
	 */
	async recordIncorrectAttempt() {
		const { playerStore } = await import('../stores/player-store');

		await kmClient.transact([globalStore], ([state]) => {
			const clientId = kmClient.id;
			const progress = state.playerProgress[clientId];

			// Always ensure player name is synced
			const playerName = playerStore.proxy.name;
			if (playerName) {
				state.players[clientId] = { name: playerName };
			}

			if (!progress) {
				// Initialize progress if not exists
				state.playerProgress[clientId] = {
					absorbedCount: 0,
					incorrectAttempts: 1,
					completionTime: null,
					accuracy: 0,
					score: 0
				};
			} else {
				progress.incorrectAttempts += 1;
				progress.score = Math.max(
					0,
					progress.score - config.incorrectPointsPenalty
				);
			}
		});
	},

	/**
	 * Initialize player progress when joining mid-game
	 */
	async initializeProgress() {
		const { playerStore } = await import('../stores/player-store');

		await kmClient.transact([globalStore], ([state]) => {
			const clientId = kmClient.id;

			if (!state.playerProgress[clientId] && state.gamePhase === 'playing') {
				state.playerProgress[clientId] = {
					absorbedCount: 0,
					incorrectAttempts: 0,
					completionTime: null,
					accuracy: 0,
					score: 0
				};

				// Always ensure player name is synced
				const playerName = playerStore.proxy.name;
				if (playerName) {
					state.players[clientId] = { name: playerName };
				}
			}
		});
	}
};
