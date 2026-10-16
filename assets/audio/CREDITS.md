# Audio sources

The battle music and downloaded effects below are released under **CC0 1.0**:
https://creativecommons.org/publicdomain/zero/1.0/
Commercial use, redistribution and adaptation are permitted. These are original
publicly released assets, not music or samples taken from Undertale/Deltarune.

## Battle theme

- Juhani Junkala / SubspaceAudio — **Level 3**, *Retro Game Music Pack*
  (published as *5 Chiptunes (Action)*).
- Source: https://opengameart.org/content/5-chiptunes-action
- Original archive: https://opengameart.org/sites/default/files/5%20Action%20Chiptunes%20By%20Juhani%20Junkala.zip
- Creator's CC0 statement: `Juhani-Junkala-INFO.txt` (included unchanged).
- Used as `battle-chiptune.mp3`, converted from the complete seamlessly looping
  WAV to 128 kbps MP3. Music itself has not been shortened or recomposed.

## Physical weapon effects

- Kenney Vleugels / Kenney — **RPG Audio**, CC0.
- Source: https://kenney.nl/assets/rpg-audio
- Original license: `Kenney-RPG-License.txt` (included unchanged).
- `combat/sword.mp3`: `knifeSlice2.ogg`.
- `combat/parry.mp3`: `metalPot2.ogg`.
- `combat/arrow.mp3`: `knifeSlice.ogg` (shortened/pitched in playback as a projectile whoosh).
- `combat/arrow-hit.mp3`: `chop.ogg`.
- Converted to MP3, with leading/transient sections trimmed to align with the
  strike frames. The arrow whoosh ends before its 0.18-second impact cue.
  Mixed with short synthesized impact layers in game.

## Pixel magic effects

- Kenney Vleugels / Kenney — **Digital Audio**, CC0.
- Source: https://kenney.nl/assets/digital-audio
- Original license: `Kenney-Digital-License.txt` (included unchanged).
- `combat/hurt.mp3`: `lowDown.ogg`.
- `combat/charge.mp3`: `phaserUp7.ogg`.
- `combat/volley.mp3`: `zap2.ogg`.
- Converted to MP3; quieter than impacts so repeated waves do not mask the theme.

## Monster

- artisticdude — **RPG Sound Pack**, CC0.
- Source and CC0 declaration: https://opengameart.org/content/rpg-sound-pack
- Original archive: https://opengameart.org/sites/default/files/rpg_sound_pack.zip
- `combat/demon.mp3`: `NPC/gutteral beast/mnstr3.wav`.
- Leading silence removed, first 1.2 seconds encoded to MP3; lower playback pitch
  and a short synthesized low layer are applied in game.

## Journey theme supplied by the project owner

`adventure-across-the-kingdom.mp3` is the user's supplied
**Adventure Across the Kingdom**. Its original bytes are preserved.
The CC0 statements above apply only to the separately sourced battle assets.

All other dialogue blips, UI tones, footsteps and environmental beds are
synthesized locally in `JS/audio.js`.
