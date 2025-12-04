import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import type { BubbleData } from '../stores/global-store';
import { globalStore } from '../stores/global-store';

interface ManualPuzzleInput {
	targetCategory: string;
	correctBubbles: string[];
	incorrectBubbles: string[];
}

interface AIPuzzleResponse {
	targetCategory: string;
	correctBubbles: string[];
	incorrectBubbles: string[];
}

export const setupGameActions = {
	/**
	 * Create puzzle from manual input
	 */
	async createPuzzleManual(input: ManualPuzzleInput, totalRounds = 5) {
		const { targetCategory, correctBubbles, incorrectBubbles } = input;

		// Validate input
		if (!targetCategory.trim()) {
			throw new Error('Target category is required');
		}

		if (totalRounds < 1 || totalRounds > 10) {
			throw new Error('Total rounds must be between 1 and 10');
		}

		const allBubbles = [...correctBubbles, ...incorrectBubbles];
		if (allBubbles.some((b) => !b.trim())) {
			throw new Error('All bubble labels are required');
		}

		// Check for duplicates
		const uniqueLabels = new Set(allBubbles.map((b) => b.trim().toLowerCase()));
		if (uniqueLabels.size !== allBubbles.length) {
			throw new Error('Bubble labels must be unique');
		}

		// Create bubble data
		const bubbles: BubbleData[] = [
			...correctBubbles.map((label, i) => ({
				id: `correct-${i}`,
				label: label.trim(),
				isCorrect: true
			})),
			...incorrectBubbles.map((label, i) => ({
				id: `incorrect-${i}`,
				label: label.trim(),
				isCorrect: false
			}))
		];

		// Shuffle bubbles to randomize positions
		for (let i = bubbles.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[bubbles[i], bubbles[j]] = [bubbles[j], bubbles[i]];
		}

		// Update global store
		await kmClient.transact([globalStore], ([state]) => {
			state.targetBubble = {
				label: targetCategory.trim(),
				category: targetCategory.trim()
			};
			state.bubbles = bubbles;
			state.gamePhase = 'setup';
			state.currentRound = 0;
			state.totalRounds = totalRounds;
			state.allRoundsPuzzles = []; // Clear AI puzzles for manual mode
		});
	},

	/**
	 * Generate puzzles for all rounds using AI
	 */
	async generatePuzzlesWithAI(
		theme: string,
		totalRounds: number
	): Promise<void> {
		if (!theme.trim()) {
			throw new Error('Theme is required');
		}

		if (totalRounds < 1 || totalRounds > 10) {
			throw new Error('Total rounds must be between 1 and 10');
		}

		// Generate content for all rounds
		const roundsContent: Array<{
			targetCategory: string;
			correctBubbles: string[];
			incorrectBubbles: string[];
		}> = [];

		for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber++) {
			// Calculate difficulty for this round
			const correctCount = Math.min(
				config.initialCorrectCount +
					(roundNumber - 1) * config.difficultyCorrectionIncrement,
				config.maxBubblesTotal - config.initialIncorrectCount
			);

			const incorrectCount = Math.min(
				config.initialIncorrectCount +
					(roundNumber - 1) * config.difficultyIncorrectIncrement,
				config.maxBubblesTotal - correctCount
			);

			const prompt = `Generate a puzzle for round ${roundNumber} of ${totalRounds} in a bubble merge game.

Theme: ${theme}

Provide:
1. A target category name related to the theme (2-4 words max)
2. ${correctCount} items that belong to this category
3. ${incorrectCount} items that do NOT belong (distractors/decoys)

Make distractors plausible but clearly incorrect. Keep all labels short (1-4 words).
${roundNumber > 1 ? `Make this round ${roundNumber} more challenging than previous rounds by using more specific or nuanced categories.` : ''}

Respond with JSON in this exact format:
{
  "targetCategory": "Category Name",
  "correctBubbles": ["Item 1", "Item 2", ...],
  "incorrectBubbles": ["Distractor 1", "Distractor 2", ...]
}`;

			const parsed = await kmClient.ai.generateJson<AIPuzzleResponse>({
				model: 'gpt-4o',
				userPrompt: prompt
			});

			// Validate response
			if (
				!parsed.targetCategory ||
				!Array.isArray(parsed.correctBubbles) ||
				!Array.isArray(parsed.incorrectBubbles)
			) {
				throw new Error(`Invalid AI response for round ${roundNumber}`);
			}

			if (
				parsed.correctBubbles.length !== correctCount ||
				parsed.incorrectBubbles.length !== incorrectCount
			) {
				throw new Error(
					`AI returned incorrect number of bubbles for round ${roundNumber}`
				);
			}

			roundsContent.push(parsed);
		}

		// Store all rounds content
		await kmClient.transact([globalStore], ([state]) => {
			state.totalRounds = totalRounds;
			state.gamePhase = 'setup';
			state.currentRound = 0;

			// Store all rounds
			state.allRoundsPuzzles = roundsContent;

			// Set up first round puzzle
			const firstRound = roundsContent[0];
			const bubbles: BubbleData[] = [
				...firstRound.correctBubbles.map((label, i) => ({
					id: `correct-${i}`,
					label: label.trim(),
					isCorrect: true
				})),
				...firstRound.incorrectBubbles.map((label, i) => ({
					id: `incorrect-${i}`,
					label: label.trim(),
					isCorrect: false
				}))
			];
			// Shuffle bubbles to randomize positions
			for (let i = bubbles.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[bubbles[i], bubbles[j]] = [bubbles[j], bubbles[i]];
			}
			state.targetBubble = {
				label: firstRound.targetCategory.trim(),
				category: firstRound.targetCategory.trim()
			};
			state.bubbles = bubbles;
		});
	},

	/**
	 * Start a new round with current puzzle
	 */
	async startRound() {
		await kmClient.transact([globalStore], ([state]) => {
			const roundNumber = state.currentRound + 1;

			// If we have stored puzzles, load the next round's puzzle
			if (
				state.allRoundsPuzzles.length > 0 &&
				roundNumber <= state.allRoundsPuzzles.length
			) {
				const roundPuzzle = state.allRoundsPuzzles[roundNumber - 1];
				const bubbles: BubbleData[] = [
					...roundPuzzle.correctBubbles.map((label, i) => ({
						id: `correct-${i}`,
						label: label.trim(),
						isCorrect: true
					})),
					...roundPuzzle.incorrectBubbles.map((label, i) => ({
						id: `incorrect-${i}`,
						label: label.trim(),
						isCorrect: false
					}))
				];
				// Shuffle bubbles to randomize positions
				for (let i = bubbles.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[bubbles[i], bubbles[j]] = [bubbles[j], bubbles[i]];
				}
				state.targetBubble = {
					label: roundPuzzle.targetCategory.trim(),
					category: roundPuzzle.targetCategory.trim()
				};
				state.bubbles = bubbles;
			} else if (state.bubbles.length === 0) {
				throw new Error('No puzzle created yet');
			} else {
				// Manual mode: shuffle existing bubbles for new round
				const bubbles = [...state.bubbles];
				for (let i = bubbles.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[bubbles[i], bubbles[j]] = [bubbles[j], bubbles[i]];
				}
				state.bubbles = bubbles;
			}

			// Calculate difficulty config
			const correctCount = Math.min(
				config.initialCorrectCount +
					(roundNumber - 1) * config.difficultyCorrectionIncrement,
				config.maxBubblesTotal - config.initialIncorrectCount
			);

			const incorrectCount = Math.min(
				config.initialIncorrectCount +
					(roundNumber - 1) * config.difficultyIncorrectIncrement,
				config.maxBubblesTotal - correctCount
			);

			// Update state
			state.currentRound = roundNumber;
			state.roundStartTime = kmClient.serverTimestamp();
			state.roundTimeRemaining = config.timePerRoundSeconds * 1000;
			state.gamePhase = 'playing';
			state.roundConfig = {
				correctCount,
				incorrectCount
			};

			// Reset player progress
			state.playerProgress = {};
			for (const clientId of Object.keys(state.players)) {
				state.playerProgress[clientId] = {
					absorbedCount: 0,
					incorrectAttempts: 0,
					completionTime: null,
					accuracy: 0,
					score: 0
				};
			}
		});
	},

	/**
	 * Reset game to round 1
	 */
	async resetGame() {
		await kmClient.transact([globalStore], ([state]) => {
			state.gamePhase = 'idle';
			state.currentRound = 0;
			state.totalRounds = 3;
			state.roundStartTime = 0;
			state.roundTimeRemaining = 0;
			state.bubbles = [];
			state.allRoundsPuzzles = [];
			state.targetBubble = { label: '', category: '' };
			state.playerProgress = {};
			state.roundWinners = [];
			state.roundConfig = {
				correctCount: config.initialCorrectCount,
				incorrectCount: config.initialIncorrectCount
			};
		});
	}
};
