import type { Order } from "../types.ts"

export const UNALLOCATED_ORDER_STATUSES = new Set([
  "new",
  "pending",
  "cancelled",
  "returned",
])

export function isUnallocatedOrder(order: Pick<Order, "status">) {
  return UNALLOCATED_ORDER_STATUSES.has(order.status)
}

export function isInternalOrder(order: Pick<Order, "type">) {
  return order.type === "internal"
}

export function shouldAllocateOrder(order: Pick<Order, "status">) {
  return !isUnallocatedOrder(order)
}

export function shouldAllocateExternalProductStock(
  order: Pick<Order, "status" | "type">
) {
  return shouldAllocateOrder(order) && !isInternalOrder(order)
}

export function shouldAllocateInternalRawMaterials(
  order: Pick<Order, "status" | "type" | "productionApplied">
) {
  return (
    shouldAllocateOrder(order) &&
    isInternalOrder(order) &&
    order.status !== "produced" &&
    !order.productionApplied
  )
}

export function shouldRecalculateInventory(
  previousStatus: string | undefined,
  nextStatus: unknown
) {
  const resolvedNextStatus =
    typeof nextStatus === "string" ? nextStatus : previousStatus
  const wasAllocated =
    typeof previousStatus === "string" &&
    !UNALLOCATED_ORDER_STATUSES.has(previousStatus)
  const willBeAllocated =
    typeof resolvedNextStatus === "string" &&
    !UNALLOCATED_ORDER_STATUSES.has(resolvedNextStatus)

  return wasAllocated || willBeAllocated
}
