import { z } from 'zod/v4';

export const schema = z.object({
	// translations
	title: z.string().default('Bubble Merge'),

	gameLobbyMd: z
		.string()
		.default(
			'# Waiting for game to start...\nThe game will start once the host presses the start button.'
		),

	players: z.string().default('Players'),
	loading: z.string().default('Loading...'),

	menuTitle: z.string().default('Menu'),
	menuConnections: z.string().default('Connections'),
	menuGameLobby: z.string().default('Lobby'),

	playerNameTitle: z.string().default('Enter Your Name'),
	playerNamePlaceholder: z.string().default('Your name...'),
	playerNameLabel: z.string().default('Name:'),
	playerNameButton: z.string().default('Continue'),

	hostLabel: z.string().default('Host'),
	presenterLabel: z.string().default('Presenter'),

	gameLinksTitle: z.string().default('Game Links'),
	playerLinkLabel: z.string().default('Player Link'),
	presenterLinkLabel: z.string().default('Presenter Link'),

	menuAriaLabel: z.string().default('Open menu drawer'),

	// Help content
	helpButtonLabel: z.string().default('Help'),
	helpTitle: z.string().default('How to Play Bubble Merge'),
	helpContentMd: z.string().default(
		`# Game Overview

Bubble Merge is a fast-paced categorization game where players race to identify and merge correct bubbles into a target category.

## Setup

### 1. Choose Your Mode

**Manual Entry:**
- Enter a target category (e.g., "Breaking Bad Characters")
- Add correct bubbles (items that belong to the category)
- Add incorrect bubbles (distractors that don't belong)
- Set the number of rounds (1-10)

**AI Generated:**
- Enter a theme or topic (e.g., "Breaking Bad", "Planets", "React Hooks")
- Set the number of rounds
- AI will generate unique puzzles for each round with increasing difficulty

### 2. Share the Game

- Share the **Player Link** or QR code with participants
- Open the **Presenter Link** on a TV/projector for spectators
- Players join on their mobile devices

### 3. Start the Game

Once you've created a puzzle and players have joined, click **Start Round** to begin!

## Gameplay

### For Players:

1. **Objective:** Drag and drop the correct bubbles to the center target bubble
2. **Scoring:**
   - ✅ Correct bubble = +100 points
   - ❌ Wrong bubble = -50 points penalty
3. **Time Limit:** Each round has a 30-second timer
4. **Competition:** First to absorb all correct bubbles wins the round!

### For Host:

- Monitor player progress in real-time
- View connections and player names
- Click **New Game** to reset and start over

## Round Progression

- After each round, there's a 3-second countdown
- The next round starts automatically
- In AI mode, each round has a new puzzle
- In manual mode, the same puzzle is shuffled
- Final results are shown after all rounds complete

## Scoring System

- **Completion Time:** Faster completion = higher rank
- **Accuracy:** Fewer mistakes = better score
- **Absorbed Count:** Number of correct bubbles collected
- **Score:** Calculated from correct answers minus penalties

## Tips for Hosts

1. **Test First:** Try the game yourself before hosting with a group
2. **Clear Categories:** Choose categories with obvious correct/incorrect items
3. **Appropriate Difficulty:** Start with 4 correct + 2 incorrect bubbles
4. **Presenter Mode:** Always use presenter mode on a big screen for better engagement
5. **Round Count:** 3-5 rounds work best for most sessions

## Troubleshooting

- **Players can't join?** Check if they're using the correct player link
- **Game not progressing?** The host tab must stay open (it controls the game)
- **Need to restart?** Click "New Game" to reset everything

Have fun playing Bubble Merge! 🎮`
	),

	// Bubble Merge game strings
	gameSetupTitle: z.string().default('Game Setup'),
	gameSetupModeManual: z.string().default('Manual Entry'),
	gameSetupModeAI: z.string().default('AI Generated'),
	gameSetupManualMd: z
		.string()
		.default(
			'Enter a target category and bubble labels to create your puzzle.'
		),
	gameSetupAIMd: z
		.string()
		.default('Enter a theme and let AI generate a puzzle for you.'),
	targetCategoryLabel: z.string().default('Target Category'),
	targetCategoryPlaceholder: z.string().default('e.g., Breaking Bad'),
	correctBubbleLabel: z.string().default('Correct Bubble'),
	incorrectBubbleLabel: z.string().default('Incorrect Bubble'),
	bubblePlaceholder: z.string().default('Enter label...'),
	themeLabel: z.string().default('Theme or Topic'),
	themePlaceholder: z
		.string()
		.default('e.g., Breaking Bad, Planets, React Hooks'),
	totalRoundsLabel: z.string().default('Number of Rounds'),
	totalRoundsDefault: z.number().default(5),
	createPuzzleButton: z.string().default('Create Puzzle'),
	generateWithAIButton: z.string().default('Generate with AI'),
	generatingAI: z.string().default('Generating puzzle...'),
	aiGenerationError: z
		.string()
		.default('Failed to generate puzzle. Try again.'),

	startRoundButton: z.string().default('Start Round'),
	resetGameButton: z.string().default('New Game'),
	currentRoundLabel: z.string().default('Round'),

	progressLabel: z.string().default('Progress'),
	absorbedLabel: z.string().default('Absorbed'),
	accuracyLabel: z.string().default('Accuracy'),
	completionTimeLabel: z.string().default('Time'),
	scoreLabel: z.string().default('Score'),

	roundCompleteTitle: z.string().default('Round Complete!'),
	roundCompleteMd: z
		.string()
		.default('Great job! Check out the results below.'),
	nextRoundCountdownMd: z.string().default('Next round starting in...'),
	leaderboardTitle: z.string().default('Leaderboard'),
	noScoresYet: z.string().default('No scores yet'),
	roundTimeUpMd: z.string().default('Time is up!'),

	bubbleGameInstructionsMd: z
		.string()
		.default(
			'**Drag and drop** the correct bubbles to the center!\n\n✅ Correct = +points\n❌ Wrong = -points'
		),

	presenterRaceTitle: z.string().default('Live Race Progress'),
	presenterWaitingMd: z.string().default('Waiting for round to start...'),
	timeRemainingLabel: z.string().default('Time Remaining'),

	// Game parameters
	minBubblesPerRound: z.number().default(4),
	maxBubblesPerRound: z.number().default(10),
	initialCorrectCount: z.number().default(4),
	initialIncorrectCount: z.number().default(2),
	difficultyCorrectionIncrement: z.number().default(1),
	difficultyIncorrectIncrement: z.number().default(1),
	maxBubblesTotal: z.number().default(10),

	correctPoints: z.number().default(100),
	incorrectPointsPenalty: z.number().default(50),
	timePerRoundSeconds: z.number().default(30),

	// Visual parameters
	bubbleRadius: z.number().default(40),
	targetBubbleRadius: z.number().default(90),
	bubbleSpacing: z.number().default(150)
});

export type Config = z.infer<typeof schema>;
