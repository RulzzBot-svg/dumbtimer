import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const sampleRate = 44100
const duration = 1.85
const n = Math.floor(sampleRate * duration)
const samples = new Int16Array(n)

const notes = [
  { freq: 523.25, start: 0.0, dur: 0.9, gain: 0.55 },
  { freq: 659.25, start: 0.16, dur: 0.95, gain: 0.42 },
  { freq: 783.99, start: 0.42, dur: 1.25, gain: 0.5 },
]

for (let i = 0; i < n; i += 1) {
  const t = i / sampleRate
  let sample = 0
  for (const note of notes) {
    if (t < note.start || t >= note.start + note.dur) continue
    const local = t - note.start
    const attack = Math.min(1, local / 0.018)
    const envelope = attack * Math.exp(-local * 2.8)
    sample += Math.sin(2 * Math.PI * note.freq * local) * envelope * note.gain
    sample += Math.sin(2 * Math.PI * note.freq * 2 * local) * envelope * note.gain * 0.18
  }
  samples[i] = Math.max(-1, Math.min(1, sample)) * 0.72 * 32767
}

const bytesPerSample = 2
const dataSize = samples.length * bytesPerSample
const buffer = Buffer.alloc(44 + dataSize)
buffer.write('RIFF', 0)
buffer.writeUInt32LE(36 + dataSize, 4)
buffer.write('WAVE', 8)
buffer.write('fmt ', 12)
buffer.writeUInt32LE(16, 16)
buffer.writeUInt16LE(1, 20)
buffer.writeUInt16LE(1, 22)
buffer.writeUInt32LE(sampleRate, 24)
buffer.writeUInt32LE(sampleRate * bytesPerSample, 28)
buffer.writeUInt16LE(bytesPerSample, 32)
buffer.writeUInt16LE(16, 34)
buffer.write('data', 36)
buffer.writeUInt32LE(dataSize, 40)

for (let i = 0; i < samples.length; i += 1) {
  buffer.writeInt16LE(samples[i], 44 + i * 2)
}

const out = join(dirname(fileURLToPath(import.meta.url)), '../public/chime.wav')
writeFileSync(out, buffer)
console.log(`wrote ${out} (${buffer.length} bytes)`)
