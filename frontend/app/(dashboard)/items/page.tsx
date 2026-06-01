"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { BoxIcon } from "lucide-react"

import { OverviewPageHeader } from "@/components/dashboard/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { FormField } from "@/components/data-table/form-field"
import { ResourceFormDialog } from "@/components/data-table/resource-form-dialog"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import type { Item } from "@/domain/types"
import { useResourceCrud } from "@/hooks/use-resource-crud"
import { formatPrice } from "@/lib/pricing"

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
  const {
    data,
    isLoading,
    dialogOpen,
    setDialogOpen,
    editingId,
    form,
    setForm,
    isSaving,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  } = useResourceCrud<Item, ItemForm>({
    resource: "items",
    emptyForm: EMPTY_FORM,
    toForm: (item) => ({
      name: item.name,
      unit: item.unit,
      buyPrice: item.buyPrice,
      sellPrice: item.sellPrice,
      minimumInventory: item.minimumInventory ?? 0,
      supplier: item.supplier ?? "",
    }),
    toPayload: (form) => ({
      ...form,
      buyPrice: Number(form.buyPrice) || 0,
      sellPrice: Number(form.sellPrice) || 0,
      minimumInventory: Number(form.minimumInventory) || 0,
    }),
  })

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
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
    []
  )

  return (
    <div className="flex flex-col gap-5">
      <OverviewPageHeader
        icon={BoxIcon}
        title="Items"
        description="Raw materials and supplies. Use the edit icon or add button to manage records."
      />

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
        description={
          editingId
            ? "Update this item and save your changes."
            : "Fill in the details for the new item."
        }
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
            onChange={(minimumInventory) =>
              setForm((f) => ({ ...f, minimumInventory }))
            }
            integerOnly
          />
        </FormField>
        <FormField label="Supplier" htmlFor="item-supplier">
          <Input
            id="item-supplier"
            value={form.supplier}
            onChange={(e) =>
              setForm((f) => ({ ...f, supplier: e.target.value }))
            }
          />
        </FormField>
      </ResourceFormDialog>
    </div>
  )
}
