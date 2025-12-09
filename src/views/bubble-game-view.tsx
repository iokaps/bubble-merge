import { config } from '@/config';
import { useServerTimer } from '@/hooks/useServerTime';
import { kmClient } from '@/services/km-client';
import { bubbleGameActions } from '@/state/actions/bubble-game-actions';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { KmTimeCountdown, useKmConfettiContext } from '@kokimoki/shared';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { useSnapshot } from 'valtio';

interface BubblePosition {
	x: number;
	y: number;
}

export const BubbleGameView: React.FC = () => {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const targetBubbleRef = React.useRef<HTMLDivElement>(null);
	const initializedRoundRef = React.useRef<number>(-1);
	const consumedBubblesRef = React.useRef<Set<string>>(new Set());
	const [draggedBubbleId, setDraggedBubbleId] = React.useState<string | null>(
		null
	);
	const [bubblePositions, setBubblePositions] = React.useState<
		Record<string, BubblePosition>
	>({});

	const {
		targetBubble,
		bubbles,
		roundConfig,
		playerProgress,
		currentRound,
		roundStartTime
	} = useSnapshot(globalStore.proxy);

	const myProgress = playerProgress[kmClient.id];
	const serverTime = useServerTimer(100);
	const { triggerConfetti } = useKmConfettiContext();

	// Calculate time remaining
	const timeRemaining = Math.max(
		0,
		config.timePerRoundSeconds * 1000 - (serverTime - roundStartTime)
	);
	const timeRemainingSeconds = Math.ceil(timeRemaining / 1000);
	const isDraggingAllowed = timeRemaining > 0;

	// Initialize bubble positions when round changes
	React.useEffect(() => {
		if (!containerRef.current || bubbles.length === 0) return;

		// Only initialize once per round
		if (initializedRoundRef.current === currentRound) {
			// console.log('[BubbleGame] Already initialized round', currentRound);
			return;
		}
		// console.log('[BubbleGame] Initializing round', currentRound);
		initializedRoundRef.current = currentRound;
		consumedBubblesRef.current.clear(); // Reset consumed bubbles for new round

		const container = containerRef.current;
		const width = container.clientWidth;
		const height = container.clientHeight;

		// Reset all positions on round change - don't keep previous positions
		const newPositions: Record<string, BubblePosition> = {};

		bubbles.forEach((bubble, i) => {
			// Spread bubbles across the container using a grid pattern with randomization
			const padding = config.bubbleRadius + 20;
			const availableWidth = width - padding * 2;
			const availableHeight = height - padding * 2;

			// Create grid positions
			const cols = Math.ceil(Math.sqrt(bubbles.length * (width / height)));
			const rows = Math.ceil(bubbles.length / cols);

			const col = i % cols;
			const row = Math.floor(i / cols);

			// Calculate position with randomization
			const cellWidth = availableWidth / cols;
			const cellHeight = availableHeight / rows;

			const baseX = padding + col * cellWidth + cellWidth / 2;
			const baseY = padding + row * cellHeight + cellHeight / 2;

			// Add randomization within cell (30% of cell size)
			const randomX = (Math.random() - 0.5) * cellWidth * 0.3;
			const randomY = (Math.random() - 0.5) * cellHeight * 0.3;

			let x = Math.max(padding, Math.min(width - padding, baseX + randomX));
			let y = Math.max(padding, Math.min(height - padding, baseY + randomY));

			// Check if position overlaps with central bubble and push it away
			const centerX = width / 2;
			const centerY = height / 2;
			const dx = x - centerX;
			const dy = y - centerY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const minDistance = config.targetBubbleRadius + config.bubbleRadius + 10;

			if (distance < minDistance) {
				// Push bubble away from center
				const angle = Math.atan2(dy, dx);
				x = centerX + Math.cos(angle) * minDistance;
				y = centerY + Math.sin(angle) * minDistance;

				// Ensure it's still within bounds
				x = Math.max(padding, Math.min(width - padding, x));
				y = Math.max(padding, Math.min(height - padding, y));
			}

			newPositions[bubble.id] = { x, y };
		});

		setBubblePositions(newPositions);
	}, [currentRound, bubbles.length]); // Check when round or bubbles change, but ref prevents re-initialization

	// Initialize player progress
	React.useEffect(() => {
		bubbleGameActions.initializeProgress();
	}, []);

	// Check collision with target bubble
	const checkCollision = React.useCallback(
		(bubbleId: string, x: number, y: number) => {
			if (!targetBubbleRef.current || !containerRef.current) return false;

			const targetRect = targetBubbleRef.current.getBoundingClientRect();
			const containerRect = containerRef.current.getBoundingClientRect();

			const targetCenterX =
				targetRect.left - containerRect.left + targetRect.width / 2;
			const targetCenterY =
				targetRect.top - containerRect.top + targetRect.height / 2;

			const distance = Math.sqrt(
				Math.pow(x - targetCenterX, 2) + Math.pow(y - targetCenterY, 2)
			);

			const collisionDistance = config.targetBubbleRadius + config.bubbleRadius;

			return distance < collisionDistance;
		},
		[]
	);

	// Handle drag start
	const handleDragStart = React.useCallback(
		(e: React.MouseEvent | React.TouchEvent, bubbleId: string) => {
			if (!isDraggingAllowed) return;
			e.preventDefault();
			setDraggedBubbleId(bubbleId);
		},
		[isDraggingAllowed]
	);

	// Handle drag move
	const handleDragMove = React.useCallback(
		(e: MouseEvent | TouchEvent) => {
			if (!draggedBubbleId || !containerRef.current) return;

			const container = containerRef.current;
			const rect = container.getBoundingClientRect();

			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
			const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

			const x = clientX - rect.left;
			const y = clientY - rect.top;

			setBubblePositions((prev) => ({
				...prev,
				[draggedBubbleId]: { x, y }
			}));
		},
		[draggedBubbleId]
	);

	// Handle drag end
	const handleDragEnd = React.useCallback(async () => {
		if (!draggedBubbleId) return;

		const bubble = bubbles.find((b) => b.id === draggedBubbleId);
		if (!bubble) {
			setDraggedBubbleId(null);
			return;
		}

		const position = bubblePositions[draggedBubbleId];
		if (!position) {
			setDraggedBubbleId(null);
			return;
		}
		// Check if dropped on target
		if (checkCollision(draggedBubbleId, position.x, position.y)) {
			// Mark bubble as consumed immediately
			// console.log(
			// 	'[BubbleGame] COLLISION! Marking bubble as consumed:',
			// 	draggedBubbleId
			// );
			consumedBubblesRef.current.add(draggedBubbleId);

			// Also remove from positions
			setBubblePositions((prev) => {
				const newPos = { ...prev };
				delete newPos[draggedBubbleId];
				// console.log('[BubbleGame] New positions keys:', Object.keys(newPos));
				return newPos;
			});

			if (bubble.isCorrect) {
				// Correct bubble!
				if ('vibrate' in navigator) navigator.vibrate(100);

				await bubbleGameActions.absorbBubble(draggedBubbleId);

				// Check win condition
				const currentAbsorbed =
					(playerProgress[kmClient.id]?.absorbedCount || 0) + 1;
				if (currentAbsorbed >= roundConfig.correctCount) {
					triggerConfetti({ preset: 'massive' });
					if ('vibrate' in navigator)
						navigator.vibrate([100, 50, 100, 50, 200]);
				}
			} else {
				// Incorrect bubble!
				if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);

				await bubbleGameActions.recordIncorrectAttempt();
			}
		}
		// If not dropped on target, bubble stays at new position (already updated by handleDragMove)

		setDraggedBubbleId(null);
	}, [
		draggedBubbleId,
		bubbles,
		bubblePositions,
		checkCollision,
		playerProgress,
		roundConfig.correctCount,
		triggerConfetti
	]);

	// Add global event listeners for drag
	React.useEffect(() => {
		const onMove = (e: MouseEvent | TouchEvent) => {
			if (draggedBubbleId) {
				e.preventDefault();
				handleDragMove(e);
			}
		};

		const onEnd = () => {
			if (draggedBubbleId) {
				handleDragEnd();
			}
		};

		if (draggedBubbleId) {
			document.addEventListener('mousemove', onMove);
			document.addEventListener('mouseup', onEnd);
			document.addEventListener('touchmove', onMove, { passive: false });
			document.addEventListener('touchend', onEnd);
		}

		return () => {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onEnd);
			document.removeEventListener('touchmove', onMove);
			document.removeEventListener('touchend', onEnd);
		};
	}, [draggedBubbleId, handleDragMove, handleDragEnd]);

	return (
		<div className="flex h-full w-full max-w-4xl flex-col space-y-1">
			{/* Instructions */}
			<div className="prose prose-sm border-primary-200 bg-surface max-w-none flex-shrink-0 rounded border p-1.5 text-xs shadow-sm">
				<ReactMarkdown>{config.bubbleGameInstructionsMd}</ReactMarkdown>
			</div>

			{/* Progress and Timer */}
			<div className="border-primary-200 bg-surface flex flex-shrink-0 flex-wrap items-center justify-between gap-1 rounded border p-1.5 shadow-sm sm:flex-nowrap">
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
						<KmTimeCountdown ms={timeRemaining} display="s" />
					</div>
				</div>
			</div>

			{/* Game Container */}
			<div
				ref={containerRef}
				className="border-primary-200 bg-surface relative h-full min-h-0 w-full flex-1 overflow-hidden rounded-lg border-2 shadow-inner"
			>
				{/* Target Bubble */}
				<div
					ref={targetBubbleRef}
					className={cn(
						'absolute flex items-center justify-center rounded-full border-4 border-white',
						'from-secondary-500 to-primary-500 bg-gradient-to-br',
						'shadow-primary-500/30 pointer-events-none shadow-2xl',
						'transition-transform duration-300 ease-in-out'
					)}
					style={{
						width: config.targetBubbleRadius * 2,
						height: config.targetBubbleRadius * 2,
						left: '50%',
						top: '50%',
						transform: `translate(-50%, -50%) scale(${1 + (myProgress?.absorbedCount || 0) * 0.05})`
					}}
				>
					<div className="text-center">
						<div className="px-4 text-lg font-bold text-white">
							{targetBubble.label}
						</div>
						{(myProgress?.absorbedCount || 0) > 0 && (
							<div className="mt-1 text-sm text-white/80">
								{myProgress?.absorbedCount}
							</div>
						)}
					</div>
				</div>

				{/* Bubbles */}
				{bubbles
					.filter((bubble) => {
						// Filter out consumed bubbles
						if (consumedBubblesRef.current.has(bubble.id)) {
							// console.log('[BubbleGame] Filtering out consumed:', bubble.id);
							return false;
						}
						const has = !!bubblePositions[bubble.id];
						// if (!has)
						// 	console.log(
						// 		'[BubbleGame] Filtering out (no position):',
						// 		bubble.id
						// 	);
						return has;
					})
					.map((bubble) => {
						const position = bubblePositions[bubble.id];

						return (
							<div
								key={bubble.id}
								className={cn(
									'absolute flex items-center justify-center rounded-full border-2 border-white shadow-lg',
									'transition-transform select-none',
									isDraggingAllowed
										? 'cursor-grab active:cursor-grabbing'
										: 'cursor-not-allowed opacity-60',
									'from-primary-500 to-primary-600 bg-gradient-to-br text-white',
									draggedBubbleId === bubble.id && 'z-50 scale-110 shadow-2xl'
								)}
								style={{
									width: config.bubbleRadius * 2,
									height: config.bubbleRadius * 2,
									left: position.x,
									top: position.y,
									transform: `translate(-50%, -50%)`,
									touchAction: 'none'
								}}
								onMouseDown={(e) => handleDragStart(e, bubble.id)}
								onTouchStart={(e) => handleDragStart(e, bubble.id)}
							>
								<span className="pointer-events-none px-2 text-center text-xs font-bold text-white">
									{bubble.label}
								</span>
							</div>
						);
					})}
			</div>
		</div>
	);
};
