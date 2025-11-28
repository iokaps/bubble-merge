import { config } from '@/config';
import { cn } from '@/utils/cn';
import { motion, useMotionValue } from 'motion/react';
import * as React from 'react';

export interface BubbleItemProps {
	id: string;
	label: string;
	isCorrect: boolean;
	initialX: number;
	initialY: number;
	position: { x: number; y: number };
	onDragStart?: (id: string) => void;
	onDragEnd?: (id: string, dragDeltaX: number, dragDeltaY: number) => void;
	isAbsorbed?: boolean;
}

export const BubbleItem: React.FC<BubbleItemProps> = ({
	id,
	label,
	position,
	onDragStart,
	onDragEnd,
	isAbsorbed = false
}) => {
	const x = useMotionValue(position.x);
	const y = useMotionValue(position.y);
	const [isDragging, setIsDragging] = React.useState(false);
	const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

	// Update position when physics engine updates (only when not dragging)
	React.useEffect(() => {
		if (!isDragging) {
			x.set(position.x);
			y.set(position.y);
		}
	}, [position.x, position.y, x, y, isDragging]);

	return (
		<>
			{/* Slingshot line visual */}
			{isDragging && (
				<svg
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
						pointerEvents: 'none',
						zIndex: 1
					}}
				>
					<line
						x1={position.x}
						y1={position.y}
						x2={position.x + dragOffset.x}
						y2={position.y + dragOffset.y}
						stroke="#ef4444"
						strokeWidth="3"
						strokeDasharray="5,5"
					/>
					<circle
						cx={position.x}
						cy={position.y}
						r="5"
						fill="#ef4444"
						opacity="0.5"
					/>
				</svg>
			)}

			<motion.div
				drag
				dragMomentum={false}
				dragElastic={0}
				style={{
					x,
					y,
					position: 'absolute',
					width: config.bubbleRadius * 2,
					height: config.bubbleRadius * 2,
					translateX: -config.bubbleRadius,
					translateY: -config.bubbleRadius,
					zIndex: isDragging ? 10 : 2
				}}
				onDragStart={() => {
					setIsDragging(true);
					setDragOffset({ x: 0, y: 0 });
					onDragStart?.(id);
				}}
				onDrag={(_, info) => {
					// Track drag offset for slingshot visualization
					setDragOffset({ x: info.offset.x, y: info.offset.y });
				}}
				onDragEnd={(_, info) => {
					setIsDragging(false);
					setDragOffset({ x: 0, y: 0 });
					// Pass negative offset to shoot in opposite direction
					onDragEnd?.(id, -info.offset.x, -info.offset.y);
				}}
				animate={{
					scale: isAbsorbed ? 0 : 1,
					opacity: isAbsorbed ? 0 : 1
				}}
				transition={{
					type: 'spring',
					stiffness: 300,
					damping: 20
				}}
				className={cn(
					'flex items-center justify-center rounded-full border-2 border-white shadow-lg',
					'cursor-grab touch-none select-none active:cursor-grabbing',
					'bg-gradient-to-br from-blue-400 to-indigo-500'
				)}
			>
				<span className="px-2 text-center text-xs font-bold text-white">
					{label}
				</span>
			</motion.div>
		</>
	);
};
