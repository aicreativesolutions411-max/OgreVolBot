# Per-tool background images

Drop one image here per tool to give that tool its own unique background.
The app layers a dark/green overlay on top so the controls stay readable —
you don't need to pre-darken the image. Landscape ~1600x1000 (jpg or png)
looks best; keep the busy/subject area toward the RIGHT or TOP so the
left/center controls stay clean.

Exact filenames the CSS looks for (lowercase, these names exactly):

| Tool                    | File              |
|-------------------------|-------------------|
| Slime Swap              | `swap.jpg`        |
| SlimeBot / Volume       | `volume.jpg`      |
| Bundle                  | `bundle.jpg`      |
| Ogre A.I.               | `ogre-ai.jpg`     |
| Launch Snipe            | `snipe.jpg`       |
| Pump Launch (Launch)    | `launch.jpg`      |
| Tek hub                 | `tek.jpg`         |

If a file is missing, the tool falls back to the default ogre background, so
nothing breaks. `.png` also works — if you use png, tell me and I'll point
that tool's rule at the `.png` name.
