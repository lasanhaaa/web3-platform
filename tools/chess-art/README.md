# Chess art in the badge style

The Academy art (`public/assets/chess-{pawn,bishop,queen,king}.webp`) is rendered with the badge engine's own
studio lighting, so the pieces share the badges' metal: steel satin with chrome linework, one glowing detail
in the course colour (Academy `#4ade80`, Route 1 `#3d8bff`, Route 2 `#ffc93c`, Route 3 `#2ee6c8`).

`chess.js` imports `studioEnvironment`, `addLights`, `extrude` and `canvasTexture` from the badgeweb3 source
(`src/badge/core.js` in `badgeweb3-completo.zip`, unchanged). To render again:

1. Put this folder next to the unzipped badgeweb3 folder, as `chess3d/` beside `bz/badgeweb3/`
   (or change the import path at the top of `chess.js`).
2. `npm install three@0.186.1` in this folder.
3. Serve the parent folder: `python3 -m http.server 8765`.
4. `node render.js '[["out/king.png","p=king&tint=%232ee6c8&w=1600&h=1600&fov=21&ly=2.0"]]'` (Playwright),
   once per piece (`p=pawn|bishop|queen|king`).
5. Crop every render to the same frame, `(349, 40, 1251, 1540)`, scale to 80% and save as WebP (quality 88),
   so the four pieces stand on the same plinth size.
