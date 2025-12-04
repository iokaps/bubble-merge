import { config } from '@/config';
import { cn } from '@/utils/cn';
import { motion } from 'motion/react';
import * as React from 'react';

export interface BubbleItemProps {
	id: string;
	label: string;
	isCorrect: boolean;
	position: { x: number; y: number };
	onDrop?: (
		id: string,
		isCorrect: boolean,
		dropX: number,
		dropY: number
	) => void;
	isAbsorbed?: boolean;
	shouldShake?: boolean;
	isDraggingAllowed?: boolean;
}

export const BubbleItem: React.FC<BubbleItemProps> = ({
	id,
	label,
	isCorrect,
	position,
	onDrop,
	isAbsorbed = false,
	shouldShake = false,
	isDraggingAllowed = true
}) => {
	const [isDragging, setIsDragging] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement>(null);

	return (
		<motion.div
			ref={containerRef}
			drag={isDraggingAllowed}
			dragMomentum={false}
			dragElastic={0.2}
			style={{
				position: 'absolute',
				left: position.x,
				top: position.y,
				width: config.bubbleRadius * 2,
				height: config.bubbleRadius * 2,
				translateX: -config.bubbleRadius,
				translateY: -config.bubbleRadius,
				zIndex: isDragging ? 10 : 2
			}}
			onDragStart={() => setIsDragging(true)}
			onDragEnd={(_event, info) => {
				setIsDragging(false);

				// Get the container element to calculate relative position
				const container = containerRef.current?.parentElement;
				if (!container) {
					onDrop?.(id, isCorrect, position.x, position.y);
					return;
				}

				// Get container bounds
				const containerRect = container.getBoundingClientRect();

				// Calculate drop position relative to container
				// info.point gives us the page coordinates of the drop
				const dropX = info.point.x - containerRect.left;
				const dropY = info.point.y - containerRect.top;

				onDrop?.(id, isCorrect, dropX, dropY);
			}}
			animate={{
				scale: isAbsorbed ? 0 : isDragging ? 1.1 : 1,
				opacity: isAbsorbed ? 0 : 1,
				x: shouldShake && !isAbsorbed ? [0, -10, 10, -10, 10, 0] : 0
			}}
			transition={{
				scale: {
					type: 'spring',
					stiffness: 300,
					damping: 20
				},
				opacity: {
					duration: 0.3
				},
				x: {
					duration: 0.5,
					ease: 'easeInOut'
				}
			}}
			className={cn(
				'flex items-center justify-center rounded-full border-2 border-white shadow-lg',
				'touch-none select-none',
				isDraggingAllowed
					? 'cursor-grab active:cursor-grabbing'
					: 'cursor-not-allowed opacity-60',
				'from-primary-500 to-primary-600 bg-gradient-to-br text-white'
			)}
		>
			<span className="px-2 text-center text-xs font-bold text-white">
				{label}
			</span>
		</motion.div>
	);
};
