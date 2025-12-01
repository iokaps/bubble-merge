import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { generateLink } from '@/kit/generate-link';
import { HostPresenterLayout } from '@/layouts/host-presenter';
import { kmClient } from '@/services/km-client';
import { globalStore } from '@/state/stores/global-store';
import { ConnectionsView } from '@/views/connections-view';
import { RoundResultsView } from '@/views/round-results-view';
import { KmQrCode } from '@kokimoki/shared';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { useSnapshot } from 'valtio';

const App: React.FC = () => {
	const { title } = config;

	useGlobalController();
	useDocumentTitle(title);

	const { gamePhase, playerProgress, players, currentRound, roundConfig } =
		useSnapshot(globalStore.proxy);

	if (kmClient.clientContext.mode !== 'presenter') {
		throw new Error('App presenter rendered in non-presenter mode');
	}

	const playerLink = generateLink(kmClient.clientContext.playerCode, {
		mode: 'player'
	});

	// Sort players by progress
	const sortedPlayers = Object.entries(playerProgress)
		.map(([clientId, progress]) => ({
			clientId,
			name: players[clientId]?.name || 'Unknown',
			...progress
		}))
		.sort((a, b) => {
			if (a.completionTime && !b.completionTime) return -1;
			if (!a.completionTime && b.completionTime) return 1;
			if (a.completionTime && b.completionTime)
				return a.completionTime - b.completionTime;
			return b.absorbedCount - a.absorbedCount;
		});

	return (
		<HostPresenterLayout.Root>
			<HostPresenterLayout.Header>
				<div className="text-sm opacity-70">{config.presenterLabel}</div>
				{currentRound > 0 && (
					<div className="text-lg font-medium">
						{config.currentRoundLabel} {currentRound}
					</div>
				)}
			</HostPresenterLayout.Header>

			<HostPresenterLayout.Main>
				<div className="border-primary-200 bg-surface rounded-lg border shadow-md">
					<div className="flex flex-col gap-2 p-6">
						<h2 className="text-xl font-bold">{config.playerLinkLabel}</h2>
						<KmQrCode data={playerLink} size={200} interactive={false} />

						<a
							href={playerLink}
							target="_blank"
							rel="noreferrer"
							className="break-all text-blue-600 underline hover:text-blue-700"
						>
							{config.playerLinkLabel}
						</a>
					</div>
				</div>

				{gamePhase === 'playing' ? (
					<div className="border-primary-200 bg-surface rounded-lg border p-6 shadow-md">
						<h2 className="mb-4 text-2xl font-bold">
							{config.presenterRaceTitle}
						</h2>
						<div className="space-y-3">
							{sortedPlayers.map((player, index) => (
								<div
									key={player.clientId}
									className="bg-primary-50 flex items-center gap-4 rounded-lg p-4"
								>
									<div className="text-text-muted w-8 text-2xl font-bold">
										#{index + 1}
									</div>
									<div className="flex-1">
										<div className="text-lg font-bold">{player.name}</div>
										<div className="bg-primary-100 mt-2 h-4 overflow-hidden rounded-full">
											<div
												className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
												style={{
													width: `${(player.absorbedCount / roundConfig.correctCount) * 100}%`
												}}
											/>
										</div>
									</div>
									<div className="text-right">
										<div className="text-2xl font-bold">
											{player.absorbedCount} / {roundConfig.correctCount}
										</div>
										{player.completionTime && (
											<div className="text-success-500 text-sm font-medium">
												✓ Complete
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				) : gamePhase === 'countdown' ? (
					<div className="prose prose-lg border-primary-200 bg-surface max-w-none rounded-lg border p-8 text-center">
						<h2 className="text-primary-600 mb-4 text-4xl font-bold">
							{config.currentRoundLabel} {currentRound + 1}
						</h2>
						<ReactMarkdown>{config.nextRoundCountdownMd}</ReactMarkdown>
					</div>
				) : gamePhase === 'results' ? (
					<RoundResultsView />
				) : (
					<div className="prose prose-lg border-primary-200 bg-surface max-w-none rounded-lg border p-8 text-center">
						<ReactMarkdown>{config.presenterWaitingMd}</ReactMarkdown>
						<ConnectionsView />
					</div>
				)}
			</HostPresenterLayout.Main>
		</HostPresenterLayout.Root>
	);
};

export default App;
