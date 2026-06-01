export type CatalogProduct = { id: string; clientId?: string | null }

export function isProductAvailableForClient(
  product: CatalogProduct,
  clientId: string
): boolean {
  if (!clientId) return product.clientId === null
  return product.clientId === null || product.clientId === clientId
}

/** Standard catalog (clientId null) plus products owned by the given client. */
export function getProductsForClient<T extends CatalogProduct>(
  products: T[],
  clientId: string
): T[] {
  return products.filter((product) =>
    isProductAvailableForClient(product, clientId)
  )
}
