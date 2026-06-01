export const ORDER_TYPES = ["external", "internal"] as const

export type OrderType = (typeof ORDER_TYPES)[number]

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  external: "External",
  internal: "Internal",
}

export function normalizeOrderType(type: string | undefined): OrderType {
  if (type === "internal") return "internal"
  return "external"
}

export function getOrderTypeLabel(type: string | undefined) {
  return ORDER_TYPE_LABELS[normalizeOrderType(type)]
}
