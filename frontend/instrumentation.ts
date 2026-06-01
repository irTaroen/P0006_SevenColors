export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.NODE_ENV !== "development") return

  const { ensureApiServer } = await import("./instrumentation.node")
  await ensureApiServer()
}
