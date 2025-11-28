import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { generateLink } from '@/kit/generate-link';
import { HostPresenterLayout } from '@/layouts/host-presenter';
import { kmClient } from '@/services/km-client';
import { setupGameActions } from '@/state/actions/setup-game-actions';
import { globalStore } from '@/state/stores/global-store';
import { ConnectionsView } from '@/views/connections-view';
import { GameSetupView } from '@/views/game-setup-view';
import { RoundResultsView } from '@/views/round-results-view';
import { KmQrCode } from '@kokimoki/shared';
import * as React from 'react';
import { useSnapshot } from 'valtio';

const App: React.FC = () => {
	useGlobalController();
	const { title } = config;
	useDocumentTitle(title);

	const { gamePhase, currentRound, bubbles } = useSnapshot(globalStore.proxy);

	if (kmClient.clientContext.mode !== 'host') {
		throw new Error('App host rendered in non-host mode');
	}

	const playerLink = generateLink(kmClient.clientContext.playerCode, {
		mode: 'player'
	});

	const presenterLink = generateLink(kmClient.clientContext.presenterCode, {
		mode: 'presenter',
		playerCode: kmClient.clientContext.playerCode
	});

	const handleStartRound = async () => {
		await setupGameActions.startRound();
	};

	const handleShowResults = async () => {
		await setupGameActions.showResults();
	};

	return (
		<HostPresenterLayout.Root>
			<HostPresenterLayout.Header>
				<div className="text-sm opacity-70">{config.hostLabel}</div>
				{currentRound > 0 && (
					<div className="text-sm font-medium">
						{config.currentRoundLabel} {currentRound}
					</div>
				)}
			</HostPresenterLayout.Header>

			<HostPresenterLayout.Main>
				<div className="rounded-lg border border-gray-200 bg-white shadow-md">
					<div className="flex flex-col gap-2 p-6">
						<h2 className="text-xl font-bold">{config.gameLinksTitle}</h2>
						<KmQrCode data={playerLink} size={200} interactive={false} />
						<div className="flex gap-2">
							<a
								href={playerLink}
								target="_blank"
								rel="noreferrer"
								className="break-all text-blue-600 underline hover:text-blue-700"
							>
								{config.playerLinkLabel}
							</a>
							|
							<a
								href={presenterLink}
								target="_blank"
								rel="noreferrer"
								className="break-all text-blue-600 underline hover:text-blue-700"
							>
								{config.presenterLinkLabel}
							</a>
						</div>
					</div>
				</div>

				{/* Game Controls */}
				{gamePhase === 'idle' || gamePhase === 'setup' ? (
					<>
						<GameSetupView />
						{bubbles.length > 0 && (
							<button
								onClick={handleStartRound}
								className="w-full max-w-2xl rounded-lg bg-green-500 px-4 py-3 font-medium text-white hover:bg-green-600"
							>
								{config.startRoundButton}
							</button>
						)}
					</>
				) : gamePhase === 'playing' ? (
					<>
						<ConnectionsView />
						<div className="flex gap-4">
							<button
								onClick={handleShowResults}
								className="flex-1 rounded-lg bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-600"
							>
								Show Results
							</button>
							<button
								onClick={async () => {
									if (
										confirm(
											'Are you sure you want to reset the game? All progress will be lost.'
										)
									) {
										await setupGameActions.resetGame();
									}
								}}
								className="rounded-lg bg-red-500 px-4 py-3 font-medium text-white hover:bg-red-600"
							>
								{config.resetGameButton}
							</button>
						</div>
					</>
				) : (
					<RoundResultsView />
				)}
			</HostPresenterLayout.Main>
		</HostPresenterLayout.Root>
	);
};

export default App;
