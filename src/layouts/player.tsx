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
			'from-primary-50 via-background to-secondary-50 grid h-dvh max-h-dvh w-full grid-rows-[auto_1fr_auto] overflow-hidden bg-gradient-to-br',
			className
		)}
	>
		{children}
	</main>
);

const PlayerHeader: React.FC<LayoutProps> = ({ children, className }) => (
	<header
		className={cn(
			'bg-surface border-border sticky top-0 z-10 border-b py-4 shadow-sm',
			className
		)}
	>
		<div className="container mx-auto flex flex-wrap items-center justify-between px-4">
			<div className="font-bold">{config.title}</div>

			{children}
		</div>
	</header>
);

const PlayerMain: React.FC<LayoutProps> = ({ children, className }) => (
	<main
		className={cn(
			'scrollable container mx-auto flex items-center justify-center overflow-y-auto p-4 lg:p-6',
			className
		)}
	>
		{children}
	</main>
);

const PlayerFooter: React.FC<LayoutProps> = ({ children, className }) => (
	<footer
		className={cn(
			'bg-surface border-border sticky bottom-0 z-10 border-t p-4',
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
