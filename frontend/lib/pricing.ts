export type ItemPricing = { id: string; buyPrice: number; sellPrice?: number }
export type ProductComponent = { itemId: string; amount: number }
export type ProductPricing = { id: string; sellPrice: number; components: ProductComponent[] }
export type OrderLine = { productId: string; quantity: number }

export function computeProductTotalCost(
  components: ProductComponent[],
  items: ItemPricing[],
): number {
  return components.reduce((sum, component) => {
    const item = items.find((entry) => entry.id === component.itemId)
    return sum + (item?.buyPrice ?? 0) * component.amount
  }, 0)
}

export function computeOrderTotalPrice(
  lines: OrderLine[],
  products: Pick<ProductPricing, "id" | "sellPrice">[],
): number {
  return lines.reduce((sum, line) => {
    const product = products.find((entry) => entry.id === line.productId)
    return sum + (product?.sellPrice ?? 0) * line.quantity
  }, 0)
}

export function computeOrderTotalCost(
  lines: OrderLine[],
  products: Pick<ProductPricing, "id" | "components">[],
  items: ItemPricing[],
): number {
  return lines.reduce((sum, line) => {
    const product = products.find((entry) => entry.id === line.productId)
    if (!product?.components?.length) return sum
    const unitCost = computeProductTotalCost(product.components, items)
    return sum + unitCost * line.quantity
  }, 0)
}

export function formatPrice(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
