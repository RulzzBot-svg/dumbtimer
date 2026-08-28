import { spawn } from 'node:child_process'

const api = spawn(process.execPath, ['scripts/dev-api.mjs'], {
  stdio: 'inherit',
  env: process.env,
})
const vite = spawn('npx', ['vite', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
})

function shutDown() {
  api.kill()
  vite.kill()
}

process.on('SIGINT', shutDown)
process.on('SIGTERM', shutDown)

api.on('exit', (code) => {
  if (code) vite.kill()
})
vite.on('exit', (code) => {
  api.kill()
  process.exit(code ?? 0)
})
