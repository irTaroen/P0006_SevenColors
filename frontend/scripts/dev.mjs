import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { isApiRunning, startApiProcess, waitForApi } from "./api-startup.mjs"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

function runCommand(command, args) {
  return spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  })
}

async function startDb() {
  if (await isApiRunning()) {
    console.log("API already running on http://localhost:3001")
    return null
  }

  const child = startApiProcess(root, { shell: process.platform === "win32" })

  const started = await waitForApi()
  if (started) return child

  child.kill("SIGTERM")

  if (await isApiRunning()) {
    console.log("API already running on http://localhost:3001")
    return null
  }

  console.error(
    "Could not start the API on port 3001. Stop the existing process with:\n  npm run db:stop"
  )
  process.exit(1)
}

async function main() {
  const db = await startDb()
  const web = runCommand("npx", ["next", "dev"])

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
