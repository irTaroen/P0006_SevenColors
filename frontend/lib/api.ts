export const API_BASE =
  typeof window === "undefined" ? "http://127.0.0.1:3001" : "/api"

export async function fetchResource<T>(resource: string): Promise<T[]> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/${resource}`)
  } catch {
    throw new Error(
      `Cannot reach the API. Restart the dev server with "npm run dev".`
    )
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(
      body?.error ?? `Failed to fetch ${resource} (${res.status})`
    )
  }
  return res.json()
}

export async function updateResource<T>(
  resource: string,
  id: string,
  data: Partial<T>
): Promise<T> {
  const res = await fetch(`${API_BASE}/${resource}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error ?? `Failed to update ${resource}/${id}`)
  }
  return res.json()
}

export async function deleteResource(
  resource: string,
  id: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/${resource}/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Failed to delete ${resource}/${id}`)
}

export async function createResource<T>(
  resource: string,
  data: Omit<T, "id">
): Promise<T> {
  const res = await fetch(`${API_BASE}/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error ?? `Failed to create ${resource}`)
  }
  return res.json()
}
