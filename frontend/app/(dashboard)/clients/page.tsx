"use client"

import * as React from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { BuildingIcon } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { FormField } from "@/components/data-table/form-field"
import { ResourceFormDialog } from "@/components/data-table/resource-form-dialog"
import { Input } from "@/components/ui/input"
import { useResourceCrud } from "@/hooks/use-resource-crud"
import type { Client } from "@/domain/types"

type ClientForm = Omit<Client, "id">

const columnHelper = createColumnHelper<Client>()

const EMPTY_FORM: ClientForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
}

export default function ClientsPage() {
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
  } = useResourceCrud<Client, ClientForm>({
    resource: "clients",
    emptyForm: EMPTY_FORM,
    toForm: (client) => ({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
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
      columnHelper.accessor("email", {
        header: "Email",
        meta: { filterText: (row) => row.email ?? "" },
        cell: ({ getValue }) => getValue() || "—",
      }),
      columnHelper.accessor("phone", {
        header: "Phone",
        meta: { filterText: (row) => row.phone ?? "" },
        cell: ({ getValue }) => getValue() || "—",
      }),
      columnHelper.accessor("address", {
        header: "Address",
        meta: { filterText: (row) => row.address ?? "" },
        cell: ({ getValue }) => (
          <span
            className="block max-w-[200px] truncate text-muted-foreground"
            title={getValue()}
          >
            {getValue() || "—"}
          </span>
        ),
      }),
    ],
    []
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardPageHeader
        icon={BuildingIcon}
        title="Clients"
        description="Customer accounts. Use the edit icon or add button to manage records."
      />

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onDelete={handleDelete}
        onAddClick={openCreate}
        onEdit={openEdit}
        addLabel="Add client"
        getRowLabel={(row) => row.name}
      />

      <ResourceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "Edit client" : "Add client"}
        description={
          editingId
            ? "Update this client and save your changes."
            : "Fill in the details for the new client."
        }
        onSubmit={handleSave}
        submitLabel={editingId ? "Save changes" : "Create client"}
        isSubmitting={isSaving}
      >
        <FormField label="Name" htmlFor="client-name">
          <Input
            id="client-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Email" htmlFor="client-email">
          <Input
            id="client-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </FormField>
        <FormField label="Phone" htmlFor="client-phone">
          <Input
            id="client-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </FormField>
        <FormField label="Address" htmlFor="client-address">
          <Input
            id="client-address"
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
          />
        </FormField>
      </ResourceFormDialog>
    </div>
  )
}
