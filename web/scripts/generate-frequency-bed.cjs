/**
 * Builds a seamless stereo frequency bed.
 * 18 s loop @ 44.1 kHz / 16-bit.
 * Left 72 Hz + right 81 Hz → 9 Hz binaural beat.
 * 9 Hz amplitude pulse on the low texture.
 * Very light high-band air. No melody.
 */
const { writeFileSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");

const SAMPLE_RATE = 44100;
const SECONDS = 18;
const CHANNELS = 2;
const FADE = Math.round(SAMPLE_RATE * 0.09);
const N = SAMPLE_RATE * SECONDS;

function brown(n, seed) {
  const out = new Float64Array(n);
  let last = 0;
  let s = seed;
  for (let i = 0; i < n; i += 1) {
    s = (s * 16807 + 0) % 2147483647;
    const white = (s / 2147483647) * 2 - 1;
    last = (last + 0.018 * white) / 1.018;
    out[i] = last;
  }
  return out;
}

function lowpass(input, cutoff) {
  const out = new Float64Array(input.length);
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SAMPLE_RATE;
  const a = dt / (rc + dt);
  let y = 0;
  for (let i = 0; i < input.length; i += 1) {
    y += a * (input[i] - y);
    out[i] = y;
  }
  return out;
}

function highpass(input, cutoff) {
  const out = new Float64Array(input.length);
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SAMPLE_RATE;
  const a = rc / (rc + dt);
  let prevX = 0;
  let prevY = 0;
  for (let i = 0; i < input.length; i += 1) {
    const y = a * (prevY + input[i] - prevX);
    prevX = input[i];
    prevY = y;
    out[i] = y;
  }
  return out;
}

function bandpass(input, low, high) {
  return lowpass(highpass(input, low), high);
}

function writeWav(path, left, right) {
  const dataSize = N * CHANNELS * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * 2, 28);
  buffer.writeUInt16LE(CHANNELS * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < N; i += 1) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    buffer.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
  }
  writeFileSync(path, buffer);
}

function splice(channel) {
  for (let i = 0; i < FADE; i += 1) {
    const w = i / FADE;
    const head = channel[i];
    const tail = channel[N - FADE + i];
    channel[i] = tail * (1 - w) + head * w;
    channel[N - FADE + i] = tail * (1 - w) + head * w;
  }
}

const extra = N + FADE;
const rawL = brown(extra, 17);
const rawR = brown(extra, 41);
const lowL = lowpass(rawL, 168);
const lowR = lowpass(rawR, 174);
const airL = bandpass(brown(extra, 91), 6200, 9800);
const airR = bandpass(brown(extra, 113), 6400, 10200);

const left = new Float64Array(N);
const right = new Float64Array(N);

for (let i = 0; i < N; i += 1) {
  const t = i / SAMPLE_RATE;
  const pulse = 0.74 + 0.26 * Math.sin(2 * Math.PI * 9 * t);
  const binauralL = Math.sin(2 * Math.PI * 72 * t);
  const binauralR = Math.sin(2 * Math.PI * 81 * t);
  left[i] = lowL[i] * 0.55 * pulse + binauralL * 0.038 + airL[i] * 0.016;
  right[i] = lowR[i] * 0.55 * pulse + binauralR * 0.038 + airR[i] * 0.016;
}

let peak = 0;
for (let i = 0; i < N; i += 1) {
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}
const norm = peak > 0 ? 0.32 / peak : 1;
for (let i = 0; i < N; i += 1) {
  left[i] *= norm;
  right[i] *= norm;
}

splice(left);
splice(right);

const dir = join(__dirname, "..", "public", "audio");
mkdirSync(dir, { recursive: true });
const dest = join(dir, "frequency-bed.wav");
writeWav(dest, left, right);
console.log(`wrote ${dest} (${SECONDS}s stereo 44.1k loop)`);
