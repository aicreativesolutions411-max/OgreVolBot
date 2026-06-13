# CODEX TASK — Source + process FREE game audio for The Swamp

The game engine is already wired to auto-use real audio files when present and
fall back to synth when absent (Claude did this). Your job: get good
royalty-free / CC0 audio, process it, and drop it in the exact paths/names below.
No code editing — files only.

## Output paths + exact filenames
Put BOTH `.ogg` AND `.mp3` of each into `web/public/assets/slimewire/swamp/audio/`:

Ambient loop (the music bed):
- `swamp-ambient.ogg` + `swamp-ambient.mp3` — 30–60s SEAMLESS loop. Mood: dark
  night swamp + distant thunder rumbles, crickets/frogs, low ominous drone, soft
  water drips. Loud enough to set mood, calm enough to play under gameplay.

Short SFX (each <1s except boss; punchy, game-y):
- `throw.ogg/.mp3` — a slimeball whoosh/throw
- `catch.ogg/.mp3` — a satisfying squish + chime (success)
- `miss.ogg/.mp3` — a wet splat / fail thud
- `level.ogg/.mp3` — bright level-up / victory sting
- `tick.ogg/.mp3` — tiny UI step/blip (very short, quiet)
- `quest.ogg/.mp3` — quest-complete jingle
- `ui.ogg/.mp3` — soft button/tab click
- `boss.ogg/.mp3` — 1–2s monstrous ogre roar / boss-incoming hit (also reused for thunder)

## Where to get it (free / CC0 / permissive — verify license before use)
- kenney.nl assets (CC0) — "Impact Sounds", "RPG Audio", "UI Audio", "Music Jingles"
- opengameart.org (filter to CC0 / CC-BY)
- mixkit.co/free-sound-effects (Mixkit free license)
- freesound.org (CC0 only; needs account/API)
- Pixabay audio (Pixabay license)
Prefer CC0 so there's zero attribution burden. If any chosen file is CC-BY,
note the attribution in `web/public/assets/slimewire/swamp/audio/CREDITS.txt`.

## Processing (use ffmpeg)
- Trim silence, normalize loudness (e.g. `loudnorm`), keep sfx mono is fine.
- Ambient: make it loop seamlessly (crossfade the tail into the head, ~1s).
- Export each as OGG (libvorbis ~q4) and MP3 (~128k) at 44.1kHz.
- Keep files small (sfx a few KB–tens of KB; ambient under ~1MB).
- Example sfx convert:
  `ffmpeg -i in.wav -af "silenceremove=1:0:-50dB,loudnorm" -c:a libvorbis -q:a 4 catch.ogg`
  `ffmpeg -i in.wav -af "silenceremove=1:0:-50dB,loudnorm" -c:a libmp3lame -b:a 128k catch.mp3`
- Example seamless loop (crossfade tail→head):
  `ffmpeg -i amb.wav -filter_complex "[0]afade=t=in:st=0:d=1,afade=t=out:st=29:d=1" -t 30 -c:a libvorbis -q:a 4 swamp-ambient.ogg`

## Finish
- Run `npm run build:web` so files land in `web/dist/` too.
- DO NOT edit `web/public/swamp.html` or any `.js` (Claude owns those).
- Commit "Codex: free swamp audio (ambient + sfx)" and push. Verify each file
  actually plays and is the right format before committing.
