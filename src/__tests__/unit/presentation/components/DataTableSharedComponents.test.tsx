import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";

import { DataTable } from "@/components/shared/DataTable";
import {
  EnhancedTable,
  EnhancedTableHeader,
  EnhancedTableRow,
  EnhancedTableHead,
  EnhancedTableCell,
  TableBody,
} from "@/components/shared/DataTable/EnhancedTable";
import { TableSkeleton } from "@/components/shared/DataTable/TableSkeleton";
import {
  EnhancedEmptyState,
  EmptySearchResults,
} from "@/components/shared/DataTable/EnhancedEmptyState";
import {
  BulkActionsBar,
  BulkActions,
} from "@/components/shared/DataTable/BulkActionsBar";

interface RowData {
  id: string;
  name: string;
}

const columns: ColumnDef<RowData>[] = [
  {
    accessorKey: "name",
    header: "Nama",
    cell: ({ row }) => row.original.name,
  },
];

describe("DataTable", () => {
  it("menampilkan data baris", () => {
    render(
      <DataTable<RowData>
        columns={columns}
        data={[{ id: "1", name: "Alice" }]}
        showPagination={false}
        showToolbar={false}
      />,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Nama")).toBeInTheDocument();
  });

  it("menampilkan empty state message saat data kosong", () => {
    render(
      <DataTable<RowData>
        columns={columns}
        data={[]}
        emptyMessage="Tidak ada data"
        showPagination={false}
      />,
    );

    expect(screen.getByText("Tidak ada data")).toBeInTheDocument();
  });

  it("memanggil callback row selection ketika enableRowSelection aktif", () => {
    const onRowSelectionChange = vi.fn();

    render(
      <DataTable<RowData>
        columns={columns}
        data={[{ id: "1", name: "Alice" }]}
        enableRowSelection
        onRowSelectionChange={onRowSelectionChange}
      />,
    );

    expect(onRowSelectionChange).toHaveBeenCalled();
  });
});

describe("EnhancedTable", () => {
  it("merender struktur tabel enhanced", () => {
    render(
      <EnhancedTable>
        <EnhancedTableHeader>
          <EnhancedTableRow>
            <EnhancedTableHead>Nama</EnhancedTableHead>
          </EnhancedTableRow>
        </EnhancedTableHeader>
        <TableBody>
          <EnhancedTableRow>
            <EnhancedTableCell>Bob</EnhancedTableCell>
          </EnhancedTableRow>
        </TableBody>
      </EnhancedTable>,
    );

    expect(screen.getByText("Nama")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});

describe("TableSkeleton", () => {
  it("merender skeleton sesuai jumlah row dan column", () => {
    const { container } = render(<TableSkeleton rows={3} columns={4} />);
    // 1 header row + 3 body rows
    expect(container.querySelectorAll("tr")).toHaveLength(4);
  });
});

describe("EnhancedEmptyState", () => {
  it("menampilkan title, deskripsi, dan action", () => {
    const onClick = vi.fn();

    render(
      <EnhancedEmptyState
        icon={Users}
        title="Tidak ada user"
        description="Silakan tambah user baru"
        action={{ label: "Tambah", onClick }}
      />,
    );

    expect(screen.getByText("Tidak ada user")).toBeInTheDocument();
    expect(screen.getByText("Silakan tambah user baru")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("EmptySearchResults menampilkan state pencarian kosong", () => {
    render(<EmptySearchResults />);

    expect(screen.getByText("Tidak ada hasil ditemukan")).toBeInTheDocument();
  });
});

describe("BulkActionsBar", () => {
  it("tidak merender apapun jika selectedCount = 0", () => {
    const { container } = render(
      <BulkActionsBar
        selectedCount={0}
        onClearSelection={vi.fn()}
        isAllSelected={false}
        isSomeSelected={false}
        onSelectAll={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("menampilkan jumlah selected dan menjalankan action", () => {
    const onClearSelection = vi.fn();
    const onDelete = vi.fn();

    render(
      <BulkActionsBar
        selectedCount={2}
        onClearSelection={onClearSelection}
        isAllSelected={false}
        isSomeSelected={true}
        onSelectAll={vi.fn()}
        actions={[BulkActions.delete(onDelete, 2)]}
      />,
    );

    expect(screen.getByText(/2 items selected/i)).toBeInTheDocument();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Clear/i }));
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });
});
