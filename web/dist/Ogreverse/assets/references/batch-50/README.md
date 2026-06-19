# Canon Goblin 50 Front/Back Reference Sheets

This folder contains the first production-quality asset batch using the supplied roster names.

## Source Data

- Manifest: `goblin-batch-50.json`
- Supplied roster notes: `../supplied-roster-082-151.md`

## Sheets

Each PNG sheet has 5 rows. Each row shows the same creature as:

- left: front 3/4 battle view
- right: matching back battle view

The sheets intentionally have no labels on the artwork so the sprites can be cropped cleanly.

## Row Map

- `goblin-canon-sheet-01.png`: Pocketrex, Greedog, Goblinix, Trickmaw, Sneakog
- `goblin-canon-sheet-02.png`: Stabzar, Greedclaw, Gobblezar, Stabrex, Picklin
- `goblin-canon-sheet-03.png`: Mischrex, Sneakblast, Gobmon, Trickhide, Sneakmaw
- `goblin-canon-sheet-04.png`: Greedhide, Pocketclaw, Mischog, Tricklin, Gobbleon
- `goblin-canon-sheet-05.png`: Greedmaw, Stablin, Sneakzar, Trickgob, Gobbleclaw
- `goblin-canon-sheet-06.png`: Pocketblast, Greedogre, Mischmaw, Goblinhide, Pickrex
- `goblin-canon-sheet-07.png`: Stabmon, Sneaklin, Trickog, Greedblast, Gobzar
- `goblin-canon-sheet-08.png`: Stabhide, Pocketmaw, Mischblast, Sneakrex, Trickzar
- `goblin-canon-sheet-09.png`: Greedclaw single variant, Gobblehide, Stabog, Pickmaw, Mischzar
- `goblin-canon-sheet-10.png`: Gobmon single variant, Sneakhide, Trickrex, Greedmon, Gobblemaw

## Cropped Game Assets

This batch has been cropped and wired into the game as:

- `assets/sprites/{assetId}_front.png`
- `assets/sprites/{assetId}_back.png`
- `assets/icons/{assetId}.png`

The live game roster overrides `GBL001` through `GBL050` with these supplied Goblin names, types, evolution links, flavor text, and sprite assets.
