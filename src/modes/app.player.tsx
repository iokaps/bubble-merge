import { PlayerMenu } from '@/components/player/menu';
import { NameLabel } from '@/components/player/name-label';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PlayerLayout } from '@/layouts/player';
import { playerActions } from '@/state/actions/player-actions';
import { globalStore } from '@/state/stores/global-store';
import { playerStore } from '@/state/stores/player-store';
import { BubbleGameView } from '@/views/bubble-game-view';
import { ConnectionsView } from '@/views/connections-view';
import { CreateProfileView } from '@/views/create-profile-view';
import { GameLobbyView } from '@/views/game-lobby-view';
import { RoundCountdownView } from '@/views/round-countdown-view';
import { RoundResultsView } from '@/views/round-results-view';
import { KmConfettiProvider, KmModalProvider } from '@kokimoki/shared';
import * as React from 'react';
import { useSnapshot } from 'valtio';

const App: React.FC = () => {
	const { title } = config;
	const { name, currentView } = useSnapshot(playerStore.proxy);
	const { gamePhase } = useSnapshot(globalStore.proxy);

	useDocumentTitle(title);

	React.useEffect(() => {
		// Auto-navigate based on game phase
		if (gamePhase === 'playing') {
			playerActions.setCurrentView('bubble-game');
		} else if (gamePhase === 'countdown') {
			playerActions.setCurrentView('bubble-game'); // Stay on game view during countdown
		} else if (gamePhase === 'results') {
			playerActions.setCurrentView('round-results');
		} else if (gamePhase === 'idle' || gamePhase === 'setup') {
			playerActions.setCurrentView('lobby');
		}
	}, [gamePhase]);

	if (!name) {
		return (
			<PlayerLayout.Root>
				<PlayerLayout.Header />
				<PlayerLayout.Main>
					<CreateProfileView />
				</PlayerLayout.Main>
			</PlayerLayout.Root>
		);
	}

	if (gamePhase === 'idle' || gamePhase === 'setup') {
		return (
			<KmModalProvider>
				<PlayerLayout.Root>
					<PlayerLayout.Header>
						<PlayerMenu />
					</PlayerLayout.Header>

					<PlayerLayout.Main>
						{currentView === 'lobby' && <GameLobbyView />}
						{currentView === 'connections' && <ConnectionsView />}
					</PlayerLayout.Main>

					<PlayerLayout.Footer>
						<NameLabel name={name} />
					</PlayerLayout.Footer>
				</PlayerLayout.Root>
			</KmModalProvider>
		);
	}

	return (
		<KmConfettiProvider>
			<PlayerLayout.Root>
				<PlayerLayout.Header />

				<PlayerLayout.Main>
					{currentView === 'bubble-game' && gamePhase === 'countdown' && (
						<RoundCountdownView />
					)}
					{currentView === 'bubble-game' && gamePhase === 'playing' && (
						<BubbleGameView />
					)}
					{currentView === 'round-results' && <RoundResultsView />}
				</PlayerLayout.Main>

				<PlayerLayout.Footer>
					<NameLabel name={name} />
				</PlayerLayout.Footer>
			</PlayerLayout.Root>
		</KmConfettiProvider>
	);
};

export default App;
