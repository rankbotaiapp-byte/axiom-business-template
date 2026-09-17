const { readFileSync, writeFileSync, mkdtempSync, rmSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const { EdgeTTS } = require("node-edge-tts");

const root = join(__dirname, "..");
const paragraphs = readFileSync(join(root, "public", "audio", "zero-state-briefing.txt"), "utf8")
  .trim()
  .replace(/\r\n/g, "\n")
  .split(/\n{2,}/)
  .map((part) => part.replace(/\n/g, " ").trim())
  .filter(Boolean);

const out = join(root, "public", "audio", "zero-state-briefing.mp3");

async function speak(text, dest) {
  const tts = new EdgeTTS({
    voice: "en-US-AndrewNeural",
    lang: "en-US",
    outputFormat: "audio-24khz-96kbitrate-mono-mp3",
    pitch: "-4%",
    rate: "-18%",
    volume: "default",
    timeout: 45000,
  });
  await tts.ttsPromise(text, dest);
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "zpoint-briefing-"));
  const chunks = [];
  try {
    for (const [index, paragraph] of paragraphs.entries()) {
      const file = join(dir, `${String(index).padStart(2, "0")}.mp3`);
      process.stdout.write(`synthesizing ${index + 1}/${paragraphs.length}\n`);
      await speak(paragraph, file);
      chunks.push(readFileSync(file));
    }
    writeFileSync(out, Buffer.concat(chunks));
    console.log(`wrote ${out} (${chunks.length} segments, ${Buffer.concat(chunks).length} bytes)`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
