"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { ArchiveIcon } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { FormField } from "@/components/data-table/form-field"
import { ResourceFormDialog } from "@/components/data-table/resource-form-dialog"
import { SelectField } from "@/components/data-table/select-field"
import { Input } from "@/components/ui/input"
import { createResource, deleteResource, fetchResource, updateResource } from "@/lib/api"

type InventoryEntry = {
  id: string
  itemId: string
  stock: number
  warehouse: string
}

type Item = { id: string; name: string; unit: string }

type InventoryForm = Omit<InventoryEntry, "id">

const columnHelper = createColumnHelper<InventoryEntry>()

const EMPTY_FORM: InventoryForm = {
  itemId: "",
  stock: 0,
  warehouse: "",
}

export default function InventoryPage() {
  const [data, setData] = React.useState<InventoryEntry[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<InventoryForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    Promise.all([
      fetchResource<InventoryEntry>("inventory"),
      fetchResource<Item>("items"),
    ]).then(([inventory, itemList]) => {
      setData(inventory)
      setItems(itemList)
    }).finally(() => setIsLoading(false))
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      itemId: items[0]?.id ?? "",
      stock: 0,
      warehouse: "Main Warehouse",
    })
    setDialogOpen(true)
  }

  const openEdit = (entry: InventoryEntry) => {
    setEditingId(entry.id)
    setForm({
      itemId: entry.itemId,
      stock: entry.stock,
      warehouse: entry.warehouse,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        ...form,
        stock: Number(form.stock) || 0,
      }
      if (editingId) {
        const updated = await updateResource<InventoryEntry>("inventory", editingId, payload)
        setData((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...updated } : e)))
      } else {
        const created = await createResource<InventoryEntry>("inventory", payload)
        setData((prev) => [...prev, created])
      }
      setDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = React.useCallback(async (id: string) => {
    await deleteResource("inventory", id)
    setData((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const getItemName = (itemId: string) => items.find((i) => i.id === itemId)?.name ?? itemId

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("itemId", {
        header: "Item",
        cell: ({ getValue }) => (
          <span className="font-medium">{getItemName(getValue())}</span>
        ),
      }),
      columnHelper.accessor("stock", {
        header: "Stock",
        cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
      }),
      columnHelper.accessor("warehouse", {
        header: "Warehouse",
        cell: ({ getValue }) => getValue(),
      }),
    ],
    [items],
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <ArchiveIcon className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Inventory</h1>
          <p className="text-xs text-muted-foreground">
            Stock levels per item. Use the edit icon or add button to manage records.
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
        addLabel="Add entry"
        getRowLabel={(row) => getItemName(row.itemId)}
      />

      <ResourceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "Edit inventory entry" : "Add inventory entry"}
        description={editingId ? "Update this entry and save your changes." : "Fill in the stock details for a new entry."}
        onSubmit={handleSave}
        submitLabel={editingId ? "Save changes" : "Create entry"}
        isSubmitting={isSaving}
      >
        <FormField label="Item" htmlFor="inventory-item">
          <SelectField
            id="inventory-item"
            value={form.itemId}
            onChange={(itemId) => setForm((f) => ({ ...f, itemId }))}
            required
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </SelectField>
        </FormField>
        <FormField label="Stock" htmlFor="inventory-stock">
          <Input
            id="inventory-stock"
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
            className="tabular-nums"
            required
          />
        </FormField>
        <FormField label="Warehouse" htmlFor="inventory-warehouse">
          <Input
            id="inventory-warehouse"
            value={form.warehouse}
            onChange={(e) => setForm((f) => ({ ...f, warehouse: e.target.value }))}
            required
          />
        </FormField>
      </ResourceFormDialog>
    </div>
  )
}
