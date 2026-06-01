import {
  API_PORT,
  isApiRunning,
  startApiProcess,
  waitForApi,
} from "./scripts/api-startup.mjs"

declare global {
  var __sevenColorsApiProcess:
    | import("node:child_process").ChildProcess
    | undefined
  var __sevenColorsApiStarting: Promise<void> | undefined
}

export async function ensureApiServer() {
  if (await isApiRunning()) return

  if (globalThis.__sevenColorsApiStarting) {
    await globalThis.__sevenColorsApiStarting
    return
  }

  globalThis.__sevenColorsApiStarting = (async () => {
    const child = startApiProcess(process.cwd())

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
