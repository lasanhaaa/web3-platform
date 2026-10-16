const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage();
  pg.on('console', (m) => console.log('console', m.text()));
  pg.on('pageerror', (e) => console.log('ERR', e.message));
  const jobs = JSON.parse(process.argv[2]);
  for (const [name, qs] of jobs) {
    await pg.goto('http://localhost:8765/chess3d/chess.html?' + qs);
    await pg.waitForFunction(() => window.__done, null, { timeout: 120000 });
    const d = await pg.evaluate(() => window.__png);
    fs.writeFileSync(name, Buffer.from(d.split(',')[1], 'base64'));
    console.log('wrote', name);
  }
  await b.close();
})();
