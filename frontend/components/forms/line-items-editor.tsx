"use client"

import { PlusIcon, Trash2Icon } from "lucide-react"

import { SelectField } from "@/components/forms/select-field"
import { Button } from "@/components/ui/button"
import { NumberInput } from "@/components/ui/number-input"

export type LineItemOption = { id: string; label: string }

type AvailableStock = { available: number; unit?: string }

export function LineItemsEditor<T>({
  items,
  options,
  getOptionId,
  getQuantity,
  setOptionId,
  setQuantity,
  addItem,
  removeItem,
  optionLabel = "Item",
  quantityLabel = "Amount",
  getAvailableStock,
}: {
  items: T[]
  options: LineItemOption[]
  getOptionId: (item: T) => string
  getQuantity: (item: T) => number
  setOptionId: (index: number, id: string) => void
  setQuantity: (index: number, quantity: number) => void
  addItem: () => void
  removeItem: (index: number) => void
  optionLabel?: string
  quantityLabel?: string
  getAvailableStock?: (optionId: string) => AvailableStock | null
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          {optionLabel}s
        </span>
        <Button
          type="button"
          size="sm"
          variant="neu"
          onClick={addItem}
          disabled={!options.length}
        >
          <PlusIcon className="size-3.5" />
          Add
        </Button>
      </div>
      {!items.length ? (
        <p className="text-xs text-muted-foreground">
          No {optionLabel.toLowerCase()}s added.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => {
            const optionId = getOptionId(item)
            const quantity = getQuantity(item)
            const stock = getAvailableStock?.(optionId)
            const insufficient =
              stock !== undefined &&
              stock !== null &&
              quantity > stock.available

            return (
              <div
                key={`${optionId}-${index}`}
                className={
                  getAvailableStock
                    ? "grid grid-cols-[1fr_minmax(5.5rem,auto)_88px_32px] items-center gap-2"
                    : "grid grid-cols-[1fr_88px_32px] items-center gap-2"
                }
              >
                <SelectField
                  value={optionId}
                  onChange={(id) => setOptionId(index, id)}
                  required
                >
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
                {getAvailableStock ? (
                  <span
                    className={`text-[11px] whitespace-nowrap tabular-nums ${
                      insufficient
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                    title={
                      stock
                        ? `${stock.available}${stock.unit ? ` ${stock.unit}` : ""} available in inventory`
                        : undefined
                    }
                  >
                    {stock
                      ? `${stock.available}${stock.unit ? ` ${stock.unit}` : ""} avail.`
                      : "—"}
                  </span>
                ) : null}
                <NumberInput
                  value={quantity}
                  onChange={(value) => setQuantity(index, value)}
                  aria-label={quantityLabel}
                />
                <Button
                  type="button"
                  variant="neu-icon"
                  size="icon-sm"
                  aria-label={`Remove ${optionLabel.toLowerCase()}`}
                  onClick={() => removeItem(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
