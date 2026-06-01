"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { ArchiveIcon } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { FormField } from "@/components/data-table/form-field"
import { ResourceFormDialog } from "@/components/data-table/resource-form-dialog"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { createResource, deleteResource, fetchResource, updateResource } from "@/lib/api"
import {
  buildInventoryRows,
  isVirtualInventoryId,
  type InventoryEntry,
} from "@/lib/inventory-rows"
import { useResourceSync } from "@/providers"
import {
  getInventoryStockStatus,
  getInventoryTotal,
  INVENTORY_STATUS_COLORS,
  INVENTORY_STATUS_LABELS,
} from "@/lib/inventory-status"

type InventoryRecord = Omit<InventoryEntry, "persisted">

type Item = { id: string; name: string; unit: string; minimumInventory: number }
type Product = { id: string; name: string; unit: string }

type InventoryForm = Omit<InventoryRecord, "id">

const columnHelper = createColumnHelper<InventoryEntry>()

function formatAmount(value: number, unit?: string) {
  return unit ? `${value} ${unit}` : String(value)
}

const EMPTY_FORM: InventoryForm = {
  type: "item",
  itemId: "",
  productId: null,
  available: 0,
  reserved: 0,
  inUse: 0,
  warehouse: "",
}

export default function InventoryPage() {
  const [inventoryRecords, setInventoryRecords] = React.useState<InventoryRecord[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<InventoryForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = React.useState(false)
  const syncToken = useResourceSync("inventory", "items", "products")

  const data = React.useMemo(
    () => buildInventoryRows(items, products, inventoryRecords),
    [items, products, inventoryRecords],
  )

  React.useEffect(() => {
    Promise.all([
      fetchResource<InventoryRecord>("inventory"),
      fetchResource<Item>("items"),
      fetchResource<Product>("products"),
    ]).then(([inventory, itemList, productList]) => {
      setInventoryRecords(
        inventory.map((entry) => ({
          ...entry,
          type: entry.type ?? (entry.productId ? "product" : "item"),
          itemId: entry.itemId ?? null,
          productId: entry.productId ?? null,
        })),
      )
      setItems(itemList)
      setProducts(productList)
    }).catch(() => {
      // Keep showing the last loaded data if a refresh fails.
    }).finally(() => setIsLoading(false))
  }, [syncToken])

  const openEdit = (entry: InventoryEntry) => {
    setEditingId(entry.id)
    setForm({
      type: entry.type ?? (entry.productId ? "product" : "item"),
      itemId: entry.itemId,
      productId: entry.productId,
      available: entry.available ?? 0,
      reserved: entry.reserved ?? 0,
      inUse: entry.inUse ?? 0,
      warehouse: entry.warehouse,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload: InventoryForm = {
        type: form.type,
        itemId: form.type === "item" ? form.itemId : null,
        productId: form.type === "product" ? form.productId : null,
        available: Number(form.available) || 0,
        reserved: Number(form.reserved) || 0,
        inUse: Number(form.inUse) || 0,
        warehouse: form.warehouse,
      }

      const existingRecord = inventoryRecords.find((entry) => {
        if (form.type === "item") {
          return entry.itemId === form.itemId && !entry.productId
        }
        return entry.productId === form.productId && !entry.itemId
      })

      if (
        editingId &&
        !isVirtualInventoryId(editingId) &&
        inventoryRecords.some((entry) => entry.id === editingId)
      ) {
        const updated = await updateResource<InventoryRecord>("inventory", editingId, payload)
        setInventoryRecords((prev) =>
          prev.map((entry) => (entry.id === editingId ? { ...entry, ...updated } : entry)),
        )
      } else if (existingRecord) {
        const updated = await updateResource<InventoryRecord>(
          "inventory",
          existingRecord.id,
          payload,
        )
        setInventoryRecords((prev) =>
          prev.map((entry) => (entry.id === existingRecord.id ? { ...entry, ...updated } : entry)),
        )
      } else {
        const created = await createResource<InventoryRecord>("inventory", payload)
        setInventoryRecords((prev) => [...prev, created])
      }
      setDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = React.useCallback(async (id: string) => {
    if (isVirtualInventoryId(id)) return
    await deleteResource("inventory", id)
    setInventoryRecords((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const getItem = (itemId: string | null) =>
    itemId ? items.find((i) => i.id === itemId) : undefined

  const getProduct = (productId: string | null) =>
    productId ? products.find((p) => p.id === productId) : undefined

  const getEntryName = (entry: InventoryEntry) => {
    if (entry.type === "product" || entry.productId) {
      return getProduct(entry.productId)?.name ?? entry.productId ?? "—"
    }
    return getItem(entry.itemId)?.name ?? entry.itemId ?? "—"
  }

  const getEntryUnit = (entry: InventoryEntry) => {
    if (entry.type === "product" || entry.productId) {
      return getProduct(entry.productId)?.unit
    }
    return getItem(entry.itemId)?.unit
  }

  const getEntryMinimum = (entry: InventoryEntry) => {
    if (entry.type === "product" || entry.productId) return 0
    return getItem(entry.itemId)?.minimumInventory ?? 0
  }

  const getEntryTypeLabel = (entry: InventoryEntry) =>
    entry.type === "product" || entry.productId ? "Product" : "Item"

  const formatQuantityFilterText = (entry: InventoryEntry, value: number) => {
    const unit = getEntryUnit(entry) ?? ""
    return `${value} ${formatAmount(value, unit)}`.trim()
  }

  const columns = React.useMemo(
    () => [
      columnHelper.accessor(
        (row) => `${getEntryTypeLabel(row)} ${getEntryName(row)}`,
        {
          id: "name",
          header: "Item / Product",
          enableColumnFilter: true,
          filterFn: "includesString",
          meta: {
            filterPlaceholder: "Search name…",
            filterText: (row) => `${getEntryTypeLabel(row)} ${getEntryName(row)}`,
          },
          cell: ({ row }) => {
            const isProduct = row.original.type === "product" || !!row.original.productId
            return (
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{getEntryName(row.original)}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {isProduct ? "Product" : "Item"}
                </span>
              </div>
            )
          },
        },
      ),
      columnHelper.accessor("available", {
        header: "Available",
        enableColumnFilter: true,
        filterFn: "includesString",
        meta: {
          filterPlaceholder: "Search available…",
          filterText: (row) => {
            const status = getInventoryStockStatus(row.available, getEntryMinimum(row))
            return `${formatQuantityFilterText(row, row.available)} ${INVENTORY_STATUS_LABELS[status]}`
          },
        },
        cell: ({ row, getValue }) => {
          const unit = getEntryUnit(row.original)
          return <span className="tabular-nums">{formatAmount(getValue() ?? 0, unit)}</span>
        },
      }),
      columnHelper.accessor("reserved", {
        header: "Reserved",
        enableColumnFilter: true,
        filterFn: "includesString",
        meta: {
          filterPlaceholder: "Search reserved…",
          filterText: (row) => formatQuantityFilterText(row, row.reserved),
        },
        cell: ({ row, getValue }) => (
          <span className="tabular-nums">{formatAmount(getValue() ?? 0, getEntryUnit(row.original))}</span>
        ),
      }),
      columnHelper.accessor("inUse", {
        header: "In use",
        enableColumnFilter: true,
        filterFn: "includesString",
        meta: {
          filterPlaceholder: "Search in use…",
          filterText: (row) => formatQuantityFilterText(row, row.inUse),
        },
        cell: ({ row, getValue }) => (
          <span className="tabular-nums">{formatAmount(getValue() ?? 0, getEntryUnit(row.original))}</span>
        ),
      }),
      columnHelper.accessor((row) => getInventoryTotal(row), {
        id: "total",
        header: "Total",
        enableColumnFilter: true,
        filterFn: "includesString",
        meta: {
          filterPlaceholder: "Search total…",
          filterText: (row) => formatQuantityFilterText(row, getInventoryTotal(row)),
        },
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">
            {formatAmount(getInventoryTotal(row.original), getEntryUnit(row.original))}
          </span>
        ),
      }),
      columnHelper.accessor(
        (row) => INVENTORY_STATUS_LABELS[getInventoryStockStatus(row.available, getEntryMinimum(row))],
        {
          id: "status",
          header: "Status",
          enableColumnFilter: true,
          filterFn: "includesString",
          meta: {
            filterPlaceholder: "Search status…",
            filterText: (row) => {
              const status = getInventoryStockStatus(row.available, getEntryMinimum(row))
              return `${INVENTORY_STATUS_LABELS[status]} ${status.replace(/_/g, " ")}`
            },
          },
          cell: ({ row }) => {
            const minimum = getEntryMinimum(row.original)
            const status = getInventoryStockStatus(row.original.available, minimum)
            return (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${INVENTORY_STATUS_COLORS[status]}`}
                title={
                  status === "low" && minimum > 0
                    ? `Available stock is at or below minimum of ${minimum}`
                    : undefined
                }
              >
                {INVENTORY_STATUS_LABELS[status]}
              </span>
            )
          },
        },
      ),
      columnHelper.accessor((row) => getEntryMinimum(row), {
        id: "minimumInventory",
        header: "Minimum",
        enableColumnFilter: true,
        filterFn: "includesString",
        meta: {
          filterPlaceholder: "Search minimum…",
          filterText: (row) => {
            const minimum = getEntryMinimum(row)
            if (!minimum) return "— n/a product"
            return formatQuantityFilterText(row, minimum)
          },
        },
        cell: ({ row }) => {
          const minimum = getEntryMinimum(row.original)
          if (!minimum) return <span className="text-muted-foreground">—</span>
          return (
            <span className="tabular-nums text-muted-foreground">
              {formatAmount(minimum, getEntryUnit(row.original))}
            </span>
          )
        },
      }),
      columnHelper.accessor("warehouse", {
        header: "Warehouse",
        enableColumnFilter: true,
        filterFn: "includesString",
        meta: {
          filterPlaceholder: "Search warehouse…",
          filterText: (row) => row.warehouse ?? "",
        },
        cell: ({ getValue }) => getValue(),
      }),
    ],
    [items, products],
  )

  const selectedUnit =
    form.type === "product"
      ? getProduct(form.productId)?.unit
      : getItem(form.itemId)?.unit

  const editingRow = editingId ? data.find((row) => row.id === editingId) : undefined

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <ArchiveIcon className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Inventory</h1>
          <p className="text-xs text-muted-foreground">
            Raw materials and finished products across available, reserved, and in-use amounts. Use the column filters to search any field.
          </p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={openEdit}
        canDelete={(row) => row.persisted}
        getRowLabel={getEntryName}
      />

      <ResourceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingRow && !editingRow.persisted ? "Set inventory" : "Edit inventory entry"}
        description={
          editingRow
            ? `${getEntryTypeLabel(editingRow)}: ${getEntryName(editingRow)}`
            : "Update stock levels and warehouse for this catalog entry."
        }
        onSubmit={handleSave}
        submitLabel="Save changes"
        isSubmitting={isSaving}
      >
        <FormField
          label={selectedUnit ? `Available (${selectedUnit})` : "Available"}
          htmlFor="inventory-available"
        >
          <NumberInput
            id="inventory-available"
            value={form.available}
            onChange={(available) => setForm((f) => ({ ...f, available }))}
            integerOnly
          />
        </FormField>
        <FormField
          label={selectedUnit ? `Reserved (${selectedUnit})` : "Reserved"}
          htmlFor="inventory-reserved"
        >
          <NumberInput
            id="inventory-reserved"
            value={form.reserved}
            onChange={(reserved) => setForm((f) => ({ ...f, reserved }))}
            integerOnly
          />
        </FormField>
        <FormField
          label={selectedUnit ? `In use (${selectedUnit})` : "In use"}
          htmlFor="inventory-in-use"
        >
          <NumberInput
            id="inventory-in-use"
            value={form.inUse}
            onChange={(inUse) => setForm((f) => ({ ...f, inUse }))}
            integerOnly
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
