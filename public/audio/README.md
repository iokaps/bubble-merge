# Audio Files for Bubble Merge

This directory contains sound effects for the Bubble Merge game.

**Status**: ✅ Working audio files installed from `ion-sound` library

## Installed Files

### 1. `pop-correct.mp3` ✅ (11.8 KB)

- **Purpose**: Played when a correct bubble is absorbed by the target
- **Source**: `ion-sound` library (`pop_cork.mp3`)
- **Style**: Cork pop sound - satisfying and pleasant
- **Volume**: Configured at 0.6 (60%) by default

### 2. `bounce-incorrect.mp3` ✅ (10.4 KB)

- **Purpose**: Played when an incorrect bubble bounces off the target
- **Source**: `ion-sound` library (`button_tiny.mp3`)
- **Style**: Small click/thud - subtle error indicator
- **Volume**: Configured at 0.4 (40%) by default

### 3. `level-complete.mp3` ✅ (31.5 KB)

- **Purpose**: Played when player completes a round (all 4 correct bubbles absorbed)
- **Source**: `ion-sound` library (`bell_ring.mp3`)
- **Style**: Bell ring - celebratory and clear
- **Volume**: Configured at 0.8 (80%) by default

## Implementation Details

Audio files are preloaded via `KmAudioProvider` in `app.player.tsx`:

\`\`\`tsx
<KmAudioProvider
preloadAudioUrls={[
'/audio/pop-correct.mp3',
'/audio/bounce-incorrect.mp3',
'/audio/level-complete.mp3'
]}

>   <App />
> </KmAudioProvider>
> \`\`\`

## Audio Fallback System

The game includes a **dual audio system**:

1. **Primary**: Loads audio files from `public/audio/` (installed ✅)
2. **Fallback**: If audio files fail to load, synthesized sounds are generated using Web Audio API (see `src/utils/synth-audio.ts`)

This ensures audio always works, even if files are missing or fail to load.

## License Requirements

Ensure any audio files used comply with:

- Open-source licensing (CC0, CC-BY, etc.) for commercial use
- Proper attribution if required by license
- Include license file if needed

## 🎵 Quick Download Links

### Option 1: Freesound.org (Free, CC-Licensed)

**For pop-correct.mp3:**

- [Bubble Pop 1](https://freesound.org/people/InspectorJ/sounds/411642/) - Clean bubble pop
- [Bubble Pop 2](https://freesound.org/people/deleted_user_7146007/sounds/383981/) - Satisfying pop
- [Search "bubble pop"](https://freesound.org/search/?q=bubble+pop&f=&s=score+desc&advanced=0&g=1)

**For bounce-incorrect.mp3:**

- [Rubber Bounce](https://freesound.org/people/InspectorJ/sounds/410803/) - Soft bounce
- [Thud Sound](https://freesound.org/people/RandomationPictures/sounds/138481/) - Dull thud
- [Search "soft bounce"](https://freesound.org/search/?q=soft+bounce&f=&s=score+desc&advanced=0&g=1)

**For level-complete.mp3:**

- [Victory Fanfare](https://freesound.org/people/LittleRobotSoundFactory/sounds/270333/) - Short victory
- [Success Sound](https://freesound.org/people/unadamlar/sounds/341985/) - Achievement unlock
- [Search "victory fanfare"](https://freesound.org/search/?q=victory+fanfare&f=&s=score+desc&advanced=0&g=1)

### Option 2: AI Generation (Easiest)

**ElevenLabs Sound Effects**: https://elevenlabs.io/sound-effects

1. Prompt: "Satisfying bubble pop sound effect, 0.3 seconds" → save as `pop-correct.mp3`
2. Prompt: "Soft rubber bounce thud, 0.2 seconds" → save as `bounce-incorrect.mp3`
3. Prompt: "Triumphant victory fanfare, 2 seconds" → save as `level-complete.mp3`

### Option 3: Other Free Resources

- **Mixkit.co**: https://mixkit.co/free-sound-effects/game/
- **Zapsplat.com**: https://www.zapsplat.com/sound-effect-categories/
- **Pixabay Audio**: https://pixabay.com/sound-effects/

## 📥 How to Add Real Audio

1. Download audio files from links above
2. Rename them to match exactly: `pop-correct.mp3`, `bounce-incorrect.mp3`, `level-complete.mp3`
3. Replace the placeholder files in this directory
4. Test by running `npm run dev` and playing the game

## Recommended Resources

- **Freesound.org**: Large library of CC-licensed sound effects
- **Zapsplat.com**: Free sound effects (registration required)
- **ElevenLabs**: AI-generated sound effects
- **Uppbeat**: Royalty-free audio (music focus)

## Volume Configuration

Adjust volumes in `default.config.yaml`:

\`\`\`yaml
correctPopVolume: 0.6
incorrectBounceVolume: 0.4
levelCompleteVolume: 0.8
\`\`\`
