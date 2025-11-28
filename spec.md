# Bubble Merge - Game Specification

## Overview

**Bubble Merge** is a physics-based multiplayer puzzle game where players compete in real-time to merge small bubbles into a large center bubble. Players drag and fling bubbles using touch/mouse gestures. Correct bubbles get absorbed with satisfying feedback; incorrect ones bounce off. All players race on the same puzzle simultaneously with progressive difficulty across multiple rounds.

## Game Modes

### Player Mode (Mobile-First)

- **Primary Interface**: Touch-optimized gameplay on phones/tablets
- **Interactions**: Drag-to-fling bubbles with momentum physics
- **View States**:
  - `lobby` - Waiting for host to start game
  - `game-setup` - Optional setup participation (if host enables)
  - `bubble-game` - Active gameplay with physics canvas
  - `round-results` - View standings and wait for next round
- **Features**: Audio feedback, haptic vibrations, real-time progress tracking

### Host Mode (Desktop)

- **Primary Interface**: Game control dashboard on laptop/tablet
- **Responsibilities**:
  - Create game content (manual input or AI generation)
  - Start/stop rounds
  - Manage difficulty progression
  - Monitor all players' progress
- **Content Creation Options**:
  - **Manual Mode**: Enter target category and bubble labels via text inputs
  - **AI Mode**: Provide theme (e.g., "Breaking Bad"), auto-generate via `kmClient.ai.generateText()`
- **Controls**: Start Round, Next Round, Reset Game, Content Setup Toggle

### Presenter Mode (Large Screen)

- **Primary Interface**: TV/projector display for spectators
- **Display**: Real-time race leaderboard showing all players' progress
- **Updates**: Live absorption counts, completion times, current rankings
- **Visual**: Large bubbles representation, player names, progress bars

## Core Mechanics

### Physics System (Matter.js)

**Engine Configuration**:

```javascript
{
  gravity: { x: 0, y: 0.3 }, // Soft downward pull
  enableSleeping: false,
  constraintIterations: 2,
  positionIterations: 6,
  velocityIterations: 4
}
```

**Boundaries**:

- Container walls (top, left, right, bottom) with restitution `0.6` (bouncy)
- Walls prevent bubbles from leaving play area

**Bubble Physics**:

- Small bubbles: Circle bodies, radius `30-40px`, density `0.001`, restitution `0.7`, friction `0.05`
- Target bubble: Static circle body (doesn't move), radius varies by round
- Collision detection via Matter.js event listeners

**Drag-to-Fling Mechanic**:

1. Player touches/clicks bubble → record start position
2. Drag → bubble follows finger with spring constraint
3. Release → calculate velocity vector from drag distance + speed
4. Apply impulse to Matter body: `Body.applyForce(body, position, force)`
5. Bubble flies with momentum, bounces off walls, collides with target

### Bubble Types

**Target Bubble (Center)**:

- Large circle in screen center
- Contains category label (e.g., "Breaking Bad", "JavaScript", "Solar System")
- Static position (doesn't move)
- Grows slightly with each absorption (scale: `1.0` → `1.2` → `1.4` → `1.6`)
- Glows/pulses when collision detected

**Small Bubbles (Floating)**:

- 4 correct bubbles (match target category)
- 2 incorrect bubbles (decoy/distractor)
- Each has unique label (e.g., "Walter White", "Tony Soprano")
- Spawn in random positions around container edges
- Gentle floating motion (small random forces applied periodically)

### Collision & Absorption Rules

**Collision Detection**:

- Monitor Matter.js `collisionStart` events
- Check if small bubble touches target bubble (distance < sum of radii)
- Calculate collision velocity to determine impact strength

**Correct Bubble**:

1. Collision detected → validate `isCorrect = true`
2. Play "pop" sound effect (`/audio/pop-correct.mp3`, volume `0.6`)
3. Trigger haptic feedback: `navigator.vibrate(100)`
4. Visual: Small bubble scales down with spring animation (Motion: `scale: 0`, type: `spring`)
5. Target bubble grows: `scale += 0.1`
6. Update state: `playerProgress.absorbedCount++`, `bubble.absorbed = true`
7. Remove Matter body from engine
8. Check completion: if `absorbedCount === 4`, trigger level complete

**Incorrect Bubble**:

1. Collision detected → validate `isCorrect = false`
2. Play "bounce" sound effect (`/audio/bounce-incorrect.mp3`, volume `0.4`)
3. Trigger haptic feedback: `navigator.vibrate([50, 30, 50])`
4. Visual: Bubble flashes red, bounces back with increased restitution
5. Apply repulsion force away from target
6. Update state: `playerProgress.incorrectAttempts++`
7. Bubble remains in play (can try again)

**Level Complete**:

1. All 4 correct bubbles absorbed
2. Record completion time: `completionTime = kmClient.serverTimestamp() - roundStartTime`
3. Calculate accuracy: `accuracy = 4 / (4 + incorrectAttempts)`
4. Play victory sound (`/audio/level-complete.mp3`)
5. Trigger massive confetti: `triggerConfetti({ preset: 'massive' })`
6. Update global leaderboard: `kmClient.leaderboard.addScore(clientId, score, round)`
7. Navigate to results view: `playerActions.setCurrentView('round-results')`

## Multiplayer Race Mode

### Synchronization

**Shared State** (via `globalStore`):

- Same puzzle for all players (target + bubbles identical)
- Round number, difficulty config, start timestamp
- All players' progress tracked in `playerProgress: Record<clientId, ProgressData>`

**Individual State** (via `playerStore`):

- Current view (lobby, game, results)
- Local bubble positions/velocities (not synced - physics runs locally)
- Player name

**Race Mechanics**:

- Host clicks "Start Round" → `globalActions.startRound()`
- All players' games begin simultaneously (synced via `roundStartTime`)
- Each player interacts with their own physics simulation (local)
- Progress tracked globally (absorption counts, completion time)
- First to complete 4 correct bubbles wins the round
- Late completers still tracked for participation points

### Leaderboard & Scoring

**Per-Round Scoring**:

```javascript
baseScore = 1000;
timeBonus = Math.max(0, 500 - completionTime / 100); // Faster = higher
accuracyMultiplier = 4 / (4 + incorrectAttempts); // Fewer mistakes = higher
finalScore = (baseScore + timeBonus) * accuracyMultiplier;
```

**Rankings**:

- Use `kmClient.leaderboard` to store scores with tags: `[round-${roundNumber}]`
- Display top 3 finishers with `KmPodiumTable` component
- Show completion times in `KmTimeCountdown` format

**Persistent Leaderboard**:

- Track best scores across all rounds
- Tag scores with metadata: `{ round: number, accuracy: number, time: number }`

## Difficulty Progression

### Round System

**Linear Progression**:

- Round 1: 4 correct + 2 incorrect bubbles
- Round 2: 5 correct + 3 incorrect bubbles
- Round 3: 6 correct + 4 incorrect bubbles
- Round 4+: Keep adding +1 correct, +1 incorrect per round

**Difficulty Multipliers**:

```javascript
// Calculate for round N (1-indexed)
roundConfig = {
  correctCount: 4 + (roundNumber - 1),
  incorrectCount: 2 + (roundNumber - 1),
  speedMultiplier: 1.0 + (roundNumber - 1) * 0.3, // Bubbles float faster
  targetScale: 1.0 - (roundNumber - 1) * 0.1, // Target gets smaller
  gravityY: 0.3 + (roundNumber - 1) * 0.1 // Gravity increases slightly
};
```

**Round Caps**:

- Max bubbles on screen: `12 total` (8 correct + 4 incorrect)
- Max speed multiplier: `2.2x`
- Min target scale: `0.5x`
- After max difficulty, maintain settings for subsequent rounds

### Progression Flow

1. **Round Start**:
   - Host clicks "Start Round" (or auto-starts after results countdown)
   - `globalActions.startRound()` → generate new puzzle with difficulty config
   - All players navigate to `bubble-game` view
   - Physics engines initialize locally

2. **During Round**:
   - Players fling bubbles independently
   - Global state tracks each player's progress
   - Presenter shows live race standings

3. **Round Complete**:
   - All players finish (or timeout after 180 seconds)
   - Display results with podium
   - Host clicks "Next Round" → increment difficulty → restart

4. **Game Reset**:
   - Host clicks "New Game" → reset to Round 1, clear leaderboard

## Content Generation

### Manual Mode

**Host Interface**:

- Text input: "Target Category" (e.g., "Breaking Bad")
- Text inputs: "Correct Bubble 1-4" (e.g., "Walter White", "Jesse Pinkman", "Better Call Saul", "Blue Crystal")
- Text inputs: "Incorrect Bubble 1-2" (e.g., "Tony Soprano", "Don Draper")
- Button: "Create Puzzle" → validates inputs → `setupGameActions.createPuzzle()`

**Validation**:

- All fields required (no empty strings)
- Each bubble label must be unique (no duplicates)
- Character limits: Category (50 chars), Bubbles (30 chars each)

### AI Mode

**Host Interface**:

- Text input: "Theme or Topic" (e.g., "Breaking Bad", "Planets", "React Hooks")
- Button: "Generate with AI" → `setupGameActions.generatePuzzleWithAI(theme)`

**AI Prompt**:

```javascript
const prompt = `Generate a puzzle for a bubble merge game.

Theme: ${theme}

Provide:
1. A target category name (2-4 words)
2. ${correctCount} items that belong to this category
3. ${incorrectCount} items that do NOT belong (distractors)

Make distractors plausible but clearly incorrect.

Format as JSON:
{
  "targetCategory": "Category Name",
  "correctBubbles": ["Item 1", "Item 2", ...],
  "incorrectBubbles": ["Distractor 1", "Distractor 2", ...]
}`;

const result = await kmClient.ai.generateText(prompt, {
  model: 'gpt-4o',
  response_format: { type: 'json_object' }
});
```

**Error Handling**:

- Show loading spinner during generation
- Validate AI response structure
- Fallback to manual mode if AI fails
- Display preview before confirming

## State Architecture

### Global Store (Shared)

```typescript
interface GlobalState {
  // Connection management
  controllerConnectionId: string;
  started: boolean;
  startTimestamp: number;
  players: Record<string, { name: string }>;

  // Game state
  gamePhase: 'setup' | 'playing' | 'results' | 'idle';
  currentRound: number;
  roundStartTime: number;

  // Round configuration
  roundConfig: {
    correctCount: number;
    incorrectCount: number;
    speedMultiplier: number;
    targetScale: number;
    gravityY: number;
  };

  // Puzzle content
  targetBubble: {
    label: string;
    category: string;
  };
  bubbles: Array<{
    id: string;
    label: string;
    isCorrect: boolean;
  }>;

  // Player progress tracking
  playerProgress: Record<
    string,
    {
      absorbedCount: number;
      incorrectAttempts: number;
      completionTime: number | null; // null = not finished
      accuracy: number;
      score: number;
    }
  >;

  // Leaderboard (round winners)
  roundWinners: Array<{
    clientId: string;
    playerName: string;
    round: number;
    score: number;
    completionTime: number;
  }>;
}
```

### Player Store (Local)

```typescript
interface PlayerState {
  name: string;
  currentView:
    | 'lobby'
    | 'game-setup'
    | 'bubble-game'
    | 'round-results'
    | 'connections';

  // Local UI state
  setupMode: 'manual' | 'ai'; // Host only
}
```

## Audio & Haptics

### Sound Effects

**Required Files** (store in `/public/audio/`):

- `pop-correct.mp3` - Satisfying pop when correct bubble absorbed (~0.3s)
- `bounce-incorrect.mp3` - Dull thud when incorrect bubble bounces (~0.2s)
- `level-complete.mp3` - Victory fanfare when round completed (~2s)
- `ambient-loop.mp3` - Optional calming background music (looped)

**Integration**:

```tsx
// In app root
<KmAudioProvider
  preloadAudioUrls={[
    '/audio/pop-correct.mp3',
    '/audio/bounce-incorrect.mp3',
    '/audio/level-complete.mp3'
  ]}
>
  <App />
</KmAudioProvider>;

// In components
const { playAudio } = useKmAudioContext();

// On correct absorption
playAudio('/audio/pop-correct.mp3', 0.6);

// On incorrect bounce
playAudio('/audio/bounce-incorrect.mp3', 0.4);

// On level complete
playAudio('/audio/level-complete.mp3', 0.8);
```

### Haptic Feedback

**Web Vibration API**:

```typescript
// Check support
const supportsVibration = 'vibrate' in navigator;

// Success pattern
function vibrateSuccess() {
  if (supportsVibration) {
    navigator.vibrate(100); // Single 100ms pulse
  }
}

// Error pattern
function vibrateError() {
  if (supportsVibration) {
    navigator.vibrate([50, 30, 50]); // Double tap pattern
  }
}

// Victory pattern
function vibrateVictory() {
  if (supportsVibration) {
    navigator.vibrate([100, 50, 100, 50, 200]); // Celebration pattern
  }
}
```

## Visual Design

### Layout (Player Mode)

```
┌─────────────────────────────────┐
│ Header: "Bubble Merge"          │
│ Progress: 3/4 absorbed           │
├─────────────────────────────────┤
│                                  │
│         ╭───────╮                │
│         │Target │    ○ Bubble1   │
│    ○    │Bubble │                │
│ Bubble2 │ LARGE │    ○ Bubble4   │
│         │       │                │
│         ╰───────╯  ○ Bubble5     │
│   ○ Bubble3                      │
│                 ○ Bubble6        │
│                                  │
├─────────────────────────────────┤
│ Footer: Player Name              │
└─────────────────────────────────┘
```

### Colors & Styling

**Target Bubble**:

- Background: Gradient (`bg-gradient-to-br from-blue-400 to-purple-500`)
- Border: Thick white border (`border-4 border-white`)
- Shadow: Large glow (`shadow-2xl shadow-blue-500/50`)
- Text: White, bold, centered

**Small Bubbles**:

- Correct: Green gradient (`from-green-400 to-emerald-500`)
- Incorrect: Initially neutral (`from-gray-300 to-gray-400`)
- Incorrect after bounce: Red flash (`from-red-400 to-red-600`)
- Border: White (`border-2 border-white`)
- Text: Dark, centered, small font

**Animations**:

- Idle float: Gentle up/down motion (CSS `animate-bounce` slowed)
- Absorption: Scale down to 0 with spring (`type: 'spring', stiffness: 300`)
- Bounce off: Scale up briefly (1.2x) then back to 1
- Target growth: Scale increases smoothly (`transition: { duration: 0.5 }`)

### Confetti

**On Level Complete**:

```typescript
triggerConfetti({
  preset: 'massive',
  duration: 5000, // 5 seconds
  colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
});
```

## Performance Considerations

### Matter.js Optimization

**Frame Rate**:

- Desktop: 60 FPS (`1000/60 = 16.67ms` per frame)
- Mobile: 60 FPS (modern devices support this)
- Update loop: `requestAnimationFrame` with delta time

**Engine Settings**:

```javascript
Engine.create({
  enableSleeping: false, // Keep bubbles always active
  constraintIterations: 2, // Lower = faster but less accurate
  positionIterations: 6, // Balance quality and performance
  velocityIterations: 4
});
```

**Bubble Limit**:

- Max 12 bubbles simultaneously (tested up to 15 without issues)
- Remove absorbed bubbles immediately from engine
- Use composite for grouping bodies

### React Rendering

**Optimization Strategies**:

- `React.memo()` for bubble components (only re-render on position change)
- `useCallback` for drag handlers (prevent recreation)
- Canvas rendering for Matter debug view (optional developer mode)
- Throttle state updates (update every 2-3 frames, not every frame)

## File Structure

```
src/
├── components/
│   └── bubble/
│       ├── bubble-item.tsx          # Draggable small bubble
│       ├── target-bubble.tsx        # Center target bubble
│       └── game-container.tsx       # Physics boundary container
├── hooks/
│   ├── useMatterPhysics.tsx         # Matter.js engine hook
│   └── useBubbleCollision.tsx       # Collision detection hook
├── state/
│   ├── stores/
│   │   ├── global-store.ts          # Add game state
│   │   └── player-store.ts          # Update view types
│   └── actions/
│       ├── bubble-game-actions.ts   # Gameplay actions
│       └── setup-game-actions.ts    # Content generation
├── views/
│   ├── game-setup-view.tsx          # Host content creation
│   ├── bubble-game-view.tsx         # Main gameplay
│   └── round-results-view.tsx       # Leaderboard and next round
├── utils/
│   ├── physics-helpers.ts           # Matter.js utilities
│   └── collision-detection.ts       # Bubble collision logic
└── config/
    └── schema.ts                    # Add game configuration
```

## Configuration Schema

**Key Config Values**:

- All button labels (Start Round, Next Round, etc.)
- Game instructions (markdown)
- Physics parameters (gravity, restitution, bubble sizes)
- Difficulty progression formulas
- Scoring formula parameters
- Audio volume defaults
- Round timeout duration

## Technical Dependencies

- **Matter.js**: Physics engine
- **Motion (Framer Motion)**: Animations and drag gestures
- **Kokimoki SDK**: State sync, AI, leaderboard
- **@kokimoki/shared**: Confetti, audio, time components
- **React**: UI framework
- **Valtio**: State management
- **TypeScript**: Type safety

## Future Enhancements (Out of Scope)

- Power-ups (slow motion, magnet, reveal correct bubbles)
- Team mode (2v2 races)
- Custom themes (upload images for bubbles)
- Replay system (watch top performers)
- Daily challenges with global leaderboard
- Accessibility mode (larger bubbles, colorblind-friendly colors)
