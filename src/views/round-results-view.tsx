import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { setupGameActions } from '@/state/actions/setup-game-actions';
import { globalStore } from '@/state/stores/global-store';
import { KmPodiumTable, KmTimeCountdown } from '@kokimoki/shared';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { useSnapshot } from 'valtio';

export const RoundResultsView: React.FC = () => {
	const { roundWinners, currentRound, playerProgress, players } = useSnapshot(
		globalStore.proxy
	);
	const isHost = kmClient.clientContext.mode === 'host';

	// Filter winners for current round and prepare for podium
	const currentRoundWinners = roundWinners
		.filter((w) => w.round === currentRound)
		.sort((a, b) => b.score - a.score)
		.slice(0, 3);

	const podiumData = currentRoundWinners.map((winner) => ({
		id: winner.clientId,
		name: winner.playerName,
		points: winner.score
	}));

	// All players results
	const allResults = Object.entries(playerProgress || {})
		.filter(([, progress]) => progress.completionTime !== null)
		.map(([clientId, progress]) => ({
			clientId,
			name: players[clientId]?.name || 'Unknown',
			...progress
		}))
		.sort((a, b) => b.score - a.score);

	const handleNextRound = async () => {
		await setupGameActions.startRound();
	};

	const handleResetGame = async () => {
		await setupGameActions.resetGame();
	};

	return (
		<div className="w-full max-w-2xl space-y-4 px-2 sm:space-y-6 sm:px-0">
			{/* Title */}
			<div className="text-center">
				<h1 className="text-primary-600 text-2xl font-bold sm:text-4xl">
					{config.roundCompleteTitle}
				</h1>
				<div className="prose prose-sm text-text-primary mt-2 max-w-none">
					<ReactMarkdown>{config.roundCompleteMd}</ReactMarkdown>
				</div>
			</div>

			{/* Podium */}
			{podiumData.length > 0 ? (
				<div className="border-primary-200 bg-surface rounded-lg border p-6 shadow-md">
					<h2 className="text-text-primary mb-4 text-xl font-bold">
						{config.leaderboardTitle}
					</h2>
					<KmPodiumTable entries={podiumData} pointsLabel={config.scoreLabel} />
				</div>
			) : (
				<div className="border-primary-200 bg-surface text-text-secondary rounded-lg border p-6 text-center">
					{config.noScoresYet}
				</div>
			)}

			{/* All Results */}
			{allResults.length > 3 && (
				<div className="border-primary-200 bg-surface rounded-lg border p-6 shadow-md">
					<h3 className="text-text-primary mb-4 text-lg font-bold">
						All Players
					</h3>
					<div className="space-y-2">
						{allResults.map((result, index) => (
							<div
								key={result.clientId}
								className="bg-primary-50 flex items-center justify-between rounded-lg p-3"
							>
								<div className="flex items-center gap-3">
									<span className="text-text-muted font-bold">
										#{index + 1}
									</span>
									<span className="text-text-primary font-medium">
										{result.name}
									</span>
								</div>
								<div className="text-text-secondary flex items-center gap-4 text-sm">
									<span>
										{config.scoreLabel}:{' '}
										<span className="text-text-primary font-semibold">
											{result.score}
										</span>
									</span>
									<span>
										{config.absorbedLabel}: {result.absorbedCount}
									</span>
									<span>
										{config.accuracyLabel}: {Math.round(result.accuracy * 100)}%
									</span>
									<span>
										<KmTimeCountdown
											ms={result.completionTime || 0}
											display="ms"
										/>
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Host Controls */}
			{isHost && (
				<div className="flex gap-3">
					<button
						onClick={handleNextRound}
						className="bg-primary-500 hover:bg-primary-600 flex-1 rounded-lg px-4 py-3 font-medium text-white transition-colors"
					>
						{config.nextRoundButton}
					</button>
					<button
						onClick={handleResetGame}
						className="border-border bg-surface text-text-primary hover:bg-primary-50 rounded-lg border px-4 py-3 font-medium transition-colors"
					>
						{config.resetGameButton}
					</button>
				</div>
			)}

			{/* Player waiting message */}
			{!isHost && (
				<div className="prose prose-sm border-primary-200 bg-surface max-w-none rounded-lg border p-4 text-center">
					<ReactMarkdown>{config.waitingForNextRoundMd}</ReactMarkdown>
				</div>
			)}
		</div>
	);
};
