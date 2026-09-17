# Follow-up tasks

## Migrate audio stack from expo-av to expo-audio (Expo SDK 57)

**Status:** Not started. Logged as a follow-up, not executed as part of the
background frequency bed wiring task.

**Context:** This repo currently targets Expo SDK 52 (`expo: ~52.0.0`,
`expo-av: ~15.0.2`, `react-native: 0.76.9`). Per `AGENTS.md`, new Expo work
should follow the SDK 57 docs (https://docs.expo.dev/versions/v57.0.0/), where
`expo-av` has been removed in favor of `expo-audio`. Upgrading in place would
require bumping Expo/React Native/React versions across the whole project
(SDK 52 -> 57 is a multi-major jump), which is a larger, higher-risk change
than the audio-bed feature itself, so it was deliberately deferred.

**What was done instead:** The three background frequency beds
(`frequency-bed-clear.mp3`, `frequency-bed-528.mp3`, `frequency-bed-deep.mp3`)
were wired using the existing `expo-av`-based pattern already used for voice
guidance in `src/audio.ts` / `src/sessionEngine.ts`, so the new feature is
consistent with the rest of the currently-installed SDK 52 codebase.

**When this is picked up, migrate:**
- `src/audio.ts` — voice playback (`Audio.Sound`) and the new background bed
  playback (`startBackgroundBed` / `stopBackgroundBed`) to `expo-audio`'s
  `createAudioPlayer` / `AudioPlayer` API (`loop`, `volume`, `play()`,
  `pause()`, `remove()`), plus `setAudioModeAsync` for background/silent-mode
  behavior.
- `src/sessionEngine.ts` — remove any remaining `expo-av` references.
- `package.json` — swap `expo-av` for `expo-audio`, and bump `expo`,
  `react-native`, `react`, `react-dom`, `expo-router`, and other SDK-linked
  packages to their SDK 57-compatible versions per the upgrade guide.
- `app.json` — review whether `expo-audio`'s config plugin
  (`enableBackgroundPlayback`, etc.) is needed for background audio session
  behavior on iOS, replacing the current manual `NSAudioSessionCategory`
  Info.plist entry if applicable.
