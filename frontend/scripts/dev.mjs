import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const API_URL = "http://127.0.0.1:3001/orders"
const START_TIMEOUT_MS = 10_000

async function isApiRunning() {
  try {
    const res = await fetch(API_URL)
    return res.ok
  } catch {
    return false
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function run(command, args) {
  return spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  })
}

async function waitForApi() {
  const deadline = Date.now() + START_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (await isApiRunning()) return true
    await sleep(200)
  }
  return false
}

async function startDb() {
  if (await isApiRunning()) {
    console.log("API already running on http://localhost:3001")
    return null
  }

  const child = run("node", ["--experimental-strip-types", "server/index.ts"])

  const started = await waitForApi()
  if (started) return child

  child.kill("SIGTERM")

  if (await isApiRunning()) {
    console.log("API already running on http://localhost:3001")
    return null
  }

  console.error(
    "Could not start the API on port 3001. Stop the existing process with:\n  npm run db:stop",
  )
  process.exit(1)
}

async function main() {
  const db = await startDb()
  const web = run("npx", ["next", "dev"])

  web.on("exit", (code) => {
    if (code && code !== 0) process.exit(code)
  })

  function shutdown() {
    db?.kill("SIGTERM")
    web.kill("SIGTERM")
    process.exit(0)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}

main()
