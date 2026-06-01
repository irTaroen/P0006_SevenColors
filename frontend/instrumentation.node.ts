import { spawn } from "node:child_process"
import { join } from "node:path"

const API_PORT = 3001
const API_URL = `http://127.0.0.1:${API_PORT}/orders`
const START_TIMEOUT_MS = 10_000

declare global {
  var __sevenColorsApiProcess: import("node:child_process").ChildProcess | undefined
  var __sevenColorsApiStarting: Promise<void> | undefined
}

async function isApiRunning() {
  try {
    const res = await fetch(API_URL)
    return res.ok
  } catch {
    return false
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForApi() {
  const deadline = Date.now() + START_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (await isApiRunning()) return true
    await sleep(200)
  }
  return false
}

export async function ensureApiServer() {
  if (await isApiRunning()) return

  if (globalThis.__sevenColorsApiStarting) {
    await globalThis.__sevenColorsApiStarting
    return
  }

  globalThis.__sevenColorsApiStarting = (async () => {
    const serverPath = join(process.cwd(), "server/index.ts")
    const child = spawn("node", ["--experimental-strip-types", serverPath], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: { ...process.env, PORT: String(API_PORT) },
    })

    globalThis.__sevenColorsApiProcess = child

    child.on("exit", () => {
      globalThis.__sevenColorsApiProcess = undefined
      globalThis.__sevenColorsApiStarting = undefined
    })

    const started = await waitForApi()
    if (!started) {
      child.kill("SIGTERM")
      throw new Error(`API server did not start on port ${API_PORT}`)
    }
  })()

  await globalThis.__sevenColorsApiStarting
}
