import { config } from '@/config';
import { useServerTimer } from '@/hooks/useServerTime';
import { kmClient } from '@/services/km-client';
import { bubbleGameActions } from '@/state/actions/bubble-game-actions';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { KmTimeCountdown, useKmConfettiContext } from '@kokimoki/shared';
import Matter from 'matter-js';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { useSnapshot } from 'valtio';

export const BubbleGameView: React.FC = () => {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const engineRef = React.useRef<Matter.Engine | null>(null);
	const runnerRef = React.useRef<Matter.Runner | null>(null);
	const renderRef = React.useRef<Matter.Render | null>(null);
	
	// Refs for syncing DOM with Physics
	const bubblesRef = React.useRef<Map<string, Matter.Body>>(new Map());
	const bubbleElementsRef = React.useRef<Map<string, HTMLDivElement>>(new Map());
	const targetBubbleRef = React.useRef<HTMLDivElement>(null);

	const [containerSize, setContainerSize] = React.useState({
		width: 800,
		height: 600
	});

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

	// Initialize Physics Engine
	React.useEffect(() => {
		if (!containerRef.current) return;

		// Create engine
		const engine = Matter.Engine.create({
			gravity: { x: 0, y: 0 }, // No gravity, floating bubbles
			enableSleeping: false,
			constraintIterations: 2,
			positionIterations: 6,
			velocityIterations: 4
		});
		engineRef.current = engine;

		// Create runner
		const runner = Matter.Runner.create();
		runnerRef.current = runner;

		// Create mouse interaction
		const mouse = Matter.Mouse.create(containerRef.current);
		const mouseConstraint = Matter.MouseConstraint.create(engine, {
			mouse: mouse,
			constraint: {
				stiffness: 0.2,
				render: { visible: false }
			}
		});
		
		// Add mouse constraint to world
		Matter.Composite.add(engine.world, mouseConstraint);

		// Start runner
		Matter.Runner.run(runner, engine);

		// Render loop for syncing DOM positions
		const updateLoop = () => {
			// Update bubble positions
			bubblesRef.current.forEach((body, id) => {
				// Apply gentle floating force (Brownian motion)
				if (Math.random() < 0.05) { // Only apply occasionally
					Matter.Body.applyForce(body, body.position, {
						x: (Math.random() - 0.5) * 0.0005,
						y: (Math.random() - 0.5) * 0.0005
					});
				}

				const element = bubbleElementsRef.current.get(id);
				if (element) {
					const x = body.position.x - config.bubbleRadius;
					const y = body.position.y - config.bubbleRadius;
					const angle = body.angle;
					element.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
				}
			});

			// Update target bubble pulsing if needed (handled by CSS/React state usually, but collision feedback here)
			
			requestAnimationFrame(updateLoop);
		};
		const animationId = requestAnimationFrame(updateLoop);

		// Collision Handling
		Matter.Events.on(engine, 'collisionStart', (event) => {
			const pairs = event.pairs;
			
			pairs.forEach((pair) => {
				const bodyA = pair.bodyA;
				const bodyB = pair.bodyB;

				// Check if one body is the target (we'll label it 'target')
				const targetBody = bodyA.label === 'target' ? bodyA : bodyB.label === 'target' ? bodyB : null;
				const otherBody = targetBody === bodyA ? bodyB : bodyA;

				if (targetBody && otherBody && otherBody.label.startsWith('bubble-')) {
					const bubbleId = otherBody.label.replace('bubble-', '');
					handleCollision(bubbleId, otherBody);
				}
			});
		});

		return () => {
			cancelAnimationFrame(animationId);
			Matter.Runner.stop(runner);
			Matter.Engine.clear(engine);
			engineRef.current = null;
			runnerRef.current = null;
		};
	}, []);

	// Handle Collision Logic
	const handleCollision = async (bubbleId: string, body: Matter.Body) => {
		// Find bubble data
		const bubble = bubbles.find(b => b.id === bubbleId);
		if (!bubble) return;

		// Check if already absorbed (to prevent double triggering)
		// We can check if the body is still in the world or use a ref set
		if (!bubblesRef.current.has(bubbleId)) return;

		if (bubble.isCorrect) {
			// Correct!
			if ('vibrate' in navigator) navigator.vibrate(100);
			
			// Remove from physics world immediately
			if (engineRef.current) {
				Matter.Composite.remove(engineRef.current.world, body);
				bubblesRef.current.delete(bubbleId);
			}

			// Trigger action
			await bubbleGameActions.absorbBubble(bubbleId);
			
			// Check win condition
			const currentAbsorbed = (playerProgress[kmClient.id]?.absorbedCount || 0) + 1;
			if (currentAbsorbed >= roundConfig.correctCount) {
				triggerConfetti({ preset: 'massive' });
				if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
			}
		} else {
			// Incorrect!
			if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
			
			// Apply a repulsion force away from center
			const dx = body.position.x - containerSize.width / 2;
			const dy = body.position.y - containerSize.height / 2;
			const angle = Math.atan2(dy, dx);
			
			const forceMagnitude = 0.05 * body.mass;
			Matter.Body.applyForce(body, body.position, {
				x: Math.cos(angle) * forceMagnitude,
				y: Math.sin(angle) * forceMagnitude
			});

			await bubbleGameActions.recordIncorrectAttempt();
		}
	};

	// Update World Boundaries and Bodies on Resize/Config Change
	React.useEffect(() => {
		if (!engineRef.current || !containerRef.current) return;

		const width = containerRef.current.clientWidth;
		const height = containerRef.current.clientHeight;
		setContainerSize({ width, height });

		const world = engineRef.current.world;

		// Clear existing walls
		const existingBodies = Matter.Composite.allBodies(world);
		const walls = existingBodies.filter(b => b.label === 'wall');
		Matter.Composite.remove(world, walls);

		// Create Walls
		const wallThickness = 60;
		const wallOptions = { 
			isStatic: true, 
			label: 'wall',
			restitution: 0.6, // Bouncy walls
			render: { visible: false }
		};

		Matter.Composite.add(world, [
			Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, wallOptions), // Top
			Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, wallOptions), // Bottom
			Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, wallOptions), // Right
			Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, wallOptions) // Left
		]);

		// Update Target Bubble Body
		const targetBody = existingBodies.find(b => b.label === 'target');
		if (targetBody) Matter.Composite.remove(world, targetBody);

		const targetRadius = config.targetBubbleRadius;
		const newTargetBody = Matter.Bodies.circle(width / 2, height / 2, targetRadius, {
			isStatic: true,
			label: 'target',
			isSensor: true // Allow overlap for detection before bounce? No, we want collision.
			// Actually, if we want them to "absorb", we might want isSensor for the target 
			// so they pass through slightly before disappearing?
			// Spec says "Check if small bubble touches target bubble".
			// Standard collision is fine.
		});
		Matter.Composite.add(world, newTargetBody);

	}, [containerSize.width, containerSize.height]);

	// Sync Bubbles with Physics World
	React.useEffect(() => {
		if (!engineRef.current) return;
		const world = engineRef.current.world;

		// Remove bodies that are no longer in the bubbles list or have been absorbed
		const activeBubbleIds = new Set(bubbles.map(b => b.id));
		// Also filter out bubbles that are already absorbed locally (handled in collision)
		// But we need to sync with server state (bubbles list might change)
		
		// Actually, bubbles list from store contains ALL bubbles.
		// We need to check playerProgress to see which are absorbed?
		// No, absorbed bubbles are removed from the view usually?
		// In the previous implementation, we had `absorbedBubbles` state.
		// Here, we should rely on `playerProgress` or local state.
		// Let's use a local set of absorbed IDs to avoid re-adding them.
		
		// Wait, `bubbles` from globalStore are the DEFINITION of bubbles.
		// Whether they are absorbed is per-player state.
		// We should check `myProgress.absorbedCount`? No, that's a count.
		// We don't track WHICH bubbles are absorbed in global store per player?
		// The previous implementation used `absorbedBubbles` local state.
		// We should do the same.
		
		// Re-initialize bodies if round changes
		// We can detect round change by checking if bubbles list changed significantly or currentRound changed
	}, [bubbles, currentRound]);

	// Initialize Bubbles (Separate effect to handle round changes cleanly)
	React.useEffect(() => {
		if (!engineRef.current) return;
		const world = engineRef.current.world;

		// Initialize player progress
		bubbleGameActions.initializeProgress();

		// Clear existing bubbles
		bubblesRef.current.forEach(body => Matter.Composite.remove(world, body));
		bubblesRef.current.clear();

		// Create new bodies
		bubbles.forEach((bubble, i) => {
			// Check if already absorbed (if we persist this state)
			// For now, assume reset on round start
			
			// Scatter bubbles around the center
			const minRadius = config.targetBubbleRadius + config.bubbleRadius + 40;
			const maxRadius = Math.min(containerSize.width, containerSize.height) / 2 - config.bubbleRadius - 20;
			
			// Ensure we have space
			const effectiveMaxRadius = Math.max(maxRadius, minRadius + 20);
			
			// Random angle and radius
			const angle = (i / bubbles.length) * Math.PI * 2 + (Math.random() - 0.5);
			const radius = minRadius + Math.random() * (effectiveMaxRadius - minRadius);
			
			const x = containerSize.width / 2 + Math.cos(angle) * radius;
			const y = containerSize.height / 2 + Math.sin(angle) * radius;

			const body = Matter.Bodies.circle(x, y, config.bubbleRadius, {
				label: `bubble-${bubble.id}`,
				restitution: 0.9, // Bouncier
				friction: 0.01, // Less friction
				density: 0.001,
				frictionAir: 0.02 // Higher air resistance to stop them from flying too fast forever, but allow floating
			});

			// Add small random initial velocity for floating effect
			Matter.Body.setVelocity(body, {
				x: (Math.random() - 0.5) * 2,
				y: (Math.random() - 0.5) * 2
			});

			Matter.Composite.add(world, body);
			bubblesRef.current.set(bubble.id, body);
		});

	}, [bubbles, currentRound, containerSize.width, containerSize.height]);

	// Measure container
	React.useEffect(() => {
		if (!containerRef.current) return;
		const observer = new ResizeObserver(() => {
			if (containerRef.current) {
				setContainerSize({
					width: containerRef.current.clientWidth,
					height: containerRef.current.clientHeight
				});
			}
		});
		observer.observe(containerRef.current);
		return () => observer.disconnect();
	}, []);

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
				className="relative h-full min-h-0 w-full flex-1 overflow-hidden rounded-lg border-2 border-primary-200 bg-surface shadow-inner"
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
						<div className="px-4 text-lg font-bold text-white">{targetBubble.label}</div>
						{(myProgress?.absorbedCount || 0) > 0 && (
							<div className="mt-1 text-sm text-white/80">{myProgress?.absorbedCount}</div>
						)}
					</div>
				</div>

				{/* Bubbles */}
				{bubbles.map((bubble) => {
					// Only render if physics body exists (it should)
					// We use a callback ref or just map by ID
					return (
						<div
							key={bubble.id}
							ref={(el) => {
								if (el) bubbleElementsRef.current.set(bubble.id, el);
								else bubbleElementsRef.current.delete(bubble.id);
							}}
							className={cn(
								'absolute flex items-center justify-center rounded-full border-2 border-white shadow-lg',
								'touch-none select-none',
								isDraggingAllowed
									? 'cursor-grab active:cursor-grabbing'
									: 'cursor-not-allowed opacity-60',
								'from-primary-500 to-primary-600 bg-gradient-to-br text-white'
							)}
							style={{
								width: config.bubbleRadius * 2,
								height: config.bubbleRadius * 2,
								// Initial position off-screen or handled by physics update
								left: 0,
								top: 0,
								transform: 'translate(-1000px, -1000px)' // Hide until physics update
							}}
						>
							<span className="px-2 text-center text-xs font-bold text-white">
								{bubble.label}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};
