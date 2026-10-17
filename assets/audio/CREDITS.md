# Audio sources

The sourced music and downloaded effects below are released under **CC0 1.0**:
https://creativecommons.org/publicdomain/zero/1.0/
Commercial use, redistribution and adaptation are permitted.

## Previous battle theme (retained source, no longer selected)

- Juhani Junkala / SubspaceAudio — **Level 3**, *Retro Game Music Pack*
  (published as *5 Chiptunes (Action)*).
- Source: https://opengameart.org/content/5-chiptunes-action
- Original archive: https://opengameart.org/sites/default/files/5%20Action%20Chiptunes%20By%20Juhani%20Junkala.zip
- Creator's CC0 statement: `Juhani-Junkala-INFO.txt` (included unchanged).
- Used as `battle-chiptune.mp3`, converted from the complete seamlessly looping
  WAV to 128 kbps MP3. Music itself has not been shortened or recomposed.

## Zerdia town theme

- cynicmusic — **Town Theme RPG** (CC0).
- Source and CC0 declaration: https://opengameart.org/content/town-theme-rpg
- Original file: https://opengameart.org/sites/default/files/TownTheme.mp3
- Creator: https://cynicmusic.com / https://pixelsphere.org
- `zerdia-town.mp3`: the first 48 seconds of the source, with a 1.5-second
  overlap between the ending and beginning, producing a continuous 46.5-second
  loop. Converted to stereo 128 kbps MP3.

## Physical weapon effects

- Kenney Vleugels / Kenney — **RPG Audio**, CC0.
- Source: https://kenney.nl/assets/rpg-audio
- Original license: `Kenney-RPG-License.txt` (included unchanged).
- `combat/sword.mp3`: artisticdude **RPG Sound Pack**, `battle/swing3.wav`
  layered with `battle/sword-unsheathe3.wav`; leading silence removed, treble
  boosted and a short metal tail mixed in. The pack is CC0; source:
  https://opengameart.org/content/rpg-sound-pack
- `combat/parry.mp3`: `metalPot2.ogg`.
- `combat/arrow.mp3`: `knifeSlice.ogg` (shortened/pitched in playback as a projectile whoosh).
- `combat/arrow-hit.mp3`: `chop.ogg` and `clothBelt2.ogg`, plus artisticdude
  `battle/sword-unsheathe5.wav`. The initial bright click precedes the deeper
  penetration/body layer by 18 milliseconds; the total effect is about 0.2 seconds.
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

- trazzz123 — **CC0 Deep Monster Roar**, CC0.
- Source and CC0 declaration: https://opengameart.org/content/cc0-deep-monster-roar
- Original file: https://opengameart.org/sites/default/files/monster_roar.wav
- `combat/demon.mp3`: 2.55 seconds starting at 0.1 seconds, with high-pass,
  treble lift, mild compression and a fading tail. Converted to 128 kbps MP3.
  Full roar at the ambush, one-second extract during subsequent attacks.

## Journey theme supplied by the project owner

`adventure-across-the-kingdom.mp3` is the user's supplied
**Adventure Across the Kingdom**. Its original bytes are preserved.
The CC0 statements above apply only to the separately sourced music/effects.

## Opening, battle and Greenstoa music supplied by the project owner

- **Pixel Memories** (`pixel-memories.mp3`): the supplied original MP3, used
  for the opening narration and, by the owner's request, Greenstoa music. These
  two scene players share the same source file; the opening fade/stop behavior
  is preserved.
- **魔界突破戦** (`makai-toppa-sen.mp3`): the supplied original MP3, used for
  battle. Pixel Memories starts in Greenstoa after the Mother Tree cinematic,
  including the gate, grove and library. Battle temporarily takes over, then
  the Greenstoa theme resumes.
- Both supplied files are preserved byte-for-byte. No CC0 license is asserted
  for these supplied tracks.

The rogue's comic three-note sob, dialogue blips, UI tones, footsteps and environmental beds are
synthesized locally in `JS/audio.js`.
