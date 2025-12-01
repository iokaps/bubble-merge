import { BubbleItem } from '@/components/bubble/bubble-item.tsx';
import { GameContainer } from '@/components/bubble/game-container';
import { TargetBubble } from '@/components/bubble/target-bubble';
import { config } from '@/config';
import { useServerTimer } from '@/hooks/useServerTime';
import { kmClient } from '@/services/km-client';
import { bubbleGameActions } from '@/state/actions/bubble-game-actions';
import { globalStore } from '@/state/stores/global-store';
import {
	playBounceSound,
	playPopSound,
	playVictorySound
} from '@/utils/synth-audio';
import { KmTimeCountdown, useKmConfettiContext } from '@kokimoki/shared';
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
	const [shakingBubbles, setShakingBubbles] = React.useState<Set<string>>(
		new Set()
	);

	const {
		targetBubble,
		bubbles,
		roundConfig,
		playerProgress,
		currentRound,
		roundStartTime
	} = useSnapshot(globalStore.proxy);
	const myProgress = playerProgress[kmClient.id];
	const serverTime = useServerTimer(100); // Update every 100ms for smooth timer

	const { triggerConfetti } = useKmConfettiContext();

	// Reset when round changes
	const initializedRef = React.useRef(false);

	React.useEffect(() => {
		initializedRef.current = false;
		setAbsorbedBubbles(new Set());
		setShakingBubbles(new Set());
		setBubblePositions({});
	}, [currentRound]);

	// Calculate time remaining
	const timeRemaining = Math.max(
		0,
		config.timePerRoundSeconds * 1000 - (serverTime - roundStartTime)
	);
	const timeRemainingSeconds = Math.ceil(timeRemaining / 1000);

	// Check if dragging is allowed
	const isDraggingAllowed = timeRemaining > 0;

	// Handle bubble drop
	const handleDrop = async (
		bubbleId: string,
		isCorrect: boolean,
		dropX: number,
		dropY: number
	) => {
		if (absorbedBubbles.has(bubbleId)) return;
		// Don't allow dropping if time is up
		if (!isDraggingAllowed) return;

		// Calculate distance from center
		const centerX = containerSize.width / 2;
		const centerY = containerSize.height / 2;
		const distance = Math.sqrt((dropX - centerX) ** 2 + (dropY - centerY) ** 2);

		// Check if dropped on target
		const isOnTarget = distance < config.targetBubbleRadius;

		if (isOnTarget && isCorrect) {
			// Correct bubble on target - absorb it!
			setAbsorbedBubbles((prev) => new Set(prev).add(bubbleId));

			playPopSound(config.correctPopVolume);

			if ('vibrate' in navigator) {
				navigator.vibrate(100);
			}

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
		} else if (isOnTarget && !isCorrect) {
			// Incorrect bubble on target - shake and remove
			setShakingBubbles((prev) => new Set(prev).add(bubbleId));

			playBounceSound(config.incorrectBounceVolume);

			if ('vibrate' in navigator) {
				navigator.vibrate([50, 30, 50]);
			}

			await bubbleGameActions.recordIncorrectAttempt();

			// Remove bubble after shake animation completes
			setTimeout(() => {
				setAbsorbedBubbles((prev) => new Set(prev).add(bubbleId));
				setShakingBubbles((prev) => {
					const next = new Set(prev);
					next.delete(bubbleId);
					return next;
				});
			}, 500);
		}
		// If not on target, bubble just returns to original position (handled by Motion)
	};

	// Initialize bubble positions scattered around center
	React.useEffect(() => {
		if (bubbles.length === 0) return;

		const positions: Record<string, { x: number; y: number }> = {};
		const centerX = containerSize.width / 2;
		const centerY = containerSize.height / 2;

		// Calculate minimum distance from center (target radius + bubble radius + spacing)
		const minRadius = config.targetBubbleRadius + config.bubbleRadius + 20;

		// Calculate maximum radius based on container size (leave margin from edges)
		const maxRadius = Math.min(
			containerSize.width / 2 - config.bubbleRadius - 30,
			containerSize.height / 2 - config.bubbleRadius - 30
		);

		// Ensure maxRadius is valid
		const effectiveMaxRadius = Math.max(maxRadius, minRadius + 10);

		// Scatter bubbles around the center with randomized positions
		bubbles.forEach((bubble, index) => {
			// Base angle for even distribution
			const baseAngle = (index / bubbles.length) * Math.PI * 2;

			// Add random offset to angle for scatter effect (-20 to +20 degrees)
			const angleOffset = (Math.random() - 0.5) * (Math.PI / 4.5);
			const angle = baseAngle + angleOffset;

			// Random radius between min and max for scatter effect
			const radiusRange = effectiveMaxRadius - minRadius;
			const radius = minRadius + Math.random() * radiusRange * 0.5; // Use 50% of available range

			// Calculate position and clamp within safe bounds
			let x = centerX + Math.cos(angle) * radius;
			let y = centerY + Math.sin(angle) * radius;

			// Clamp to ensure bubble stays within container
			x = Math.max(
				config.bubbleRadius + 10,
				Math.min(containerSize.width - config.bubbleRadius - 10, x)
			);
			y = Math.max(
				config.bubbleRadius + 10,
				Math.min(containerSize.height - config.bubbleRadius - 10, y)
			);

			positions[bubble.id] = { x, y };
		});

		setBubblePositions(positions);

		// Initialize player progress on first bubble load
		if (!initializedRef.current) {
			bubbleGameActions.initializeProgress();
			initializedRef.current = true;
		}
	}, [bubbles, containerSize, currentRound]);

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

	return (
		<div className="flex w-full max-w-4xl flex-col space-y-3 sm:space-y-4">
			{/* Instructions */}
			<div className="prose prose-sm border-primary-200 bg-surface max-w-none rounded-lg border p-3 shadow-md sm:p-4">
				<ReactMarkdown>{config.bubbleGameInstructionsMd}</ReactMarkdown>
			</div>

			{/* Progress and Timer */}
			<div className="border-primary-200 bg-surface flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 shadow-md sm:flex-nowrap sm:p-4">
				<div className="flex-1 text-center">
					<span className="text-text-secondary block text-xs font-medium sm:text-sm">
						{config.progressLabel}
					</span>
					<div className="text-text-primary text-xl font-bold sm:text-2xl">
						{myProgress?.absorbedCount || 0} / {roundConfig.correctCount}
					</div>
				</div>
				<div className="flex-1 text-center">
					<span className="text-text-secondary block text-xs font-medium sm:text-sm">
						{config.scoreLabel}
					</span>
					<div className="text-text-primary text-xl font-bold sm:text-2xl">
						{myProgress?.score || 0}
					</div>
				</div>
				<div className="flex-1 text-center">
					<span className="text-text-secondary block text-xs font-medium sm:text-sm">
						{config.timeRemainingLabel}
					</span>
					<div
						className={`text-xl font-bold sm:text-2xl ${timeRemainingSeconds <= 5 ? 'text-danger-500' : 'text-text-primary'}`}
					>
						<KmTimeCountdown ms={timeRemaining} format="seconds" />
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
						scale={1}
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
								position={position}
								onDrop={handleDrop}
								isAbsorbed={absorbedBubbles.has(bubble.id)}
								shouldShake={shakingBubbles.has(bubble.id)}
								isDraggingAllowed={isDraggingAllowed}
							/>
						);
					})}
				</GameContainer>
			</div>
		</div>
	);
};
