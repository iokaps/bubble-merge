import { config } from '@/config';
import Matter from 'matter-js';
import { useEffect, useRef, useState } from 'react';

export interface BubbleBody {
	body: Matter.Body;
	id: string;
	isCorrect: boolean;
}

export interface UseMatterPhysicsOptions {
	width: number;
	height: number;
	gravityY?: number;
	targetScale?: number;
	onCollision?: (bubbleId: string, isCorrect: boolean) => void;
}

export interface MatterPhysicsResult {
	engine: Matter.Engine | null;
	world: Matter.World | null;
	targetBody: Matter.Body | null;
	addBubble: (id: string, x: number, y: number, isCorrect: boolean) => void;
	removeBubble: (id: string) => void;
	applyForce: (id: string, forceX: number, forceY: number) => void;
	getBubblePosition: (id: string) => { x: number; y: number } | null;
	clearCollisions: () => void;
	bubbleBodies: Map<string, BubbleBody>;
}

export function useMatterPhysics(
	options: UseMatterPhysicsOptions
): MatterPhysicsResult {
	const {
		width,
		height,
		gravityY = config.physicsGravityY,
		targetScale = 1,
		onCollision
	} = options;

	const engineRef = useRef<Matter.Engine | null>(null);
	const worldRef = useRef<Matter.World | null>(null);
	const targetBodyRef = useRef<Matter.Body | null>(null);
	const bubbleBodiesRef = useRef<Map<string, BubbleBody>>(new Map());
	const collidedBubblesRef = useRef<Set<string>>(new Set());
	const [isInitialized, setIsInitialized] = useState(false);

	// Initialize Matter.js engine
	useEffect(() => {
		// Create engine with no gravity (bubbles will float)
		const engine = Matter.Engine.create({
			gravity: {
				x: 0,
				y: 0
			}
		});

		const world = engine.world;

		// Create walls
		const wallOptions = {
			isStatic: true,
			restitution: config.physicsWallRestitution,
			friction: 0
		};

		const wallThickness = 50;
		const walls = [
			// Top wall
			Matter.Bodies.rectangle(
				width / 2,
				-wallThickness / 2,
				width,
				wallThickness,
				wallOptions
			),
			// Bottom wall
			Matter.Bodies.rectangle(
				width / 2,
				height + wallThickness / 2,
				width,
				wallThickness,
				wallOptions
			),
			// Left wall
			Matter.Bodies.rectangle(
				-wallThickness / 2,
				height / 2,
				wallThickness,
				height,
				wallOptions
			),
			// Right wall
			Matter.Bodies.rectangle(
				width + wallThickness / 2,
				height / 2,
				wallThickness,
				height,
				wallOptions
			)
		];

		Matter.Composite.add(world, walls);

		// Create target bubble (center, static)
		const targetBody = Matter.Bodies.circle(
			width / 2,
			height / 2,
			config.targetBubbleRadius,
			{
				isStatic: true,
				isSensor: true, // Don't physically block bubbles
				label: 'target',
				render: {
					fillStyle: '#3b82f6'
				}
			}
		);

		Matter.Composite.add(world, targetBody);

		// Check for stopped bubbles inside target
		const checkAbsorption = () => {
			const centerX = width / 2;
			const centerY = height / 2;

			for (const [id, bubbleData] of bubbleBodiesRef.current.entries()) {
				const { body, isCorrect } = bubbleData;

				// Skip if already processed
				if (collidedBubblesRef.current.has(id)) {
					continue;
				}

				// Calculate distance from center
				const dx = body.position.x - centerX;
				const dy = body.position.y - centerY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				// Calculate speed
				const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);

				// Check if bubble is inside target and almost stopped
				const targetRadius = (config.targetBubbleRadius * targetScale) / 2;
				if (distance < targetRadius && speed < 0.3) {
					// Bubble is stopped inside target - absorb it!
					collidedBubblesRef.current.add(id);
					// Call collision handler asynchronously to not block physics
					setTimeout(() => onCollision?.(id, isCorrect), 0);
				}
			}
		};

		Matter.Events.on(engine, 'afterUpdate', checkAbsorption);

		// Start engine
		const runner = Matter.Runner.create();
		Matter.Runner.run(runner, engine);

		// Apply air resistance only (no floating forces)
		Matter.Events.on(engine, 'beforeUpdate', () => {
			bubbleBodiesRef.current.forEach((bubbleData) => {
				const { body } = bubbleData;

				// Add air resistance to slow down bubbles gradually
				Matter.Body.setVelocity(body, {
					x: body.velocity.x * 0.98,
					y: body.velocity.y * 0.98
				});
			});
		});

		// Store refs
		engineRef.current = engine;
		worldRef.current = world;
		targetBodyRef.current = targetBody;
		setIsInitialized(true);

		// Cleanup
		return () => {
			Matter.Runner.stop(runner);
			Matter.Engine.clear(engine);
			Matter.Events.off(engine, 'collisionStart', () => {});
			Matter.Events.off(engine, 'beforeUpdate', () => {});
			engineRef.current = null;
			worldRef.current = null;
			targetBodyRef.current = null;
			bubbleBodiesRef.current.clear();
			collidedBubblesRef.current.clear();
		};
	}, [width, height, gravityY, onCollision]);

	// Add bubble to physics world
	const addBubble = (id: string, x: number, y: number, isCorrect: boolean) => {
		if (!worldRef.current) return;

		// Remove if already exists
		if (bubbleBodiesRef.current.has(id)) {
			removeBubble(id);
		}

		const body = Matter.Bodies.circle(x, y, config.bubbleRadius, {
			density: config.bubbleDensity,
			restitution: config.bubbleRestitution,
			friction: config.bubbleFriction,
			label: `bubble-${id}`,
			render: {
				fillStyle: isCorrect ? '#10b981' : '#6b7280'
			}
		});

		Matter.Composite.add(worldRef.current, body);
		bubbleBodiesRef.current.set(id, { body, id, isCorrect });
	};

	// Remove bubble from physics world
	const removeBubble = (id: string) => {
		if (!worldRef.current) return;

		const bubbleData = bubbleBodiesRef.current.get(id);
		if (bubbleData) {
			Matter.Composite.remove(worldRef.current, bubbleData.body);
			bubbleBodiesRef.current.delete(id);
		}
	};

	// Apply force to bubble
	const applyForce = (id: string, forceX: number, forceY: number) => {
		const bubbleData = bubbleBodiesRef.current.get(id);
		if (bubbleData) {
			Matter.Body.applyForce(bubbleData.body, bubbleData.body.position, {
				x: forceX,
				y: forceY
			});
		}
	};

	// Get bubble position
	const getBubblePosition = (id: string): { x: number; y: number } | null => {
		const bubbleData = bubbleBodiesRef.current.get(id);
		if (bubbleData) {
			return {
				x: bubbleData.body.position.x,
				y: bubbleData.body.position.y
			};
		}
		return null;
	};

	// Clear collision tracking (for new rounds)
	const clearCollisions = () => {
		collidedBubblesRef.current.clear();
	};

	return {
		engine: engineRef.current,
		world: worldRef.current,
		targetBody: targetBodyRef.current,
		addBubble: isInitialized ? addBubble : () => {},
		removeBubble: isInitialized ? removeBubble : () => {},
		applyForce: isInitialized ? applyForce : () => {},
		getBubblePosition: isInitialized ? getBubblePosition : () => null,
		clearCollisions: isInitialized ? clearCollisions : () => {},
		bubbleBodies: bubbleBodiesRef.current
	};
}
