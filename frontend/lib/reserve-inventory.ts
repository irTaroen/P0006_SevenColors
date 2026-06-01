export type ProductComponent = { itemId: string; amount: number }
export type Product = {
  id: string
  components?: ProductComponent[]
  sellPrice?: number
}
export type OrderLine = { productId: string; quantity: number }
export type Order = {
  id: string
  status: string
  type?: "external" | "internal"
  clientId?: string
  orderDate?: string
  productionDate?: string
  deliveryDate?: string
  totalPrice?: number
  sourceOrderId?: string
  productionApplied?: boolean
  products: OrderLine[]
}
export type InventoryEntry = {
  id: string
  type?: "item" | "product"
  itemId: string | null
  productId?: string | null
  available: number
  reserved: number
  inUse: number
  warehouse: string
}

export type ItemRequirement = { itemId: string; required: number }

export type InventoryShortage = {
  itemId?: string
  productId?: string
  required: number
  available: number
}

export class UnknownProductError extends Error {
  productId: string
  orderId: string

  constructor(orderId: string, productId: string) {
    super(`Product ${productId} on order ${orderId} was not found`)
    this.orderId = orderId
    this.productId = productId
  }
}

export class InsufficientInventoryError extends Error {
  shortages: InventoryShortage[]

  constructor(shortages: InventoryShortage[]) {
    super("Insufficient inventory to reserve items for approved orders")
    this.shortages = shortages
  }
}

export type ReserveInventoryResult = {
  requirements: ItemRequirement[]
  processedOrderIds: string[]
  inventory: InventoryEntry[]
  orders: Order[]
}

export type ProductRequirementPreview = {
  productId: string
  required: number
  available: number
  fromStock: number
  toProduce: number
  itemRequirements: ItemRequirement[]
}

export type RawMaterialRequirementPreview = {
  itemId: string
  required: number
  available: number
  reserved: number
  inUse: number
}

export type ProductionRequirementPreview = {
  products: ProductRequirementPreview[]
  itemRequirements: RawMaterialRequirementPreview[]
  rawMaterialShortages: InventoryShortage[]
  hasProductShortages: boolean
  hasRawMaterialShortages: boolean
}

const UNALLOCATED_ORDER_STATUSES = new Set(["new", "pending", "cancelled", "returned"])

function isUnallocatedOrder(order: Order) {
  return UNALLOCATED_ORDER_STATUSES.has(order.status)
}

function isInternalOrder(order: Order) {
  return order.type === "internal"
}

function shouldAllocateOrder(order: Order) {
  return !isUnallocatedOrder(order)
}

function shouldAllocateExternalProductStock(order: Order) {
  return shouldAllocateOrder(order) && !isInternalOrder(order)
}

function shouldAllocateInternalRawMaterials(order: Order) {
  return (
    shouldAllocateOrder(order) &&
    isInternalOrder(order) &&
    order.status !== "produced" &&
    !order.productionApplied
  )
}

function incrementRequirement(map: Map<string, number>, itemId: string, required: number) {
  map.set(itemId, (map.get(itemId) ?? 0) + required)
}

function findItemInventory(inventory: InventoryEntry[], itemId: string) {
  return inventory.find(
    (entry) =>
      entry.itemId === itemId &&
      (entry.type === "item" || (!entry.type && !entry.productId)),
  )
}

function findProductInventory(inventory: InventoryEntry[], productId: string) {
  return inventory.find(
    (entry) =>
      entry.productId === productId &&
      (entry.type === "product" || !entry.itemId),
  )
}

export function getProductionRequirementPreview(
  lines: OrderLine[],
  products: Product[],
  inventory: InventoryEntry[],
): ProductionRequirementPreview {
  const workingInventory = inventory.map((entry) => ({ ...entry }))
  const itemRequirements = new Map<string, number>()
  const productRequirements: ProductRequirementPreview[] = []

  for (const line of lines) {
    const product = products.find((entry) => entry.id === line.productId)
    if (!product) {
      throw new UnknownProductError("preview", line.productId)
    }

    const productEntry = findProductInventory(workingInventory, line.productId)
    const available = productEntry?.available ?? 0
    const fromStock = Math.min(line.quantity, available)
    const toProduce = line.quantity - fromStock
    const rawRequirements = (product.components ?? []).map((component) => ({
      itemId: component.itemId,
      required: component.amount * toProduce,
    }))

    if (productEntry && fromStock > 0) {
      productEntry.available -= fromStock
    }

    for (const requirement of rawRequirements) {
      if (requirement.required <= 0) continue
      incrementRequirement(itemRequirements, requirement.itemId, requirement.required)
    }

    productRequirements.push({
      productId: line.productId,
      required: line.quantity,
      available,
      fromStock,
      toProduce,
      itemRequirements: rawRequirements.filter((requirement) => requirement.required > 0),
    })
  }

  const rawMaterialRequirements = [...itemRequirements.entries()].map(
    ([itemId, required]) => {
      const entry = findItemInventory(inventory, itemId)
      return {
        itemId,
        required,
        available: entry?.available ?? 0,
        reserved: entry?.reserved ?? 0,
        inUse: entry?.inUse ?? 0,
      }
    },
  )

  const rawMaterialShortages = rawMaterialRequirements
    .filter((requirement) => requirement.available < requirement.required)
    .map((requirement) => ({
      itemId: requirement.itemId,
      required: requirement.required,
      available: requirement.available,
    }))

  return {
    products: productRequirements,
    itemRequirements: rawMaterialRequirements,
    rawMaterialShortages,
    hasProductShortages: productRequirements.some((requirement) => requirement.toProduce > 0),
    hasRawMaterialShortages: rawMaterialShortages.length > 0,
  }
}

/** Raw item needs after fulfilling as much as possible from finished product stock. */
export function calculateItemRequirements(
  orders: Order[],
  products: Product[],
  inventory: InventoryEntry[],
  shouldIncludeOrder: (order: Order) => boolean = shouldAllocateOrder,
): Map<string, number> {
  const requirements = new Map<string, number>()
  const workingInventory = inventory.map((entry) => ({ ...entry }))

  for (const order of orders) {
    if (!shouldIncludeOrder(order)) continue

    for (const line of order.products) {
      const product = products.find((entry) => entry.id === line.productId)
      if (!product) {
        throw new UnknownProductError(order.id, line.productId)
      }

      const productEntry = findProductInventory(workingInventory, line.productId)
      const fromFinished = Math.min(line.quantity, productEntry?.available ?? 0)
      const toManufacture = line.quantity - fromFinished

      if (fromFinished > 0 && productEntry) {
        productEntry.available -= fromFinished
      }

      if (toManufacture <= 0) continue

      for (const component of product.components ?? []) {
        incrementRequirement(requirements, component.itemId, component.amount * toManufacture)
      }
    }
  }

  return requirements
}

export function recalculateInventoryReservations(
  orders: Order[],
  products: Product[],
  inventory: InventoryEntry[],
): ReserveInventoryResult {
  const ordersToAllocate = orders.filter(shouldAllocateOrder)
  if (ordersToAllocate.length === 0) {
    return {
      requirements: [],
      processedOrderIds: [],
      inventory: inventory.map((entry) => ({
        ...entry,
        available: (entry.available ?? 0) + (entry.reserved ?? 0),
        reserved: 0,
      })),
      orders,
    }
  }

  const updatedInventory = inventory.map((entry) => ({
    ...entry,
    available: (entry.available ?? 0) + (entry.reserved ?? 0),
    reserved: 0,
  }))
  const itemRequirements = new Map<string, number>()
  const shortages: InventoryShortage[] = []

  for (const order of ordersToAllocate) {
    if (shouldAllocateInternalRawMaterials(order)) {
      for (const line of order.products) {
        const product = products.find((entry) => entry.id === line.productId)
        if (!product) {
          throw new UnknownProductError(order.id, line.productId)
        }

        for (const component of product.components ?? []) {
          incrementRequirement(itemRequirements, component.itemId, component.amount * line.quantity)
        }
      }
      continue
    }

    if (!shouldAllocateExternalProductStock(order)) continue

    for (const line of order.products) {
      const product = products.find((entry) => entry.id === line.productId)
      if (!product) {
        throw new UnknownProductError(order.id, line.productId)
      }

      const productEntry = findProductInventory(updatedInventory, line.productId)
      const productAvailable = productEntry?.available ?? 0
      const fromFinished = Math.min(line.quantity, productAvailable)

      if (productAvailable < line.quantity && order.status !== "waiting_for_production") {
        shortages.push({
          productId: line.productId,
          required: line.quantity,
          available: productAvailable,
        })
      }

      if (fromFinished > 0 && productEntry) {
        productEntry.available -= fromFinished
        productEntry.reserved += fromFinished
      }
    }
  }

  for (const [itemId, required] of itemRequirements) {
    const entry = findItemInventory(updatedInventory, itemId)
    const available = entry?.available ?? 0
    if (available < required) {
      shortages.push({ itemId, required, available })
    }
  }

  if (shortages.length > 0) {
    throw new InsufficientInventoryError(shortages)
  }

  for (const [itemId, required] of itemRequirements) {
    const entry = findItemInventory(updatedInventory, itemId)
    if (!entry) continue
    entry.available -= required
    entry.reserved += required
  }

  const updatedOrders = orders.map((order) => ({
    ...order,
    products: order.products.map((line) => ({ ...line })),
  }))

  const processedOrderIds = ordersToAllocate.map((order) => order.id)
  for (const order of updatedOrders) {
    if (order.status === "approved" && order.type === "internal") {
      order.status = "in_progress"
    }
  }

  return {
    requirements: [...itemRequirements.entries()].map(([itemId, required]) => ({
      itemId,
      required,
    })),
    processedOrderIds,
    inventory: updatedInventory,
    orders: updatedOrders,
  }
}

export function reserveInventoryForApprovedOrders(
  orders: Order[],
  products: Product[],
  inventory: InventoryEntry[],
): ReserveInventoryResult {
  return recalculateInventoryReservations(orders, products, inventory)
}
