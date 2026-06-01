"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { PackageIcon } from "lucide-react"

import { OverviewPageHeader } from "@/components/dashboard/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { ExpandedDetailColumn } from "@/components/data-table/expanded-detail-column"
import { FormField } from "@/components/data-table/form-field"
import { LineItemsEditor } from "@/components/forms/line-items-editor"
import { ResourceFormDialog } from "@/components/data-table/resource-form-dialog"
import { SelectField } from "@/components/forms/select-field"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { useLineItemsField } from "@/hooks/use-line-items-field"
import {
  createResource,
  deleteResource,
  fetchResource,
  updateResource,
} from "@/lib/api"
import { useResourceSync } from "@/providers"
import { computeProductTotalCost, formatPrice } from "@/lib/pricing"

type Component = { itemId: string; amount: number }

type Product = {
  id: string
  name: string
  unit: string
  clientId: string | null
  sellPrice: number
  components: Component[]
}

type Item = { id: string; name: string; unit: string; buyPrice: number }
type Client = { id: string; name: string }

type ProductForm = Omit<Product, "id">

const columnHelper = createColumnHelper<Product>()

const EMPTY_FORM: ProductForm = {
  name: "",
  unit: "barrels",
  clientId: null,
  sellPrice: 0,
  components: [],
}

const PRODUCTS_TABLE_COLGROUP = (
  <colgroup>
    <col className="w-8" />
    <col style={{ width: "18%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "16%" }} />
    <col />
    <col style={{ width: "7rem" }} />
    <col style={{ width: "7rem" }} />
    <col className="w-[88px]" />
  </colgroup>
)

const priceCellClassName = "block text-right tabular-nums pr-8"

function buildProductExpandedCells(
  components: Component[],
  items: Item[]
): (React.ReactNode | null)[] {
  if (!components.length) {
    return [
      null,
      null,
      null,
      <p key="empty-components" className="text-xs text-muted-foreground">
        No components in this recipe.
      </p>,
      null,
      null,
    ]
  }

  const rows = components.map((component, index) => {
    const item = items.find((i) => i.id === component.itemId)
    const lineCost = (item?.buyPrice ?? 0) * component.amount
    return {
      key: `${component.itemId}-${index}`,
      name: item?.name ?? component.itemId,
      amount: component.amount,
      unit: item?.unit,
      lineCost,
    }
  })

  return [
    null,
    null,
    null,
    <ExpandedDetailColumn key="item" label="Item">
      {rows.map((row) => (
        <span
          key={row.key}
          className="block min-w-0 truncate text-xs font-medium"
        >
          {row.name}
        </span>
      ))}
    </ExpandedDetailColumn>,
    <ExpandedDetailColumn key="amount" label="Amount" align="right">
      {rows.map((row) => (
        <span
          key={row.key}
          className="text-xs text-muted-foreground tabular-nums"
        >
          {row.amount}
          {row.unit ? ` ${row.unit}` : ""}
        </span>
      ))}
    </ExpandedDetailColumn>,
    <ExpandedDetailColumn key="cost" label="Line cost" align="right">
      {rows.map((row) => (
        <span
          key={row.key}
          className="text-xs text-muted-foreground tabular-nums"
        >
          {formatPrice(row.lineCost)}
        </span>
      ))}
    </ExpandedDetailColumn>,
  ]
}

export default function ProductsPage() {
  const [data, setData] = React.useState<Product[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [clients, setClients] = React.useState<Client[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<ProductForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = React.useState(false)
  const syncToken = useResourceSync("products", "items", "clients")

  React.useEffect(() => {
    Promise.all([
      fetchResource<Product>("products"),
      fetchResource<Item>("items"),
      fetchResource<Client>("clients"),
    ])
      .then(([products, itemList, clientList]) => {
        setData(products)
        setItems(itemList)
        setClients(clientList)
      })
      .finally(() => setIsLoading(false))
  }, [syncToken])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      unit: product.unit,
      clientId: product.clientId,
      sellPrice: product.sellPrice,
      components: product.components.map((c) => ({ ...c })),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        ...form,
        clientId: form.clientId || null,
        sellPrice: Number(form.sellPrice) || 0,
      }
      if (editingId) {
        const updated = await updateResource<Product>(
          "products",
          editingId,
          payload
        )
        setData((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p))
        )
      } else {
        const created = await createResource<Product>("products", payload)
        setData((prev) => [...prev, created])
      }
      setDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = React.useCallback(async (id: string) => {
    await deleteResource("products", id)
    setData((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const summarizeComponents = React.useCallback(
    (components: Component[]) => {
      if (!components?.length) return "No components"
      return components
        .map((c) => {
          const item = items.find((i) => i.id === c.itemId)
          return `${item?.name ?? c.itemId} × ${c.amount}`
        })
        .join(", ")
    },
    [items]
  )

  const itemOptions = items.map((i) => ({ id: i.id, label: i.name }))
  const setComponents = React.useCallback(
    (updater: (components: Component[]) => Component[]) => {
      setForm((f) => ({ ...f, components: updater(f.components) }))
    },
    []
  )
  const componentLines = useLineItemsField(
    form.components,
    setComponents,
    React.useCallback(
      () => ({ itemId: items[0]?.id ?? "", amount: 0 }),
      [items]
    )
  )

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
      columnHelper.accessor("clientId", {
        header: "Client",
        meta: {
          filterText: (row) => {
            if (!row.clientId) return "Standard catalog"
            return (
              clients.find((c) => c.id === row.clientId)?.name ?? row.clientId
            )
          },
        },
        cell: ({ getValue }) => {
          const clientId = getValue()
          if (!clientId) {
            return (
              <span className="text-xs text-muted-foreground">
                Standard catalog
              </span>
            )
          }
          const client = clients.find((c) => c.id === clientId)
          return (
            <span className="text-xs font-medium">
              {client?.name ?? clientId}
            </span>
          )
        },
      }),
      columnHelper.accessor("components", {
        header: "Components",
        meta: {
          filterText: (row) => summarizeComponents(row.components),
        },
        cell: ({ getValue }) => (
          <span
            className="block truncate text-xs text-muted-foreground"
            title={summarizeComponents(getValue())}
          >
            {summarizeComponents(getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "totalCost",
        header: () => (
          <span className={`${priceCellClassName} text-muted-foreground`}>
            Total cost
          </span>
        ),
        meta: {
          filterText: (row) =>
            formatPrice(computeProductTotalCost(row.components, items)),
        },
        cell: ({ row }) => (
          <span className={`${priceCellClassName} text-muted-foreground`}>
            {formatPrice(
              computeProductTotalCost(row.original.components, items)
            )}
          </span>
        ),
      }),
      columnHelper.accessor("sellPrice", {
        header: () => (
          <span className={`${priceCellClassName} font-medium`}>Sell price</span>
        ),
        meta: {
          filterText: (row) => `${formatPrice(row.sellPrice)} ${row.sellPrice}`,
        },
        cell: ({ getValue }) => (
          <span className={`${priceCellClassName} font-medium`}>
            {formatPrice(getValue())}
          </span>
        ),
      }),
    ],
    [summarizeComponents, clients, items]
  )

  const renderExpandedRowCells = React.useCallback(
    (product: Product) => buildProductExpandedCells(product.components, items),
    [items]
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <OverviewPageHeader
        icon={PackageIcon}
        title="Products"
        description="Finished paint sold in barrels. Click a row to expand its recipe; use the edit icon to change details."
      />

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onDelete={handleDelete}
        onAddClick={openCreate}
        onEdit={openEdit}
        addLabel="Add product"
        getRowLabel={(row) => row.name}
        singleExpand
        colgroup={PRODUCTS_TABLE_COLGROUP}
        renderExpandedRowCells={renderExpandedRowCells}
      />

      <ResourceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "Edit product" : "Add product"}
        description={
          editingId
            ? "Update this product and its recipe, then save your changes."
            : "Fill in the product details and recipe components."
        }
        onSubmit={handleSave}
        submitLabel={editingId ? "Save changes" : "Create product"}
        isSubmitting={isSaving}
        className="sm:max-w-lg"
      >
        <FormField label="Name" htmlFor="product-name">
          <Input
            id="product-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Unit" htmlFor="product-unit">
          <Input
            id="product-unit"
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Sell price" htmlFor="product-sell-price">
          <NumberInput
            id="product-sell-price"
            value={form.sellPrice}
            onChange={(sellPrice) => setForm((f) => ({ ...f, sellPrice }))}
          />
        </FormField>
        <FormField label="Total cost" htmlFor="product-total-cost">
          <Input
            id="product-total-cost"
            value={formatPrice(computeProductTotalCost(form.components, items))}
            readOnly
            className="bg-muted/40 tabular-nums"
          />
        </FormField>
        <FormField label="Client" htmlFor="product-client">
          <SelectField
            id="product-client"
            value={form.clientId ?? ""}
            onChange={(clientId) =>
              setForm((f) => ({ ...f, clientId: clientId || null }))
            }
          >
            <option value="">Standard catalog</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </SelectField>
        </FormField>
        <LineItemsEditor
          items={form.components}
          options={itemOptions}
          getOptionId={(c) => c.itemId}
          getQuantity={(c) => c.amount}
          setOptionId={(index, itemId) =>
            componentLines.setLine(index, (component) => ({
              ...component,
              itemId,
            }))
          }
          setQuantity={(index, amount) =>
            componentLines.setLine(index, (component) => ({
              ...component,
              amount,
            }))
          }
          addItem={componentLines.addItem}
          removeItem={componentLines.removeItem}
          optionLabel="Component"
          quantityLabel="Amount"
        />
      </ResourceFormDialog>
    </div>
  )
}
