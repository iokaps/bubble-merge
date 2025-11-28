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
				width: width,
				height: height,
				maxWidth: '100%',
				maxHeight: '80vh'
			}}
			className={cn(
				'relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-purple-50',
				'border-2 border-gray-300 shadow-lg',
				className
			)}
		>
			{children}
		</div>
	);
};
