export type CatalogProduct = { id: string; clientId: string | null }

/** Standard catalog (clientId null) plus products owned by the given client. */
export function getProductsForClient<T extends CatalogProduct>(
  products: T[],
  clientId: string,
): T[] {
  if (!clientId) return products.filter((product) => product.clientId === null)
  return products.filter(
    (product) => product.clientId === null || product.clientId === clientId,
  )
}

export function isProductAvailableForClient(
  product: CatalogProduct,
  clientId: string,
): boolean {
  if (!clientId) return product.clientId === null
  return product.clientId === null || product.clientId === clientId
}
