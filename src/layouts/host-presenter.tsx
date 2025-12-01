import { config } from '@/config';
import { cn } from '@/utils/cn';
import * as React from 'react';

interface LayoutProps {
	children?: React.ReactNode;
	className?: string;
}

const HostPresenterRoot: React.FC<LayoutProps> = ({ children, className }) => (
	<div
		className={cn(
			'scrollable from-primary-50 via-background to-secondary-50 h-dvh max-h-dvh w-full overflow-y-auto bg-gradient-to-br p-4 sm:p-8',
			className
		)}
	>
		{children}
	</div>
);

const HostPresenterHeader: React.FC<LayoutProps> = ({
	children,
	className
}) => (
	<header className={cn('mb-8', className)}>
		<h1 className="text-2xl font-bold">{config.title}</h1>
		{children}
	</header>
);

const HostPresenterMain: React.FC<LayoutProps> = ({ children, className }) => (
	<main className={cn('mx-auto grid max-w-screen-xl gap-6', className)}>
		{children}
	</main>
);

/**
 * Layout components for the 'host' and 'presenter' modes
 */
export const HostPresenterLayout = {
	Root: HostPresenterRoot,
	Header: HostPresenterHeader,
	Main: HostPresenterMain
};
