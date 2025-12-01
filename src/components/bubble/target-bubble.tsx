import { config } from '@/config';
import { cn } from '@/utils/cn';
import { motion } from 'motion/react';
import * as React from 'react';

export interface TargetBubbleProps {
	label: string;
	scale?: number;
	absorbedCount?: number;
	className?: string;
}

export const TargetBubble: React.FC<TargetBubbleProps> = ({
	label,
	scale = 1.0,
	absorbedCount = 0,
	className
}) => {
	const radius = config.targetBubbleRadius;
	const size = radius * 2 * scale;

	// Pulsing animation when collision happens
	const [isPulsing, setIsPulsing] = React.useState(false);

	React.useEffect(() => {
		if (absorbedCount > 0) {
			setIsPulsing(true);
			const timeout = setTimeout(() => setIsPulsing(false), 300);
			return () => clearTimeout(timeout);
		}
	}, [absorbedCount]);

	return (
		<motion.div
			style={{
				width: size,
				height: size,
				position: 'absolute',
				left: '50%',
				top: '50%',
				translateX: '-50%',
				translateY: '-50%'
			}}
			animate={{
				scale: isPulsing ? [1, 1.1, 1] : 1
			}}
			transition={{
				duration: 0.3,
				ease: 'easeInOut'
			}}
			className={cn(
				'flex items-center justify-center rounded-full border-4 border-white',
				'from-secondary-500 to-primary-500 bg-gradient-to-br',
				'shadow-primary-500/30 pointer-events-none shadow-2xl',
				className
			)}
		>
			<div className="text-center">
				<div className="px-4 text-lg font-bold text-white">{label}</div>
				{absorbedCount > 0 && (
					<div className="mt-1 text-sm text-white/80">{absorbedCount}</div>
				)}
			</div>
		</motion.div>
	);
};
