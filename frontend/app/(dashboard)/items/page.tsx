"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { BoxIcon } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { FormField } from "@/components/data-table/form-field"
import { ResourceFormDialog } from "@/components/data-table/resource-form-dialog"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { createResource, deleteResource, fetchResource, updateResource } from "@/lib/api"
import { useResourceSync } from "@/providers"
import { formatPrice } from "@/lib/pricing"

type Item = {
  id: string
  name: string
  unit: string
  buyPrice: number
  sellPrice: number
  minimumInventory: number
  supplier?: string
}

type ItemForm = Omit<Item, "id">

const columnHelper = createColumnHelper<Item>()

const EMPTY_FORM: ItemForm = {
  name: "",
  unit: "",
  buyPrice: 0,
  sellPrice: 0,
  minimumInventory: 0,
  supplier: "",
}

export default function ItemsPage() {
  const [data, setData] = React.useState<Item[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<ItemForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = React.useState(false)
  const syncToken = useResourceSync("items")

  React.useEffect(() => {
    fetchResource<Item>("items")
      .then(setData)
      .finally(() => setIsLoading(false))
  }, [syncToken])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (item: Item) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      unit: item.unit,
      buyPrice: item.buyPrice,
      sellPrice: item.sellPrice,
      minimumInventory: item.minimumInventory ?? 0,
      supplier: item.supplier ?? "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        ...form,
        buyPrice: Number(form.buyPrice) || 0,
        sellPrice: Number(form.sellPrice) || 0,
        minimumInventory: Number(form.minimumInventory) || 0,
      }
      if (editingId) {
        const updated = await updateResource<Item>("items", editingId, payload)
        setData((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...updated } : item)))
      } else {
        const created = await createResource<Item>("items", payload)
        setData((prev) => [...prev, created])
      }
      setDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = React.useCallback(async (id: string) => {
    await deleteResource("items", id)
    setData((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
      }),
      columnHelper.accessor("unit", {
        header: "Unit",
        cell: ({ getValue }) => getValue(),
      }),
      columnHelper.accessor("buyPrice", {
        header: "Buy price",
        meta: {
          filterText: (row) => `${formatPrice(row.buyPrice)} ${row.buyPrice}`,
        },
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatPrice(getValue())}</span>
        ),
      }),
      columnHelper.accessor("sellPrice", {
        header: "Sell price",
        meta: {
          filterText: (row) => `${formatPrice(row.sellPrice)} ${row.sellPrice}`,
        },
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatPrice(getValue())}</span>
        ),
      }),
      columnHelper.accessor("minimumInventory", {
        header: "Minimum inventory",
        meta: {
          filterText: (row) => `${row.minimumInventory ?? 0} ${row.unit}`,
        },
        cell: ({ row, getValue }) => (
          <span className="tabular-nums">
            {getValue() ?? 0} {row.original.unit}
          </span>
        ),
      }),
      columnHelper.accessor("supplier", {
        header: "Supplier",
        meta: {
          filterText: (row) => row.supplier ?? "",
        },
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() ?? "—"}</span>
        ),
      }),
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <BoxIcon className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Items</h1>
          <p className="text-xs text-muted-foreground">
            Raw materials and supplies. Use the edit icon or add button to manage records.
          </p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onDelete={handleDelete}
        onAddClick={openCreate}
        onEdit={openEdit}
        addLabel="Add item"
        getRowLabel={(row) => row.name}
      />

      <ResourceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "Edit item" : "Add item"}
        description={editingId ? "Update this item and save your changes." : "Fill in the details for the new item."}
        onSubmit={handleSave}
        submitLabel={editingId ? "Save changes" : "Create item"}
        isSubmitting={isSaving}
      >
        <FormField label="Name" htmlFor="item-name">
          <Input
            id="item-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Unit" htmlFor="item-unit">
          <Input
            id="item-unit"
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            placeholder="kg, l, pcs…"
            required
          />
        </FormField>
        <FormField label="Buy price" htmlFor="item-buy-price">
          <NumberInput
            id="item-buy-price"
            value={form.buyPrice}
            onChange={(buyPrice) => setForm((f) => ({ ...f, buyPrice }))}
          />
        </FormField>
        <FormField label="Sell price" htmlFor="item-sell-price">
          <NumberInput
            id="item-sell-price"
            value={form.sellPrice}
            onChange={(sellPrice) => setForm((f) => ({ ...f, sellPrice }))}
          />
        </FormField>
        <FormField label="Minimum inventory" htmlFor="item-minimum-inventory">
          <NumberInput
            id="item-minimum-inventory"
            value={form.minimumInventory}
            onChange={(minimumInventory) => setForm((f) => ({ ...f, minimumInventory }))}
            integerOnly
          />
        </FormField>
        <FormField label="Supplier" htmlFor="item-supplier">
          <Input
            id="item-supplier"
            value={form.supplier}
            onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
          />
        </FormField>
      </ResourceFormDialog>
    </div>
  )
}
