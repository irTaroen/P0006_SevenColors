export const API_BASE = "http://localhost:3001"

export async function fetchResource<T>(resource: string): Promise<T[]> {
  const res = await fetch(`${API_BASE}/${resource}`)
  if (!res.ok) throw new Error(`Failed to fetch ${resource}`)
  return res.json()
}

export async function updateResource<T>(
  resource: string,
  id: string,
  data: Partial<T>,
): Promise<T> {
  const res = await fetch(`${API_BASE}/${resource}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to update ${resource}/${id}`)
  return res.json()
}

export async function deleteResource(resource: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${resource}/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Failed to delete ${resource}/${id}`)
}

export async function createResource<T>(resource: string, data: Omit<T, "id">): Promise<T> {
  const res = await fetch(`${API_BASE}/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to create ${resource}`)
  return res.json()
}
