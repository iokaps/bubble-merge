import { cn } from '@/utils/cn';
import * as React from 'react';

export interface GameContainerProps {
	children?: React.ReactNode;
	className?: string;
	width?: number;
	height?: number;
}

export const GameContainer: React.FC<GameContainerProps> = ({
	children,
	className,
	width = 800,
	height = 600
}) => {
	return (
		<div
			style={{
				width: '100%',
				height: '100%',
				maxWidth: Math.min(
					width,
					typeof window !== 'undefined' ? window.innerWidth - 16 : width
				),
				maxHeight: Math.min(
					height,
					typeof window !== 'undefined' ? window.innerHeight * 0.75 : height
				),
				aspectRatio: `${width} / ${height}`
			}}
			className={cn(
				'relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-purple-50',
				'border-border border-2 shadow-lg',
				className
			)}
		>
			{children}
		</div>
	);
};
