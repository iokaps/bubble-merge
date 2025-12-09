import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { setupGameActions } from '@/state/actions/setup-game-actions';
import { globalStore } from '@/state/stores/global-store';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { useSnapshot } from 'valtio';

export const RoundResultsView: React.FC = () => {
	const { roundWinners, players } = useSnapshot(globalStore.proxy);
	const isHost = kmClient.clientContext.mode === 'host';

	// Aggregate scores from all rounds using roundWinners
	const playerTotalScores = new Map<
		string,
		{ name: string; totalScore: number }
	>();

	roundWinners.forEach((winner) => {
		const existing = playerTotalScores.get(winner.clientId);
		if (existing) {
			existing.totalScore += winner.score;
		} else {
			playerTotalScores.set(winner.clientId, {
				name: winner.playerName,
				totalScore: winner.score
			});
		}
	});

	// Convert to array and sort by total score
	const allPlayers = Array.from(playerTotalScores.entries())
		.map(([clientId, data]) => ({
			clientId,
			name: data.name,
			score: data.totalScore
		}))
		.sort((a, b) => b.score - a.score);

	// Top 3 for podium
	const podiumData = allPlayers.slice(0, 3).map((player) => ({
		id: player.clientId,
		name: player.name,
		points: player.score
	}));

	// Debug: Log podium data to verify names
	// console.log('[RoundResults] Podium data:', podiumData);
	// console.log(
	// 	'[RoundResults] Podium entries for KmPodiumTable:',
	// 	JSON.stringify(podiumData, null, 2)
	// );
	// console.log('[RoundResults] All players:', allPlayers);
	// console.log('[RoundResults] Players dict:', players);

	// Remaining players (4th place and below)
	const otherPlayers = allPlayers.slice(3);

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

					{/* Custom leaderboard display as fallback */}
					<div className="mb-6 space-y-3">
						{podiumData.map((entry, index) => (
							<div
								key={entry.id}
								className="bg-primary-50 flex items-center justify-between rounded-lg p-4"
							>
								<div className="flex items-center gap-4">
									<div className="text-3xl">
										{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
									</div>
									<div>
										<div className="text-text-primary text-xl font-bold">
											{entry.name}
										</div>
										<div className="text-text-secondary text-sm">
											Rank #{index + 1}
										</div>
									</div>
								</div>
								<div className="text-right">
									<div className="text-primary-600 text-2xl font-bold">
										{entry.points}
									</div>
									<div className="text-text-secondary text-sm">
										{config.scoreLabel}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className="border-primary-200 bg-surface text-text-secondary rounded-lg border p-6 text-center">
					{config.noScoresYet}
				</div>
			)}

			{/* Other Players */}
			{otherPlayers.length > 0 && (
				<div className="border-primary-200 bg-surface rounded-lg border p-6 shadow-md">
					<h3 className="text-text-primary mb-4 text-lg font-bold">
						Other Players
					</h3>
					<div className="space-y-2">
						{otherPlayers.map((result, index) => (
							<div
								key={result.clientId}
								className="bg-primary-50 flex items-center justify-between rounded-lg p-3"
							>
								<div className="flex items-center gap-3">
									<span className="text-text-muted font-bold">
										#{index + 4}
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
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Host Controls */}
			{isHost && (
				<button
					onClick={handleResetGame}
					className="bg-primary-500 hover:bg-primary-600 w-full rounded-lg px-4 py-3 font-medium text-white transition-colors"
				>
					{config.resetGameButton}
				</button>
			)}
		</div>
	);
};
