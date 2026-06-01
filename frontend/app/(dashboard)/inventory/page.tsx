"use client"

import * as React from "react"
import { ArchiveIcon, Box, Check, Clock, Layers, Warehouse } from "lucide-react"

import { OverviewPageHeader } from "@/components/dashboard/page-header"
import {
  CategoryTile,
  InventoryLegend,
  RestockPanel,
  SummaryCard,
} from "@/components/features/inventory"
import { FormField } from "@/components/data-table/form-field"
import { ResourceFormDialog } from "@/components/data-table/resource-form-dialog"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fetchResource,
  createResource,
} from "@/lib/api"
import {
  buildBarItems,
  computeInventoryKpis,
  formatInventoryNumber,
  getLowStockItems,
  splitByType,
} from "@/lib/inventory-dashboard"
import {
  buildAdjustmentMovements,
  computeInventoryFromMovements,
  type InventoryMovement,
} from "@/lib/inventory-ledger"
import {
  buildInventoryRows,
  isVirtualInventoryId,
  type InventoryEntry,
} from "@/lib/inventory-rows"
import { useResourceSync } from "@/providers"

type InventoryRecord = Omit<InventoryEntry, "persisted">

type Item = { id: string; name: string; unit: string; minimumInventory: number }
type Product = { id: string; name: string; unit: string }

type InventoryForm = Omit<InventoryRecord, "id" | "type"> & {
  type: "item" | "product"
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
  const [movementRecords, setMovementRecords] = React.useState<
    InventoryMovement[]
  >([])
  const [inventoryRecords, setInventoryRecords] = React.useState<
    InventoryRecord[]
  >([])
  const [items, setItems] = React.useState<Item[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<InventoryForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = React.useState(false)
  const syncToken = useResourceSync("inventory_movements", "items", "products")

  const data = React.useMemo(
    () => buildInventoryRows(items, products, inventoryRecords),
    [items, products, inventoryRecords]
  )

  const barItems = React.useMemo(
    () => buildBarItems(data, items, products),
    [data, items, products]
  )

  const { rawMaterials, finishedProducts } = React.useMemo(
    () => splitByType(barItems),
    [barItems]
  )

  const kpis = React.useMemo(() => computeInventoryKpis(barItems), [barItems])
  const lowStockItems = React.useMemo(
    () => getLowStockItems(barItems),
    [barItems]
  )

  React.useEffect(() => {
    Promise.all([
      fetchResource<InventoryMovement>("inventory_movements"),
      fetchResource<Item>("items"),
      fetchResource<Product>("products"),
    ])
      .then(([movements, itemList, productList]) => {
        setMovementRecords(movements)
        const derived = computeInventoryFromMovements(movements)
        setInventoryRecords(
          derived.map((entry) => ({
            ...entry,
            type: entry.type ?? (entry.productId ? "product" : "item"),
            itemId: entry.itemId ?? null,
            productId: entry.productId ?? null,
          }))
        )
        setItems(itemList)
        setProducts(productList)
      })
      .catch(() => {
        // Keep showing the last loaded data if a refresh fails.
      })
      .finally(() => setIsLoading(false))
  }, [syncToken])

  const getItem = React.useCallback(
    (itemId: string | null | undefined) =>
      itemId ? items.find((i) => i.id === itemId) : undefined,
    [items]
  )

  const getProduct = React.useCallback(
    (productId: string | null | undefined) =>
      productId ? products.find((p) => p.id === productId) : undefined,
    [products]
  )

  const getEntryName = React.useCallback(
    (entry: InventoryEntry) => {
      if (entry.type === "product" || entry.productId) {
        return getProduct(entry.productId)?.name ?? entry.productId ?? "—"
      }
      return getItem(entry.itemId)?.name ?? entry.itemId ?? "—"
    },
    [getItem, getProduct]
  )

  const getEntryTypeLabel = React.useCallback(
    (entry: InventoryEntry) =>
      entry.type === "product" || entry.productId ? "Product" : "Item",
    []
  )

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

      const now = new Date().toISOString()
      const current = inventoryRecords.find((entry) => {
        const matchEntity =
          form.type === "product"
            ? entry.productId === payload.productId
            : entry.itemId === payload.itemId
        return matchEntity && entry.warehouse === payload.warehouse
      }) ?? {
        available: 0,
        reserved: 0,
        inUse: 0,
      }

      const moves = buildAdjustmentMovements({
        movementRecords,
        ts: now,
        entityType: payload.type,
        itemId: payload.type === "item" ? payload.itemId : null,
        productId: payload.type === "product" ? payload.productId : null,
        warehouse: payload.warehouse,
        current,
        desired: payload,
        refType: "manual",
        note: "Inventory adjustment",
      })

      if (moves.length > 0) {
        const created = await Promise.all(
          moves.map((m) =>
            createResource<InventoryMovement>(
              "inventory_movements",
              m as unknown as Omit<InventoryMovement, "id">
            )
          )
        )
        const mergedMovements = [...movementRecords, ...created]
        setMovementRecords(mergedMovements)
        const derived = computeInventoryFromMovements(mergedMovements)
        setInventoryRecords(
          derived.map((entry) => ({
            ...entry,
            type: entry.type ?? (entry.productId ? "product" : "item"),
            itemId: entry.itemId ?? null,
            productId: entry.productId ?? null,
          }))
        )
      }

      setDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedUnit =
    form.type === "product"
      ? getProduct(form.productId)?.unit
      : getItem(form.itemId)?.unit

  const editingRow = editingId
    ? data.find((row) => row.id === editingId)
    : undefined

  const utilizationSublabel =
    kpis.totalCapacity > 0
      ? `${formatInventoryNumber(kpis.totalAvailable + kpis.totalReserved)} / ${formatInventoryNumber(kpis.totalCapacity)} units`
      : "—"

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-20 w-full max-w-xl rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-[92px] rounded-[20px]" />
          <Skeleton className="h-[92px] rounded-[20px]" />
          <Skeleton className="h-[92px] rounded-[20px]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-96 rounded-[22px]" />
          <Skeleton className="h-96 rounded-[22px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <OverviewPageHeader
        icon={ArchiveIcon}
        title="Inventory"
        description="Raw materials and finished products at a glance. Click any row to edit stock levels. Items at or below their minimum appear in the restock panel below."
      />

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
        <div className="animate-fade-up-d1">
          <SummaryCard
            Icon={Check}
            label="Available"
            value={kpis.totalAvailable}
            sublabel="ready to fulfill"
            colorKey="green"
          />
        </div>
        <div className="animate-fade-up-d1">
          <SummaryCard
            Icon={Clock}
            label="Reserved"
            value={kpis.totalReserved}
            sublabel="allocated to orders"
            colorKey="blue"
          />
        </div>
        <div className="animate-fade-up-d2">
          <SummaryCard
            Icon={Warehouse}
            label="Warehouse utilization"
            value={kpis.utilizationPct ?? "—"}
            suffix={kpis.utilizationPct !== null ? "%" : undefined}
            sublabel={utilizationSublabel}
            colorKey="purple"
          />
        </div>
      </div>

      <InventoryLegend />

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <div className="animate-fade-up-d2">
          <CategoryTile
            title="Raw materials"
            Icon={Layers}
            accentKey="purple"
            items={rawMaterials}
            onItemClick={(item) => openEdit(item.entry)}
          />
        </div>
        <div className="animate-fade-up-d3">
          <CategoryTile
            title="Finished products"
            Icon={Box}
            accentKey="blue"
            items={finishedProducts}
            onItemClick={(item) => openEdit(item.entry)}
          />
        </div>
      </div>

      <ResourceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={
          editingRow && !editingRow.persisted
            ? "Set inventory"
            : "Edit inventory entry"
        }
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
            onChange={(e) =>
              setForm((f) => ({ ...f, warehouse: e.target.value }))
            }
            required
          />
        </FormField>
      </ResourceFormDialog>
    </div>
  )
}
