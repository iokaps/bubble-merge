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

	// Get reactive state values
	const {
		gamePhase,
		roundStartTime,
		roundTimeRemaining,
		currentRound,
		totalRounds,
		countdownStartTime
	} = useSnapshot(globalStore.proxy);

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

	// Reset countdown trigger when game phase changes
	useEffect(() => {
		if (!isGlobalController) return;

		// Reset trigger ONLY when entering countdown phase with a new countdownStartTime
		// Don't reset when entering playing phase or when already in countdown
		if (gamePhase === 'countdown') {
			// Only reset if we have a fresh countdown (within last second)
			const timeSinceCountdownStart = serverTime - countdownStartTime;
			if (timeSinceCountdownStart < 1000) {
				console.log(`[Controller] Fresh countdown detected, resetting trigger`);
				countdownTriggeredRef.current = false;
			}
		}

		// Always reset when entering playing phase (new round started)
		if (gamePhase === 'playing') {
			console.log(`[Controller] Playing phase - resetting countdown trigger`);
			countdownTriggeredRef.current = false;
		}
	}, [isGlobalController, gamePhase, countdownStartTime, serverTime]);

	// Run global controller-specific logic
	useEffect(() => {
		if (!isGlobalController) {
			return;
		}

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

			// Start next round if countdown has elapsed
			// Check both the ref AND if enough time has passed (handles tab switching)
			if (countdownElapsed >= countdownDuration) {
				// Only trigger if ref says we haven't triggered yet
				// This prevents double-triggering from same controller
				if (!countdownTriggeredRef.current) {
					console.log('[Controller] Countdown complete - starting next round');
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
		}
	}, [
		isGlobalController,
		serverTime,
		gamePhase,
		roundStartTime,
		roundTimeRemaining,
		currentRound,
		totalRounds,
		countdownStartTime
	]);

	return isGlobalController;
}
