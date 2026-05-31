"use client"

import { PlusIcon, Trash2Icon } from "lucide-react"

import { SelectField } from "@/components/data-table/select-field"
import { Button } from "@/components/ui/button"
import { NumberInput } from "@/components/ui/number-input"

type Option = { id: string; label: string }

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
}: {
  items: T[]
  options: Option[]
  getOptionId: (item: T) => string
  getQuantity: (item: T) => number
  setOptionId: (index: number, id: string) => void
  setQuantity: (index: number, quantity: number) => void
  addItem: () => void
  removeItem: (index: number) => void
  optionLabel?: string
  quantityLabel?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{optionLabel}s</span>
        <Button type="button" size="sm" variant="outline" onClick={addItem} disabled={!options.length}>
          <PlusIcon className="size-3.5" />
          Add
        </Button>
      </div>
      {!items.length ? (
        <p className="text-xs text-muted-foreground">No {optionLabel.toLowerCase()}s added.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_88px_32px] items-center gap-2">
              <SelectField
                value={getOptionId(item)}
                onChange={(id) => setOptionId(index, id)}
                required
              >
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              <NumberInput
                value={getQuantity(item)}
                onChange={(quantity) => setQuantity(index, quantity)}
                aria-label={quantityLabel}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${optionLabel.toLowerCase()}`}
                onClick={() => removeItem(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
