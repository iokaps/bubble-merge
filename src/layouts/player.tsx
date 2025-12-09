import { config } from '@/config';
import { cn } from '@/utils/cn';
import * as React from 'react';

interface LayoutProps {
	children?: React.ReactNode;
	className?: string;
}

const PlayerRoot: React.FC<LayoutProps> = ({ children, className }) => (
	<main
		className={cn(
			'from-primary-100 via-background to-secondary-100 grid h-dvh max-h-dvh w-full grid-rows-[auto_1fr_auto] overflow-hidden bg-gradient-to-br',
			className
		)}
	>
		{children}
	</main>
);

const PlayerHeader: React.FC<LayoutProps> = ({ children, className }) => (
	<header
		className={cn(
			'bg-surface/80 sticky top-0 z-10 py-1 backdrop-blur-sm',
			className
		)}
	>
		<div className="container mx-auto flex items-center justify-between px-2">
			<div className="text-xs font-bold opacity-70">{config.title}</div>

			{children}
		</div>
	</header>
);

const PlayerMain: React.FC<LayoutProps> = ({ children, className }) => (
	<main
		className={cn(
			'container mx-auto flex items-center justify-center overflow-hidden px-1 py-1',
			className
		)}
	>
		{children}
	</main>
);

const PlayerFooter: React.FC<LayoutProps> = ({ children, className }) => (
	<footer
		className={cn(
			'bg-surface/80 sticky bottom-0 z-10 px-2 py-1 backdrop-blur-sm',
			className
		)}
	>
		{children}
	</footer>
);

/**
 * Layout components for the 'player' mode
 */
export const PlayerLayout = {
	Root: PlayerRoot,
	Header: PlayerHeader,
	Main: PlayerMain,
	Footer: PlayerFooter
};
