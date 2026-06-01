import type { InventoryEntry, Order, OrderLine, Product } from "../types.ts"
import {
  shouldAllocateExternalProductStock,
  shouldAllocateInternalRawMaterials,
  shouldAllocateOrder,
} from "./allocation-rules.ts"
import {
  findItemInventory,
  findProductInventory,
  normalizeInventoryReservations,
} from "../inventory/lookup.ts"

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

export function incrementRequirement(
  map: Map<string, number>,
  itemId: string,
  required: number
) {
  map.set(itemId, (map.get(itemId) ?? 0) + required)
}

export function getRawMaterialRequirements(
  lines: OrderLine[],
  products: Product[]
) {
  const requirements = new Map<string, number>()

  for (const line of lines) {
    const product = products.find((entry) => entry.id === line.productId)
    if (!product) {
      throw new UnknownProductError("production", line.productId)
    }

    for (const component of product.components ?? []) {
      incrementRequirement(
        requirements,
        component.itemId,
        (component.amount ?? 0) * line.quantity
      )
    }
  }

  return requirements
}

export function getProductionRequirementPreview(
  lines: OrderLine[],
  products: Product[],
  inventory: InventoryEntry[]
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
      required: (component.amount ?? 0) * toProduce,
    }))

    if (productEntry && fromStock > 0) {
      productEntry.available -= fromStock
    }

    for (const requirement of rawRequirements) {
      if (requirement.required <= 0) continue
      incrementRequirement(
        itemRequirements,
        requirement.itemId,
        requirement.required
      )
    }

    productRequirements.push({
      productId: line.productId,
      required: line.quantity,
      available,
      fromStock,
      toProduce,
      itemRequirements: rawRequirements.filter(
        (requirement) => requirement.required > 0
      ),
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
    }
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
    hasProductShortages: productRequirements.some(
      (requirement) => requirement.toProduce > 0
    ),
    hasRawMaterialShortages: rawMaterialShortages.length > 0,
  }
}

export function recalculateInventoryReservations(
  orders: Order[],
  products: Product[],
  inventory: InventoryEntry[]
): ReserveInventoryResult {
  const ordersToAllocate = orders.filter(shouldAllocateOrder)
  if (ordersToAllocate.length === 0) {
    return {
      requirements: [],
      processedOrderIds: [],
      inventory: normalizeInventoryReservations(inventory),
      orders,
    }
  }

  const updatedInventory = normalizeInventoryReservations(inventory)
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
          incrementRequirement(
            itemRequirements,
            component.itemId,
            (component.amount ?? 0) * line.quantity
          )
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

      const productEntry = findProductInventory(
        updatedInventory,
        line.productId
      )
      const productAvailable = productEntry?.available ?? 0
      const fromFinished = Math.min(line.quantity, productAvailable)

      if (
        productAvailable < line.quantity &&
        order.status !== "waiting_for_production"
      ) {
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
