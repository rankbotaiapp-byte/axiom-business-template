const { mkdirSync, writeFileSync, readFileSync, mkdtempSync, rmSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const { EdgeTTS } = require("node-edge-tts");

const clips = [
  [
    "induction",
    "This is a guided extraction session. Remain still. Do not improve your mood. Do not perform calm. Breathe at a steady rate. Let the jaw unclench. Let the hands rest. You are not here to feel a future. You are here to name what will exist, and what currently consumes your hours. When I ask a question, answer out loud. Use objects, numbers, names, and dates. If you do not know, say that you do not know. We begin.",
  ],
  [
    "q-outcome",
    "What will exist when this is complete? Name what a third party would see, hold, or inspect. Rooms, documents, money moved, a signed page. Not a feeling.",
  ],
  ["q-title", "Give this outcome a short title a third party could identify. One line."],
  [
    "q-responsibilities",
    "What current responsibilities consume real hours? Name the roles and obligations that will still be in force while you execute this.",
  ],
  [
    "q-load",
    "Which of those are non-negotiable, and how heavy is the time demand — low, medium, or high?",
  ],
  [
    "q-hours",
    "After those obligations, how many hours per week are actually available for this work? Give a number.",
  ],
  [
    "q-energy",
    "At that weekly load, what energy is sustainable — low, medium, or high? Do not inflate it.",
  ],
  ["q-competing", "What other intentions are competing for the same hours? If there are none, say none."],
  [
    "q-constraints",
    "Name the hard constraints: money, location, health, legal, deadline. If none apply, say none.",
  ],
  [
    "exit",
    "That is sufficient. The record now holds what you named. You will confirm it in writing next. Nothing has been completed. Input has been extracted. Open your eyes if they were closed. Sit up. We end.",
  ],
  ["reprompt", "No usable answer was recorded. State it again, in concrete terms."],
];

const outDir = join(__dirname, "..", "public", "audio", "extraction");

async function speak(text, dest) {
  const tts = new EdgeTTS({
    voice: "en-US-AndrewNeural",
    lang: "en-US",
    outputFormat: "audio-24khz-96kbitrate-mono-mp3",
    pitch: "-4%",
    rate: "-14%",
    volume: "default",
    timeout: 45000,
  });
  await tts.ttsPromise(text, dest);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  for (const [name, text] of clips) {
    const dest = join(outDir, `${name}.mp3`);
    process.stdout.write(`synthesizing ${name}\n`);
    const dir = mkdtempSync(join(tmpdir(), "zpoint-ex-"));
    const part = join(dir, "part.mp3");
    try {
      await speak(text, part);
      writeFileSync(dest, readFileSync(part));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  console.log(`wrote ${clips.length} clips to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
