import { kmClient } from '@/services/km-client';
import { setupGameActions } from '@/state/actions/setup-game-actions';
import { globalStore } from '@/state/stores/global-store';
import { useEffect, useRef } from 'react';
import { useSnapshot } from 'valtio';
import { useServerTimer } from './useServerTime';

export function useGlobalController() {
	const { controllerConnectionId } = useSnapshot(globalStore.proxy);
	const connections = useSnapshot(globalStore.connections);
	const connectionIds = connections.connectionIds;
	const isGlobalController = controllerConnectionId === kmClient.connectionId;
	const serverTime = useServerTimer(1000); // tick every second
	const countdownTriggeredRef = useRef(false);
	const roundEndTriggeredRef = useRef<number>(-1);

	// Maintain connection that is assigned to be the global controller
	useEffect(() => {
		// Check if global controller is online
		if (connectionIds.has(controllerConnectionId)) {
			return;
		}

		// Select new host, sorting by connection id
		kmClient
			.transact([globalStore], ([globalState]) => {
				const connectionIdsArray = Array.from(connectionIds);
				connectionIdsArray.sort();
				globalState.controllerConnectionId = connectionIdsArray[0] || '';
			})
			.then(() => {})
			.catch(() => {});
	}, [connectionIds, controllerConnectionId]);

	// Run global controller-specific logic
	useEffect(() => {
		if (!isGlobalController) {
			return;
		}

		const {
			gamePhase,
			roundStartTime,
			roundTimeRemaining,
			currentRound,
			totalRounds,
			countdownStartTime
		} = globalStore.proxy;

		// Handle round timer countdown
		if (gamePhase === 'playing') {
			const elapsed = serverTime - roundStartTime;
			const remaining = Math.max(0, roundTimeRemaining - elapsed);

			// Auto-end round when time runs out (only trigger once per round)
			if (remaining <= 0 && roundEndTriggeredRef.current !== currentRound) {
				roundEndTriggeredRef.current = currentRound;
				console.log(
					'[Controller] Round ended.',
					'CurrentRound:',
					currentRound,
					'TotalRounds:',
					totalRounds,
					'IsLastRound:',
					currentRound >= totalRounds
				);
				kmClient
					.transact([globalStore], ([state]) => {
						// Check if this is the last round
						if (currentRound >= totalRounds) {
							console.log('[Controller] Last round - showing results');
							// Show final results
							state.gamePhase = 'results';
						} else {
							console.log('[Controller] Starting countdown to next round');
							// Start countdown to next round
							state.gamePhase = 'countdown';
							state.countdownStartTime = kmClient.serverTimestamp();
						}
					})
					.then(() => {
						console.log(
							'[Controller] Round end transaction completed successfully'
						);
					})
					.catch((err) =>
						console.error('[Controller] Error ending round:', err)
					);
			}
		}

		// Handle countdown between rounds
		if (gamePhase === 'countdown' && countdownStartTime > 0) {
			const countdownElapsed = serverTime - countdownStartTime;
			const countdownDuration = 3000; // 3 seconds

			console.log(
				'[Controller] Countdown phase.',
				'Elapsed:',
				countdownElapsed,
				'Duration:',
				countdownDuration,
				'Triggered:',
				countdownTriggeredRef.current,
				'ServerTime:',
				serverTime,
				'StartTime:',
				countdownStartTime
			);

			if (
				countdownElapsed >= countdownDuration &&
				!countdownTriggeredRef.current
			) {
				console.log('[Controller] Countdown complete - starting next round');
				// Auto-start next round
				countdownTriggeredRef.current = true;
				setupGameActions
					.startRound()
					.then(() => {
						console.log('[Controller] Next round started successfully');
					})
					.catch((err) => {
						console.error('[Controller] Error starting next round:', err);
						// Reset trigger on error to allow retry
						countdownTriggeredRef.current = false;
					});
			}
		}

		// Reset the ref when phase changes away from countdown
		if (gamePhase === 'playing') {
			countdownTriggeredRef.current = false;
		}
	}, [isGlobalController, serverTime]);

	return isGlobalController;
}
