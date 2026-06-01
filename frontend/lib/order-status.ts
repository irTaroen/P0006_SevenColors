export const ORDER_STATUSES = [
  "new",
  "approved",
  "waiting_for_production",
  "in_progress",
  "ready_for_shipping",
  "produced",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Maps legacy or unknown values to a known status key. */
export function normalizeOrderStatus(status: string): OrderStatus | string {
  if (status === "pending") return "new"
  if (ORDER_STATUSES.includes(status as OrderStatus)) return status as OrderStatus
  return status
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "New",
  approved: "Approved",
  waiting_for_production: "Waiting for Production",
  in_progress: "In Progress",
  ready_for_shipping: "Ready For Shipping",
  produced: "Produced",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  pending: "New",
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  new: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  approved: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  waiting_for_production:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ready_for_shipping: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  produced: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  shipped: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  returned: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  pending: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
}

export function getOrderStatusLabel(status: string) {
  const key = normalizeOrderStatus(status)
  return ORDER_STATUS_LABELS[key] ?? status
}

export function getOrderStatusColor(status: string) {
  const key = normalizeOrderStatus(status)
  return ORDER_STATUS_COLORS[key] ?? "bg-muted text-muted-foreground"
}
