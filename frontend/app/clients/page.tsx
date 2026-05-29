"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { BuildingIcon } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { EditableCell } from "@/components/data-table/editable-cell"
import { createResource, deleteResource, fetchResource, updateResource } from "@/lib/api"

type Client = {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

const columnHelper = createColumnHelper<Client>()

const DEFAULT_CLIENT: Omit<Client, "id"> = {
  name: "New Client",
  email: "",
  phone: "",
  address: "",
}

export default function ClientsPage() {
  const [data, setData] = React.useState<Client[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    fetchResource<Client>("clients")
      .then(setData)
      .finally(() => setIsLoading(false))
  }, [])

  const handleUpdate = React.useCallback(async (id: string, field: string, value: string) => {
    const updated = await updateResource<Client>("clients", id, { [field]: value })
    setData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)))
  }, [])

  const handleDelete = React.useCallback(async (id: string) => {
    await deleteResource("clients", id)
    setData((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleAdd = React.useCallback(async () => {
    const created = await createResource<Client>("clients", DEFAULT_CLIENT)
    setData((prev) => [...prev, created])
  }, [])

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            onSave={(v) => handleUpdate(row.original.id, "name", v)}
          />
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            type="email"
            onSave={(v) => handleUpdate(row.original.id, "email", v)}
          />
        ),
      }),
      columnHelper.accessor("phone", {
        header: "Phone",
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            type="tel"
            onSave={(v) => handleUpdate(row.original.id, "phone", v)}
          />
        ),
      }),
      columnHelper.accessor("address", {
        header: "Address",
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            onSave={(v) => handleUpdate(row.original.id, "address", v)}
          />
        ),
      }),
    ],
    [handleUpdate],
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <BuildingIcon className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Clients</h1>
          <p className="text-xs text-muted-foreground">Click any cell to edit in place.</p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Add client"
      />
    </div>
  )
}
