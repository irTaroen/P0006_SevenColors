import type { ProductionRequirementPreview } from "@/lib/reserve-inventory"

export function ProductionPreviewPanel({
  preview,
  getProductLabel,
  getProductUnit,
  getItemLabel,
  getItemUnit,
}: {
  preview: ProductionRequirementPreview
  getProductLabel: (productId: string) => string
  getProductUnit: (productId: string) => string | undefined
  getItemLabel: (itemId: string) => string
  getItemUnit: (itemId: string) => string | undefined
}) {
  if (!preview.hasProductShortages) return null

  return (
    <div className="neu-card-inset-sm rounded-2xl p-4 text-sm">
      <div className="mb-3">
        <p className="font-medium">Production required</p>
        <p className="text-xs text-muted-foreground">
          Finished product stock is short. These barrels need to be produced
          before the customer order can continue.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {preview.products
          .filter((requirement) => requirement.toProduce > 0)
          .map((requirement, index) => {
            const unit = getProductUnit(requirement.productId)
            return (
              <div
                key={`${requirement.productId}-${index}`}
                className="space-y-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {getProductLabel(requirement.productId)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {requirement.available} / {requirement.required}
                    {unit ? ` ${unit}` : ""} in stock
                  </span>
                </div>
                <p className="text-xs text-destructive tabular-nums">
                  Produce {requirement.toProduce}
                  {unit ? ` ${unit}` : ""}.
                </p>
              </div>
            )
          })}
      </div>
      {preview.itemRequirements.length ? (
        <div className="mt-4 border-t border-border/60 pt-3">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Raw materials needed
          </p>
          <div className="flex flex-col gap-2">
            {preview.itemRequirements.map((requirement) => {
              const unit = getItemUnit(requirement.itemId)
              const insufficient = requirement.available < requirement.required
              return (
                <div
                  key={requirement.itemId}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span>{getItemLabel(requirement.itemId)}</span>
                  <span
                    className={`tabular-nums ${
                      insufficient
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    Need {requirement.required}
                    {unit ? ` ${unit}` : ""}, have {requirement.available}
                    {unit ? ` ${unit}` : ""}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
