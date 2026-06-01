import { spawn } from "node:child_process"
import { join } from "node:path"

export const API_PORT = 3001
export const API_URL = `http://127.0.0.1:${API_PORT}/orders`
export const START_TIMEOUT_MS = 10_000

export async function isApiRunning() {
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

export async function waitForApi() {
  const deadline = Date.now() + START_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (await isApiRunning()) return true
    await sleep(200)
  }
  return false
}

export function startApiProcess(root, options = {}) {
  return spawn(
    "node",
    ["--experimental-strip-types", join(root, "server/index.ts")],
    {
      cwd: root,
      stdio: options.stdio ?? "inherit",
      env: { ...process.env, PORT: String(API_PORT), ...options.env },
      shell: options.shell ?? false,
    }
  )
}
