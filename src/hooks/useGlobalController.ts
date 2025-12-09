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

	console.log('[Controller] Status check:', {
		myConnectionId: kmClient.connectionId,
		controllerConnectionId,
		isGlobalController,
		activeConnections: Array.from(connectionIds)
	});

	// Get reactive state values
	const {
		gamePhase,
		roundStartTime,
		roundTimeRemaining,
		currentRound,
		totalRounds,
		countdownStartTime
	} = useSnapshot(globalStore.proxy);

	// Maintain connection that is assigned to be the global controller (host only)
	useEffect(() => {
		// Only host mode can be the global controller
		const isHostMode = kmClient.clientContext.mode === 'host';

		console.log('[Controller] Assignment check:', {
			mode: kmClient.clientContext.mode,
			isHostMode,
			controllerConnectionId,
			myConnectionId: kmClient.connectionId,
			activeConnections: Array.from(connectionIds),
			controllerIsActive: connectionIds.has(controllerConnectionId),
			shouldBeController:
				isHostMode && controllerConnectionId !== kmClient.connectionId
		});

		// Only host should assign itself as controller
		if (!isHostMode) {
			return;
		}

		// Check if host is already the controller
		if (controllerConnectionId === kmClient.connectionId) {
			console.log('[Controller] ✅ Host is already the controller');
			return;
		}

		// Check if stored controller ID is still active
		if (controllerConnectionId && connectionIds.has(controllerConnectionId)) {
			console.log(
				'[Controller] ⚠️ Another active connection is controller:',
				controllerConnectionId
			);
			return;
		}

		console.log('[Controller] 🔄 Host assigning itself as controller...');
		// Assign host as the global controller
		kmClient
			.transact([globalStore], ([globalState]) => {
				console.log(
					'[Controller] Setting controller to host:',
					kmClient.connectionId
				);
				globalState.controllerConnectionId = kmClient.connectionId;
			})
			.then(() => {
				console.log('[Controller] ✅ Host controller assignment complete');
			})
			.catch((err) => {
				console.error(
					'[Controller] ❌ Error assigning host as controller:',
					err
				);
			});
	}, [connectionIds, controllerConnectionId]);

	// Reset countdown trigger when game phase changes
	useEffect(() => {
		console.log('[Controller] Phase change effect triggered', {
			isGlobalController,
			gamePhase,
			countdownStartTime,
			currentTriggerValue: countdownTriggeredRef.current
		});

		if (!isGlobalController) {
			console.log('[Controller] Not controller, skipping phase change logic');
			return;
		}

		// Reset trigger when entering countdown phase
		if (gamePhase === 'countdown' && countdownStartTime > 0) {
			console.log(
				`[Controller] ✅ Countdown phase detected - resetting trigger. CountdownStart: ${countdownStartTime}`
			);
			countdownTriggeredRef.current = false;
		}

		// Always reset when entering playing phase (new round started)
		if (gamePhase === 'playing') {
			console.log(
				`[Controller] ✅ Playing phase - resetting countdown trigger`
			);
			countdownTriggeredRef.current = false;
		}
	}, [isGlobalController, gamePhase, countdownStartTime]);

	// Run global controller-specific logic
	useEffect(() => {
		if (!isGlobalController) {
			return;
		}

		console.log('[Controller] Main logic tick', {
			gamePhase,
			currentRound,
			totalRounds,
			serverTime,
			roundStartTime,
			countdownStartTime,
			roundEndTriggered: roundEndTriggeredRef.current,
			countdownTriggered: countdownTriggeredRef.current
		});

		// Handle round timer countdown
		if (gamePhase === 'playing') {
			const elapsed = serverTime - roundStartTime;
			const remaining = Math.max(0, roundTimeRemaining - elapsed);

			console.log('[Controller] Playing phase tick', {
				elapsed,
				remaining,
				roundEndTriggered: roundEndTriggeredRef.current,
				willTrigger:
					remaining <= 0 && roundEndTriggeredRef.current !== currentRound
			});

			// Auto-end round when time runs out (only trigger once per round)
			if (remaining <= 0 && roundEndTriggeredRef.current !== currentRound) {
				roundEndTriggeredRef.current = currentRound;
				console.log(
					'[Controller] 🔴 ROUND ENDED',
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
							console.log('[Controller] ✅ Last round - showing results');
							// Show final results
							state.gamePhase = 'results';
						} else {
							const newCountdownTime = kmClient.serverTimestamp();
							console.log(
								'[Controller] ✅ Starting countdown to next round. New countdownStartTime:',
								newCountdownTime
							);
							// Start countdown to next round
							state.gamePhase = 'countdown';
							state.countdownStartTime = newCountdownTime;
						}
					})
					.then(() => {
						console.log(
							'[Controller] ✅ Round end transaction completed successfully'
						);
					})
					.catch((err) =>
						console.error('[Controller] ❌ Error ending round:', err)
					);
			}
		}

		// Handle countdown between rounds
		if (gamePhase === 'countdown' && countdownStartTime > 0) {
			const countdownElapsed = serverTime - countdownStartTime;
			const countdownDuration = 3000; // 3 seconds

			console.log('[Controller] 🟡 Countdown phase tick', {
				elapsed: countdownElapsed,
				duration: countdownDuration,
				triggered: countdownTriggeredRef.current,
				serverTime,
				startTime: countdownStartTime,
				shouldTrigger:
					countdownElapsed >= countdownDuration &&
					!countdownTriggeredRef.current
			});

			// Start next round if countdown has elapsed
			// Check both the ref AND if enough time has passed (handles tab switching)
			if (countdownElapsed >= countdownDuration) {
				// Only trigger if ref says we haven't triggered yet
				// This prevents double-triggering from same controller
				if (!countdownTriggeredRef.current) {
					console.log(
						'[Controller] 🟢 COUNTDOWN COMPLETE - starting next round'
					);
					countdownTriggeredRef.current = true;
					setupGameActions
						.startRound()
						.then(() => {
							console.log('[Controller] ✅ Next round started successfully');
						})
						.catch((err) => {
							console.error('[Controller] ❌ Error starting next round:', err);
							// Reset trigger on error to allow retry
							countdownTriggeredRef.current = false;
						});
				} else {
					console.log(
						'[Controller] ⚠️ Countdown elapsed but already triggered, skipping'
					);
				}
			} else {
				console.log(
					`[Controller] ⏳ Waiting... ${Math.ceil((countdownDuration - countdownElapsed) / 1000)}s remaining`
				);
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
