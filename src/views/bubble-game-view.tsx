import { BubbleItem } from '@/components/bubble/bubble-item.tsx';
import { GameContainer } from '@/components/bubble/game-container';
import { TargetBubble } from '@/components/bubble/target-bubble';
import { config } from '@/config';
import { useMatterPhysics } from '@/hooks/useMatterPhysics';
import { kmClient } from '@/services/km-client';
import { bubbleGameActions } from '@/state/actions/bubble-game-actions';
import { globalStore } from '@/state/stores/global-store';
import { getRandomPosition } from '@/utils/physics-helpers';
import {
	playBounceSound,
	playPopSound,
	playVictorySound
} from '@/utils/synth-audio';
import { useKmConfettiContext } from '@kokimoki/shared';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { useSnapshot } from 'valtio';

export const BubbleGameView: React.FC = () => {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const [containerSize, setContainerSize] = React.useState({
		width: 800,
		height: 600
	});
	const [bubblePositions, setBubblePositions] = React.useState<
		Record<string, { x: number; y: number }>
	>({});
	const [absorbedBubbles, setAbsorbedBubbles] = React.useState<Set<string>>(
		new Set()
	);

	const { targetBubble, bubbles, roundConfig, playerProgress, currentRound } =
		useSnapshot(globalStore.proxy);
	const myProgress = playerProgress[kmClient.id];

	const { triggerConfetti } = useKmConfettiContext();

	// Reset when round changes
	const initializedRef = React.useRef(false);
	const physicsRef = React.useRef<ReturnType<typeof useMatterPhysics> | null>(
		null
	);

	React.useEffect(() => {
		initializedRef.current = false;
		setAbsorbedBubbles(new Set());
		setBubblePositions({});
		physicsRef.current?.clearCollisions();
	}, [currentRound]);

	// Handle collision - using ref to avoid physics recreation
	const collisionHandlerRef = React.useRef<
		((bubbleId: string, isCorrect: boolean) => Promise<void>) | null
	>(null);

	collisionHandlerRef.current = async (
		bubbleId: string,
		isCorrect: boolean
	) => {
		if (absorbedBubbles.has(bubbleId)) return;

		if (isCorrect) {
			// Correct bubble absorbed
			setAbsorbedBubbles((prev) => new Set(prev).add(bubbleId));

			// Remove bubble from physics world so it doesn't collide anymore
			physics.removeBubble(bubbleId);

			// Play synthesized sound (more reliable than audio files)
			playPopSound(config.correctPopVolume);

			// Haptic feedback
			if ('vibrate' in navigator) {
				navigator.vibrate(100);
			}

			// Update progress
			await bubbleGameActions.absorbBubble(bubbleId);

			// Check if round complete
			if (
				myProgress &&
				myProgress.absorbedCount + 1 >= roundConfig.correctCount
			) {
				playVictorySound(config.levelCompleteVolume);
				triggerConfetti({ preset: 'massive' });

				if ('vibrate' in navigator) {
					navigator.vibrate([100, 50, 100, 50, 200]);
				}
			}
		} else {
			// Incorrect bubble bounced
			playBounceSound(config.incorrectBounceVolume);

			if ('vibrate' in navigator) {
				navigator.vibrate([50, 30, 50]);
			}

			await bubbleGameActions.recordIncorrectAttempt();
		}
	};

	const handleCollision = React.useCallback(
		(bubbleId: string, isCorrect: boolean) => {
			collisionHandlerRef.current?.(bubbleId, isCorrect);
		},
		[]
	);

	// Calculate target scale (used for rendering, not physics)
	const targetScale =
		roundConfig.targetScale +
		(myProgress?.absorbedCount || 0) * config.targetGrowthIncrement;

	// Memoize physics options to prevent recreation
	const physicsOptions = React.useMemo(
		() => ({
			width: containerSize.width,
			height: containerSize.height,
			gravityY: roundConfig.gravityY,
			targetScale: roundConfig.targetScale, // Use initial scale, not growing scale
			onCollision: handleCollision
		}),
		[
			containerSize.width,
			containerSize.height,
			roundConfig.gravityY,
			roundConfig.targetScale,
			handleCollision
		]
	);

	// Initialize physics
	const physics = useMatterPhysics(physicsOptions);

	// Store physics ref for cleanup
	React.useEffect(() => {
		physicsRef.current = physics;
	}, [physics]);

	// Initialize bubbles in physics engine (only once when game starts)
	React.useEffect(() => {
		if (!physics.engine || bubbles.length === 0 || initializedRef.current)
			return;

		const positions: Record<string, { x: number; y: number }> = {};
		const existingPositions: Array<{ x: number; y: number; radius: number }> =
			[];

		bubbles.forEach((bubble) => {
			const pos = getRandomPosition(
				containerSize.width,
				containerSize.height,
				config.bubbleRadius,
				existingPositions
			);

			positions[bubble.id] = pos;
			existingPositions.push({ ...pos, radius: config.bubbleRadius });

			physics.addBubble(bubble.id, pos.x, pos.y, bubble.isCorrect);
		});

		setBubblePositions(positions);
		initializedRef.current = true;

		// Initialize player progress
		bubbleGameActions.initializeProgress();
	}, [bubbles, physics.engine, containerSize]);

	// Update bubble positions from physics
	React.useEffect(() => {
		if (!physics.engine) return;

		const interval = setInterval(() => {
			setBubblePositions((prevPositions) => {
				const newPositions = { ...prevPositions };

				bubbles.forEach((bubble) => {
					// Always update positions from physics engine
					const pos = physics.getBubblePosition(bubble.id);
					if (pos) {
						newPositions[bubble.id] = pos;
					}
				});

				return newPositions;
			});
		}, 1000 / 30); // 30 FPS update

		return () => clearInterval(interval);
	}, [physics, bubbles]);

	// Measure container size
	React.useEffect(() => {
		if (!containerRef.current) return;

		const updateSize = () => {
			if (containerRef.current) {
				const { clientWidth, clientHeight } = containerRef.current;
				setContainerSize({ width: clientWidth, height: clientHeight });
			}
		};

		updateSize();
		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
	}, []);

	const handleDragEnd = (
		bubbleId: string,
		dragDeltaX: number,
		dragDeltaY: number
	) => {
		// Convert drag distance to force (slingshot mechanics)
		// The further you drag, the stronger the shot
		const forceFactor = 0.01; // Adjust this to tune shot strength
		const force = {
			x: dragDeltaX * forceFactor,
			y: dragDeltaY * forceFactor
		};
		physics.applyForce(bubbleId, force.x, force.y);
	};

	return (
		<div className="w-full max-w-4xl space-y-4">
			{/* Instructions */}
			<div className="prose prose-sm max-w-none rounded-lg border border-gray-200 bg-white p-4">
				<ReactMarkdown>{config.bubbleGameInstructionsMd}</ReactMarkdown>
			</div>

			{/* Progress */}
			<div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
				<div>
					<span className="text-sm font-medium text-gray-500">
						{config.progressLabel}
					</span>
					<div className="text-2xl font-bold">
						{myProgress?.absorbedCount || 0} / {roundConfig.correctCount}
					</div>
				</div>
				<div>
					<span className="text-sm font-medium text-gray-500">
						{config.accuracyLabel}
					</span>
					<div className="text-2xl font-bold">
						{myProgress
							? Math.round(
									(myProgress.absorbedCount /
										Math.max(
											1,
											myProgress.absorbedCount + myProgress.incorrectAttempts
										)) *
										100
								)
							: 100}
						%
					</div>
				</div>
			</div>

			{/* Game Container */}
			<div ref={containerRef}>
				<GameContainer
					width={containerSize.width}
					height={containerSize.height}
				>
					<TargetBubble
						label={targetBubble.label}
						scale={targetScale}
						absorbedCount={myProgress?.absorbedCount || 0}
					/>

					{bubbles.map((bubble) => {
						const position = bubblePositions[bubble.id];
						if (!position || absorbedBubbles.has(bubble.id)) return null;

						return (
							<BubbleItem
								key={bubble.id}
								id={bubble.id}
								label={bubble.label}
								isCorrect={bubble.isCorrect}
								initialX={position.x}
								initialY={position.y}
								position={position}
								onDragEnd={handleDragEnd}
								isAbsorbed={absorbedBubbles.has(bubble.id)}
							/>
						);
					})}
				</GameContainer>
			</div>
		</div>
	);
};
