import type { OrderType } from "./orders/type.ts"

export type EntityId = string

export type Client = {
  id: EntityId
  name: string
  email: string
  phone: string
  address: string
}

export type Item = {
  id: EntityId
  name: string
  unit: string
  buyPrice: number
  sellPrice: number
  minimumInventory: number
  supplier?: string
}

export type ProductComponent = {
  itemId: EntityId
  amount: number
}

export type Product = {
  id: EntityId
  name?: string
  sellPrice?: number
  unit?: string
  clientId?: EntityId | null
  components?: ProductComponent[]
}

export type OrderLine = {
  productId: EntityId
  quantity: number
}

export type Order = {
  id: EntityId
  status: string
  type?: OrderType
  clientId?: EntityId
  orderDate?: string
  productionDate?: string
  deliveryDate?: string
  totalPrice?: number
  sourceOrderId?: EntityId
  productionApplied?: boolean
  products: OrderLine[]
}

export type InventoryEntry = {
  id: EntityId
  type?: "item" | "product"
  itemId: EntityId | null
  productId?: EntityId | null
  available: number
  reserved: number
  inUse: number
  warehouse: string
}
