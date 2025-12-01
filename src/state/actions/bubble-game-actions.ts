import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { globalStore } from '../stores/global-store';

export const bubbleGameActions = {
	/**
	 * Handle bubble absorption (correct bubble)
	 */
	async absorbBubble(bubbleId: string) {
		await kmClient.transact([globalStore], ([state]) => {
			const bubble = state.bubbles.find((b) => b.id === bubbleId);
			if (!bubble || !bubble.isCorrect) {
				return;
			}

			const clientId = kmClient.id;
			const progress = state.playerProgress[clientId];

			if (!progress) {
				// Initialize progress if not exists
				state.playerProgress[clientId] = {
					absorbedCount: 1,
					incorrectAttempts: 0,
					completionTime: null,
					accuracy: 0,
					score: 0
				};
			} else {
				progress.absorbedCount += 1;
				progress.score += config.correctPoints;

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
		await kmClient.transact([globalStore], ([state]) => {
			const clientId = kmClient.id;
			const progress = state.playerProgress[clientId];

			if (!progress) {
				// Initialize progress if not exists
				state.playerProgress[clientId] = {
					absorbedCount: 0,
					incorrectAttempts: 1,
					completionTime: null,
					accuracy: 0,
					score: -config.incorrectPointsPenalty
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
			}
		});
	}
};
