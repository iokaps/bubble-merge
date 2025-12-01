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
				<div className="border-primary-200 bg-surface rounded-lg border shadow-md">
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
								className="bg-success-500 w-full max-w-2xl rounded-lg px-4 py-3 font-medium text-white hover:brightness-90"
							>
								{config.startRoundButton}
							</button>
						)}
					</>
				) : gamePhase === 'playing' || gamePhase === 'countdown' ? (
					<>
						<ConnectionsView />
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
							className="bg-danger-500 w-full max-w-2xl rounded-lg px-4 py-3 font-medium text-white hover:brightness-90"
						>
							{config.resetGameButton}
						</button>
					</>
				) : (
					<RoundResultsView />
				)}
			</HostPresenterLayout.Main>
		</HostPresenterLayout.Root>
	);
};

export default App;
