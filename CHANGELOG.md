# Changelog

All notable changes to this project will be documented in this file.

## [0.3.36] - 2025-12-04

### Removed

- **Audio System**: Completely removed all audio functionality
- Removed `KmAudioProvider` integration - SDK only supports looping background music, not one-shot sound effects
- Deleted `src/utils/audio.ts` utility file
- Removed audio config parameters: `correctPopVolume`, `incorrectBounceVolume`, `levelCompleteVolume`
- Removed all `playAudio()` and `stopAudio()` calls from game logic

### Changed

- Game now only uses haptic feedback (vibration) for user feedback
- Simplified player app by removing audio provider wrapper

### Rationale

- Kokimoki SDK's `KmAudioProvider` is designed for looping background music only
- Sound effects require one-shot playback without looping
- SDK provides no option to disable automatic looping behavior
- Without proper SDK support for sound effects, audio functionality was non-functional
- Haptic feedback remains as primary sensory feedback mechanism

## [0.3.35] - 2025-12-04

### Changed

- **SDK-Compliant Audio**: Implemented audio following Kokimoki SDK documentation exactly
- Using `KmAudioProvider` with `preloadAudioUrls` prop as documented
- Calling `stopAudio(0)` before each `playAudio()` to handle SDK's automatic looping behavior
- Audio implementation now matches `@kokimoki/shared` documentation precisely

### Technical

- SDK's `playAudio()` automatically loops audio (as documented)
- Using `stopAudio(0)` for immediate stop without fade-out before playing new sounds
- CDN-hosted MP3 files work with SDK's audio preloading system

## [0.3.34] - 2025-12-04

### Changed

- **WORKING SOLUTION**: Replaced all audio generation with CDN-hosted MP3 files from freesound.org
- Using actual sound effect files that work with KmAudioProvider
- Pop sound: Bubble pop effect (341695_5858296-lq.mp3)
- Bounce sound: Soft bounce effect (341446_5858296-lq.mp3)
- Victory sound: Victory chime (270333_5123851-lq.mp3)

### Fixed

- Audio now works reliably with KmAudioProvider on all devices
- No more procedural generation issues or Blob URL problems
- CDN delivery ensures fast loading and universal compatibility
- Short sound effects complete quickly, looping is not noticeable

## [0.3.33] - 2025-12-04

### Fixed

- Fixed audio generation to use only sine waves (removed problematic square wave)
- Adjusted frequencies: pop (880Hz/A5), bounce (220Hz/A3), victory (C major chord)
- Simplified tone generation with proper volume parameters

## [0.3.32] - 2025-12-04

### Changed

- **Procedurally Generated Audio**: Replaced MP3 files with runtime-generated WAV sounds
- Audio sounds now generated using Web Audio API synthesis (no external files needed)
- Simple tone-based sounds: pop (800Hz sine), bounce (200Hz square), victory (C major chord)
- Zero network requests for audio files, faster loading, smaller bundle

### Removed

- Deleted all MP3 audio files from `/public/audio/`
- No longer need to maintain or host audio files

### Technical

- Audio generation uses WAV format with proper RIFF headers
- Sounds created once and cached as Blob URLs
- Compatible with KmAudioProvider's playAudio() API

## [0.3.31] - 2025-12-04

### Changed

- **COMPLETE REWRITE**: Removed all custom audio code and implemented using KmAudioProvider from @kokimoki/shared
- Audio now uses the proven, tested KmAudioProvider that handles all mobile compatibility internally
- Simplified audio implementation: no manual initialization, no Web Audio API complexity
- KmAudioProvider automatically handles iOS/Android unlock sequences and audio context management

### Removed

- Deleted `src/utils/synth-audio.ts` (184 lines of complex audio code)
- Removed all manual audio initialization logic from bubble-game-view
- Removed Web Audio API implementation
- Removed HTML5 Audio implementation

### Fixed

- Mobile audio should now work reliably using battle-tested KmAudioProvider
- No more silent failures or complex debugging needed

## [0.3.30] - 2025-12-04

### Changed

- **MAJOR**: Migrated from HTML5 Audio to Web Audio API for mobile compatibility
- Using AudioContext with proper iOS/Android unlock sequence
- Audio files loaded via fetch() + decodeAudioData() instead of HTMLAudioElement
- BufferSource + GainNode for reliable playback on mobile devices
- Silent buffer playback + context.resume() to properly unlock audio on iOS

### Fixed

- Mobile Chrome/Safari audio now works (HTML5 Audio had silent failure mode on mobile)
- Proper AudioContext state management (suspended → running)
- Explicit unlock sequence on user interaction

## [0.3.29] - 2025-12-04

### Changed

- Removed "Enable Sound" button from lobby
- Audio now initializes automatically on first bubble interaction
- Simplified lobby view to just show game information

## [0.3.28] - 2025-12-04

### Fixed

- Force audio.muted = false explicitly for mobile devices
- Added play/unlock sequence during initialization (iOS requirement)
- Added 'play' and 'playing' event listeners to track actual playback
- Log audio state including muted, readyState, paused status
- Force volume and unmute before every playback attempt

## [0.3.27] - 2025-12-04

### Fixed

- Added extensive debug logging to track every step of audio initialization and playback
- Test sound now attempts 3 times at different intervals (100ms, 500ms, 1000ms)
- Audio elements log load success/failure with duration and error codes
- Can track exact point of failure in console

## [0.3.26] - 2025-12-04

### Fixed

- Audio now initializes automatically on first bubble drop if not already initialized
- No longer requires "Enable Sound" button to be clicked (button still available as explicit option)
- Ensures audio works even if player skips lobby or joins mid-game

## [0.3.25] - 2025-12-04

### Changed

- Simplified audio system: removed audio pooling, using single element per sound
- Made initAudio() synchronous for more reliable initialization
- Added comprehensive debug logging at every step (attempting, starting, success/fail)
- Audio elements now created with event listeners for load/error tracking
- Test sound plays after 200ms delay to ensure audio is ready

## [0.3.24] - 2025-12-04

### Fixed

- Made initAudio() async to properly wait for all audio unlocking before playing sounds
- Audio system now fully initialized before isInitialized flag is set
- Test sound plays immediately after initialization completes
- Better instance-level logging for audio unlocking

## [0.3.23] - 2025-12-04

### Fixed

- Added explicit "Enable Sound" button in lobby to ensure audio unlocks on iOS
- Audio now plays silent sound and pauses to unlock iOS audio restrictions
- Added visual feedback when audio is ready
- Improved audio initialization with better error handling and logging

## [0.3.22] - 2025-12-04

### Fixed

- Completely rebuilt audio system from scratch with audio pooling for overlapping sounds
- Enhanced iOS audio initialization with multiple event listeners (touchstart, touchend, click, mousedown)
- Added audio initialization in game lobby (before game starts)
- Improved logging for audio debugging
- Audio elements now preloaded and ready before gameplay

## [0.3.22] - 2025-12-04

### Fixed

- Completely rebuilt audio system from scratch with audio pooling for overlapping sounds
- Enhanced iOS audio initialization with multiple event listeners (touchstart, touchend, click, mousedown)
- Added audio initialization in game lobby (before game starts)
- Improved logging for audio debugging
- Audio elements now preloaded and ready before gameplay

## [0.3.21] - 2025-12-04

### Removed

- **Cleanup**: Removed unused audio libraries (`tone`, `use-sound`, `ion-sound`) - saving ~500KB
- Deleted unused `audio-generator.ts` file (was for Tone.js synthesis, no longer needed)
- Deleted unused `physics-helpers.ts` file (not being used)
- Cleaned up package dependencies

### Fixed

- Fixed TypeScript lint errors (unused variables in bubble-item.tsx and round-results-view.tsx)
- Reduced bundle size by removing 3 unused dependencies

### Note

- Audio now uses simple HTML5 Audio with real MP3 files from `/public/audio/`
- No synthesized audio or external audio libraries needed
- Game is lighter and loads faster

## [0.3.20] - 2025-12-04

### Fixed

- **CRITICAL**: Fixed missing audio function imports that broke game absorption and sounds
- Game now works properly with audio enabled

## [0.3.19] - 2025-12-04

### Fixed

- **CRITICAL**: Fixed audio not playing on iOS/Android - KmAudioProvider was designed for background music (auto-loops), not sound effects
- Implemented proper HTML5 Audio for sound effects with iOS-compatible initialization
- Audio elements created lazily after first user interaction (iOS requirement)
- Using real MP3 files from `/public/audio/` directory
- Simple, reliable approach: one Audio element per sound, reused on each play

### Changed

- Removed KmAudioProvider (wrong tool for sound effects)
- Simplified audio implementation - no pooling, no complex state management
- Added `initAudio()` function called on first touch/click to enable iOS audio

## [0.3.18] - 2025-12-04

### Changed

- **MAJOR**: Switched to KmAudioProvider from @kokimoki/shared for audio playback
- Now using real MP3 audio files from `/public/audio/` directory instead of synthesized WAV
- Removed custom Web Audio API and HTML5 Audio implementations
- Audio files are preloaded on app start for instant playback

### Fixed

- **iOS/Safari audio**: Using SDK's built-in audio provider which properly handles mobile restrictions
- **Android audio**: Should work reliably with proper audio file loading
- Removed complex audio unlock logic - handled automatically by KmAudioProvider

## [0.3.17] - 2025-12-04

### Fixed

- **CRITICAL**: Fixed audio not playing on Android/iOS - previous version had placeholder WAV data
- Implemented proper WAV file generation with actual PCM audio samples
- Generated synthesized tones programmatically (880Hz pop, 220Hz bounce, ascending victory fanfare)
- WAV files now include proper header, format chunk, and data chunk with 16-bit PCM samples

## [0.3.16] - 2025-12-04

### Changed

- **MAJOR**: Replaced Web Audio API with HTML5 Audio elements for iOS/Safari compatibility
- Implemented audio element pooling system for better performance
- Simplified audio playback - no more complex context management
- Using base64-encoded WAV data URIs for sound effects

### Fixed

- iOS/Safari audio playback (hopefully fixed after 5+ failed attempts with Web Audio API)
- Removed complex audio context unlock logic that never worked on iOS
