// Explicit maintainer command; ordinary checks consume the committed local media.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('../playground/web/node_modules/playwright');
async function main() {
  const dir = path.resolve(__dirname, '../playground/web/fixtures');
  fs.mkdirSync(dir, { recursive: true });
  const wav = Buffer.alloc(44 + 8000 * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
  fs.writeFileSync(path.join(dir, 'garden.wav'), wav);
  const browser = await chromium.launch({ executablePath: process.env.WEB_BROWSER_PATH || undefined });
  try {
    const page = await browser.newPage();
    const bytes = await page.evaluate(async () => {
      const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 180;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#166534'; ctx.fillRect(0, 0, 320, 180);
      ctx.fillStyle = 'white'; ctx.font = '24px sans-serif'; ctx.fillText('Garden fixture', 70, 90);
      const stream = canvas.captureStream(10), recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
      const chunks = []; recorder.ondataavailable = e => chunks.push(e.data);
      const done = new Promise(resolve => { recorder.onstop = resolve; });
      recorder.start();
      for (let frame = 0; frame < 12; frame++) {
        ctx.fillStyle = frame % 2 ? '#166534' : '#15803d'; ctx.fillRect(0, 160, 320, 20);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      recorder.stop(); await done;
      stream.getTracks().forEach(track => track.stop());
      return [...new Uint8Array(await new Blob(chunks).arrayBuffer())];
    });
    fs.writeFileSync(path.join(dir, 'garden.webm'), Buffer.from(bytes));
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
