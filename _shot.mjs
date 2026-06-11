import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1000,height:1150}, deviceScaleFactor:2 });
await p.goto('file://' + process.cwd() + '/docs/Sourced-Jewellers-User-Manual.html');
await p.waitForTimeout(1500);
await p.screenshot({ path:'/tmp/m_cover.png' });
for (const id of ['pos','roles','consignments','products']) {
  await p.evaluate((i)=>document.getElementById(i).scrollIntoView(), id);
  await p.waitForTimeout(500);
  await p.screenshot({ path:'/tmp/m_'+id+'.png' });
}
await b.close();
console.log('done');
