import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { App } from "@tinyhttp/app"
import { cors } from "@tinyhttp/cors"
import { createApp } from "json-server/lib/app.js"
import { NormalizedAdapter } from "json-server/lib/adapters/normalized-adapter.js"
import { Observer } from "json-server/lib/adapters/observer.js"
import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"

import { registerOrderRoutes } from "./order-routes.ts"
import { registerDbSync } from "./db-sync.ts"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_FILE = join(__dirname, "../db.json")
const PORT = Number.parseInt(process.env.PORT ?? "3001", 10)
const HOST = process.env.HOST ?? "localhost"

if (!existsSync(DB_FILE)) {
  console.error(`Database file not found: ${DB_FILE}`)
  process.exit(1)
}

if (readFileSync(DB_FILE, "utf-8").trim() === "") {
  console.error(`Database file is empty: ${DB_FILE}`)
  process.exit(1)
}

const observer = new Observer(new NormalizedAdapter(new JSONFile(DB_FILE)))
const db = new Low(observer, {})
await db.read()

const jsonServerApp = createApp(db)
const app = new App()

app
  .use((req, res, next) =>
    cors({
      allowedHeaders: req.headers["access-control-request-headers"]
        ?.split(",")
        .map((header) => header.trim()),
    })(req, res, next)
  )
  .options("*", cors())

registerOrderRoutes(app, db)
registerDbSync(app, db, observer, DB_FILE)

app.use(jsonServerApp)

const server = app.listen(PORT, () => {
  console.log(`JSON Server started on http://${HOST}:${PORT}`)
})

server.on("error", (error) => {
  if ("code" in error && error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the existing API with: npm run db:stop`
    )
    process.exit(1)
  }

  throw error
})
