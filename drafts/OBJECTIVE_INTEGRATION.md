# Objective HUD integration draft

1. Draft only: no repository files have been modified, no browser tests have run.

2. Add JS/objective-guide.js before JS/game.js and CSS/objective-guide.css after existing scene/board styles in templates/index.html; replace the old p#game-objective with the aside markup.

3. Use local HEAD 729a324 as base, preserving Lucy/board changes; remote a2086dc was read solely to verify lore and progression.

4. Remove the unused const objective DOM reference. Replace old updateObjective() with objectiveGuide.update({active,inputLocked,phase,location,questAccepted,shopOrigin,fieldFlags}); call it at the start of drawWorld().

5. In start(), call objectiveGuide.reset(saved?.objectiveGuide); bind once with onSettingsChange:()=>saveProgress(); preserve updates during ready/unlock.

6. Include objectiveGuide:objectiveGuide.snapshot() in journeySave.write payload and getState(). Validate the OPTIONAL save property with objectiveGuide.valid, keeping legacy saves valid. Add optional-object validation without changing the mandatory legacy flags.

7. Munia first encounter: common briefing + questAccepted-dependent goal + close lines; after finishing, objectiveGuide.reveal(); save only after phase returns to free. On subsequent visits use a short greeting and finite chat choices.

8. Keep current-goal explanation as explicit repeatable help alongside the three topics, or leave its topic available after other topics are answered; finishing it explicitly reopens the tracker.

9. Quest menu: if tracker unlocked add a stable '목표 표시'/'목표 숨기기' action; do not remove existing quest details. Use objectiveGuide.dismiss() to hide it. Closing/reopening must persist through save and restore.

10. Preserve held movement sources when clicking HUD close. Do not clear keyboardMovement/touchMovement. Gate close actions to free state and restore canvas focus without invoking world interaction.

11. Before publication: split/root builds, mobile/desktop layout, complete-hide during ALL dialogue, board, vista, event, transitions, battle, item inspect, archive, shops; close/reopen persistence, old/new saves, no quest rewards or input duplication.

12. New/renamed NPC ids require extending the save whitelist and old-id migration; slot/placement awaits remaining references. Do not alter deployed branch during the reference batch.

The local base 729a324 is inaccessible; if it cannot be recovered, reimplement Lucy/notice-board changes from LOCAL_WORK_RECOVERY.md on remote a2086dc.
