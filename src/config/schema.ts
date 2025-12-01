import { z } from 'zod/v4';

export const schema = z.object({
	// translations
	title: z.string().default('Bubble Merge'),

	gameLobbyMd: z
		.string()
		.default(
			'# Waiting for game to start...\nThe game will start once the host presses the start button.'
		),
	connectionsMd: z.string().default('# Connections example'),
	sharedStateMd: z.string().default('# Shared State example'),

	players: z.string().default('Players'),
	timeElapsed: z.string().default('Time elapsed'),
	startButton: z.string().default('Start Game'),
	stopButton: z.string().default('Stop Game'),
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
	createPuzzleButton: z.string().default('Create Puzzle'),
	generateWithAIButton: z.string().default('Generate with AI'),
	generatingAI: z.string().default('Generating puzzle...'),
	aiGenerationError: z
		.string()
		.default('Failed to generate puzzle. Try again.'),

	startRoundButton: z.string().default('Start Round'),
	nextRoundButton: z.string().default('Next Round'),
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
	waitingForNextRoundMd: z
		.string()
		.default('Waiting for host to start the next round...'),
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
	bubbleSpacing: z.number().default(150),

	// Audio
	correctPopVolume: z.number().default(0.6),
	incorrectBounceVolume: z.number().default(0.4),
	levelCompleteVolume: z.number().default(0.8)
});

export type Config = z.infer<typeof schema>;
