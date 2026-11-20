# Badge lab

A static build of the badgeweb3 badge system (`/mnt/project-files/badges-new/badgeweb3-with-new-badges.zip`), with the six new badges of 2026-11-20 (levels 4 and 5, Academy levels 2 and 3). It is a test page only: it is not linked from the prototype and does not replace badgeweb3.vercel.app.

Pages: `index.html` (reward screen, `?badge=<id>`), `gallery.html` (all badges live), `badges-certificates.html` (grid), `badges-paths.html` (paths).

Rebuild: in the badgeweb3 folder, `npx vite build --base ./ --outDir <this folder>`, then point `href="./"` and `./?badge=` at `./index.html` (Next.js serves no directory index from public/).
