import { config } from '@/config';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import React from 'react';
import Markdown from 'react-markdown';
import { useSnapshot } from 'valtio';

interface Props {
	className?: string;
}

/**
 * View to display players who have joined the game and their online status.
 * This example is **optional** and can be removed if not needed
 */
export const ConnectionsView: React.FC<React.PropsWithChildren<Props>> = ({
	className
}) => {
	const players = useSnapshot(globalStore.proxy).players;
	const onlinePlayerIds = useSnapshot(globalStore.connections).clientIds;
	const playersList = Object.entries(players).map(([id, player]) => ({
		id,
		name: player.name,
		isOnline: onlinePlayerIds.has(id)
	}));
	const onlinePlayersCount = playersList.filter((p) => p.isOnline).length;

	return (
		<div
			className={cn(
				'bg-surface border-primary-200 w-full rounded-lg border shadow-md',
				className
			)}
		>
			<div className="p-6">
				<div className="prose">
					<Markdown>{config.connectionsMd}</Markdown>
				</div>

				<div className="bg-surface border-primary-200 mt-4 rounded-lg border p-6 shadow">
					<div className="text-text-secondary text-sm">{config.players}</div>
					<div className="text-text-primary mt-1 text-3xl font-bold">
						{onlinePlayersCount}
					</div>
				</div>

				{playersList.length > 0 && (
					<div className="mt-4">
						<h3 className="text-text-primary mb-2 text-lg font-semibold">
							Player List
						</h3>
						<ul className="bg-primary-50 divide-border divide-y rounded-lg">
							{playersList.map((player) => (
								<li key={player.id} className="px-4 py-3">
									<div className="flex items-center justify-between">
										<span className="text-text-primary">{player.name}</span>
										<span
											className={cn(
												'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
												player.isOnline
													? 'bg-success-50 text-success-500 border-success-500 border'
													: 'border-border text-text-muted border'
											)}
										>
											{player.isOnline ? 'Online' : 'Offline'}
										</span>
									</div>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
};
