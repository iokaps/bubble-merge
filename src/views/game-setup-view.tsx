import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { setupGameActions } from '@/state/actions/setup-game-actions';
import { playerStore, type PlayerState } from '@/state/stores/player-store';
import { cn } from '@/utils/cn';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { useSnapshot } from 'valtio';

export const GameSetupView: React.FC = () => {
	const { setupMode } = useSnapshot(playerStore.proxy);
	const [targetCategory, setTargetCategory] = React.useState('');
	const [correctBubbles, setCorrectBubbles] = React.useState(['', '', '', '']);
	const [incorrectBubbles, setIncorrectBubbles] = React.useState(['', '']);
	const [theme, setTheme] = React.useState('');
	const [totalRounds, setTotalRounds] = React.useState(3);
	const [isGenerating, setIsGenerating] = React.useState(false);
	const [error, setError] = React.useState('');

	const handleModeToggle = async (mode: 'manual' | 'ai') => {
		await kmClient.transact([playerStore], ([state]: [PlayerState]) => {
			state.setupMode = mode;
		});
	};

	const handleCreateManual = async () => {
		try {
			setError('');
			await setupGameActions.createPuzzleManual({
				targetCategory,
				correctBubbles: correctBubbles.filter((b) => b.trim()),
				incorrectBubbles: incorrectBubbles.filter((b) => b.trim())
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create puzzle');
		}
	};

	const handleGenerateAI = async () => {
		try {
			setError('');
			setIsGenerating(true);
			await setupGameActions.generatePuzzlesWithAI(theme, totalRounds);
		} catch (err) {
			setError(err instanceof Error ? err.message : config.aiGenerationError);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="w-full max-w-2xl space-y-6">
			<div>
				<h1 className="text-3xl font-bold">{config.gameSetupTitle}</h1>
			</div>

			{/* Mode Toggle */}
			<div className="flex gap-2">
				<button
					onClick={() => handleModeToggle('manual')}
					className={cn(
						'flex-1 rounded-lg px-4 py-2 font-medium transition-colors',
						setupMode === 'manual'
							? 'bg-blue-500 text-white'
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
					)}
				>
					{config.gameSetupModeManual}
				</button>
				<button
					onClick={() => handleModeToggle('ai')}
					className={cn(
						'flex-1 rounded-lg px-4 py-2 font-medium transition-colors',
						setupMode === 'ai'
							? 'bg-blue-500 text-white'
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
					)}
				>
					{config.gameSetupModeAI}
				</button>
			</div>

			{/* Manual Mode */}
			{setupMode === 'manual' && (
				<div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
					<div className="prose prose-sm max-w-none">
						<ReactMarkdown>{config.gameSetupManualMd}</ReactMarkdown>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium">
							{config.targetCategoryLabel}
						</label>
						<input
							type="text"
							value={targetCategory}
							onChange={(e) => setTargetCategory(e.target.value)}
							placeholder={config.targetCategoryPlaceholder}
							className="w-full rounded border border-gray-300 px-3 py-2"
						/>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium">
							{config.correctBubbleLabel}s
						</label>
						<div className="space-y-2">
							{correctBubbles.map((bubble, i) => (
								<input
									key={i}
									type="text"
									value={bubble}
									onChange={(e) => {
										const newBubbles = [...correctBubbles];
										newBubbles[i] = e.target.value;
										setCorrectBubbles(newBubbles);
									}}
									placeholder={`${config.correctBubbleLabel} ${i + 1}`}
									className="w-full rounded border border-gray-300 px-3 py-2"
								/>
							))}
						</div>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium">
							{config.incorrectBubbleLabel}s
						</label>
						<div className="space-y-2">
							{incorrectBubbles.map((bubble, i) => (
								<input
									key={i}
									type="text"
									value={bubble}
									onChange={(e) => {
										const newBubbles = [...incorrectBubbles];
										newBubbles[i] = e.target.value;
										setIncorrectBubbles(newBubbles);
									}}
									placeholder={`${config.incorrectBubbleLabel} ${i + 1}`}
									className="w-full rounded border border-gray-300 px-3 py-2"
								/>
							))}
						</div>
					</div>

					{error && (
						<div className="rounded bg-red-50 p-3 text-sm text-red-600">
							{error}
						</div>
					)}

					<button
						onClick={handleCreateManual}
						className="w-full rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
					>
						{config.createPuzzleButton}
					</button>
				</div>
			)}

			{/* AI Mode */}
			{setupMode === 'ai' && (
				<div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
					<div className="prose prose-sm max-w-none">
						<ReactMarkdown>{config.gameSetupAIMd}</ReactMarkdown>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium">
							{config.themeLabel}
						</label>
						<input
							type="text"
							value={theme}
							onChange={(e) => setTheme(e.target.value)}
							placeholder={config.themePlaceholder}
							className="w-full rounded border border-gray-300 px-3 py-2"
							disabled={isGenerating}
						/>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium">
							{config.totalRoundsLabel}
						</label>
						<select
							value={totalRounds}
							onChange={(e) => setTotalRounds(Number(e.target.value))}
							className="w-full rounded border border-gray-300 px-3 py-2"
							disabled={isGenerating}
						>
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<option key={num} value={num}>
									{num} {num === 1 ? 'Round' : 'Rounds'}
								</option>
							))}
						</select>
					</div>

					{error && (
						<div className="rounded bg-red-50 p-3 text-sm text-red-600">
							{error}
						</div>
					)}

					<button
						onClick={handleGenerateAI}
						disabled={isGenerating || !theme.trim()}
						className={cn(
							'w-full rounded-lg px-4 py-2 font-medium text-white',
							isGenerating || !theme.trim()
								? 'cursor-not-allowed bg-gray-400'
								: 'bg-blue-500 hover:bg-blue-600'
						)}
					>
						{isGenerating ? config.generatingAI : config.generateWithAIButton}
					</button>
				</div>
			)}
		</div>
	);
};
