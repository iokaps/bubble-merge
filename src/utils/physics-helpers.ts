import Matter from 'matter-js';

/**
 * Calculate distance between two points
 */
export function distance(
	x1: number,
	y1: number,
	x2: number,
	y2: number
): number {
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Check if two circles are colliding
 */
export function areCirclesColliding(
	x1: number,
	y1: number,
	r1: number,
	x2: number,
	y2: number,
	r2: number
): boolean {
	return distance(x1, y1, x2, y2) < r1 + r2;
}

/**
 * Get random position within bounds, avoiding overlap with existing positions and center
 */
export function getRandomPosition(
	width: number,
	height: number,
	radius: number,
	existingPositions: Array<{ x: number; y: number; radius: number }> = [],
	maxAttempts = 50
): { x: number; y: number } {
	const margin = radius + 20; // Extra margin from edges
	const centerX = width / 2;
	const centerY = height / 2;
	const centerAvoidRadius = 120; // Keep bubbles away from center

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const x = margin + Math.random() * (width - margin * 2);
		const y = margin + Math.random() * (height - margin * 2);

		// Check if this position is too close to center
		const distToCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
		if (distToCenter < centerAvoidRadius) {
			continue;
		}

		// Check if this position overlaps with any existing positions
		const hasOverlap = existingPositions.some((pos) =>
			areCirclesColliding(x, y, radius, pos.x, pos.y, pos.radius)
		);

		if (!hasOverlap) {
			return { x, y };
		}
	}

	// Fallback: return position away from center
	const angle = Math.random() * Math.PI * 2;
	const distance = centerAvoidRadius + radius + 20;
	return {
		x: centerX + Math.cos(angle) * distance,
		y: centerY + Math.sin(angle) * distance
	};
}

/**
 * Convert drag velocity to Matter.js force
 */
export function dragVelocityToForce(
	velocityX: number,
	velocityY: number,
	mass: number,
	multiplier = 0.0001
): { x: number; y: number } {
	return {
		x: velocityX * mass * multiplier,
		y: velocityY * mass * multiplier
	};
}

/**
 * Get velocity magnitude
 */
export function getVelocityMagnitude(
	velocityX: number,
	velocityY: number
): number {
	return Math.sqrt(velocityX ** 2 + velocityY ** 2);
}

/**
 * Apply gentle floating motion to a body
 */
export function applyFloatingForce(body: Matter.Body, strength = 0.0001): void {
	const angle = Math.random() * Math.PI * 2;
	const force = {
		x: Math.cos(angle) * strength * body.mass,
		y: Math.sin(angle) * strength * body.mass
	};

	Matter.Body.applyForce(body, body.position, force);
}

/**
 * Limit body velocity to maximum speed
 */
export function limitVelocity(body: Matter.Body, maxSpeed: number): void {
	const velocity = body.velocity;
	const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

	if (speed > maxSpeed) {
		Matter.Body.setVelocity(body, {
			x: (velocity.x / speed) * maxSpeed,
			y: (velocity.y / speed) * maxSpeed
		});
	}
}

/**
 * Push body away from target
 */
export function pushAwayFrom(
	body: Matter.Body,
	targetX: number,
	targetY: number,
	strength = 0.005
): void {
	const dx = body.position.x - targetX;
	const dy = body.position.y - targetY;
	const dist = Math.sqrt(dx ** 2 + dy ** 2);

	if (dist === 0) return;

	const force = {
		x: (dx / dist) * strength * body.mass,
		y: (dy / dist) * strength * body.mass
	};

	Matter.Body.applyForce(body, body.position, force);
}
