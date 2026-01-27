/**
 * Admin Mahasiswa Management Page
 *
 * Fitur:
 * - View semua mahasiswa
 * - Filter by angkatan, program studi, semester
 * - Update semester individual atau bulk
 * - View mahasiswa details
 */

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Filter,
  RefreshCw,
  Loader2,
  Download,
  GraduationCap,
  Search,
  Users,
  UserCheck,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TableBody } from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/DataTable/TableSkeleton";
import {
  EnhancedTable,
  EnhancedTableHeader,
  EnhancedTableRow,
  EnhancedTableHead,
  EnhancedTableCell,
} from "@/components/shared/DataTable/EnhancedTable";
import {
  EnhancedEmptyState,
  EmptySearchResults,
} from "@/components/shared/DataTable/EnhancedEmptyState";
import { useRowSelection } from "@/components/shared/DataTable/useRowSelection";
import { useTableExport } from "@/components/shared/DataTable/useTableExport";
import { ColumnVisibilityDropdown } from "@/components/shared/DataTable/ColumnVisibility";
import {
  BulkActionsBar,
  BulkActions,
} from "@/components/shared/DataTable/BulkActionsBar";
import {
  RowSelectionHeader,
  RowSelectionCell,
} from "@/components/shared/DataTable/RowSelectionColumn";

import { UpdateSemesterDialog } from "@/components/admin/UpdateSemesterDialog";

// ============================================================================
// TYPES
// ============================================================================

interface Mahasiswa {
  id: string;
  nim: string;
  angkatan: number;
  semester: number;
  program_studi: string;
  users?: {
    full_name: string;
    email: string;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminMahasiswaPage() {
  const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAngkatan, setFilterAngkatan] = useState<string>("");
  const [filterSemester, setFilterSemester] = useState<string>("");
  const [filterProgram, setFilterProgram] = useState<string>("");

  // Dialog state
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<Mahasiswa | null>(
    null,
  );

  // UI state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Phase 2: Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    select: true,
    nama: true,
    nim: true,
    angkatan: true,
    semester: true,
    program: true,
    email: true,
    actions: true,
  });

  // Phase 2: Export functionality
  const { exportToCSV } = useTableExport<Mahasiswa>();

  useEffect(() => {
    loadMahasiswa();
  }, []);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const loadMahasiswa = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace dengan actual API call
      // const data = await getAllMahasiswa();
      // setMahasiswaList(data);

      // Mock data untuk sekarang
      setMahasiswaList([
        {
          id: "1",
          nim: "BD2321001",
          angkatan: 2022,
          semester: 1,
          program_studi: "Kebidanan",
          users: { full_name: "Siti Nurhaliza", email: "siti@student.ac.id" },
        },
        {
          id: "2",
          nim: "BD2321002",
          angkatan: 2022,
          semester: 1,
          program_studi: "Kebidanan",
          users: { full_name: "Ahmad Suryadi", email: "ahmad@student.ac.id" },
        },
      ]);
    } catch (error) {
      toast.error("Gagal memuat data mahasiswa");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOpenUpdateDialog = (mahasiswa: Mahasiswa) => {
    setSelectedMahasiswa(mahasiswa);
    setShowUpdateDialog(true);
  };

  const handleUpdateSuccess = () => {
    setShowUpdateDialog(false);
    loadMahasiswa();
  };

  const handleToggleRow = (mahasiswaId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(mahasiswaId)) {
      newSelected.delete(mahasiswaId);
    } else {
      newSelected.add(mahasiswaId);
    }
    setSelectedRows(newSelected);
  };

  const handleToggleAllRows = () => {
    if (selectedRows.size === filteredList.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredList.map((m) => m.id)));
    }
  };

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredList = mahasiswaList.filter((m) => {
    let match = true;

    if (search) {
      const lower = search.toLowerCase();
      const nameMatch =
        m.users?.full_name?.toLowerCase().includes(lower) ?? false;
      const nimMatch = m.nim?.toLowerCase().includes(lower) ?? false;
      const emailMatch = m.users?.email?.toLowerCase().includes(lower) ?? false;
      match = nameMatch || nimMatch || emailMatch;
    }

    if (filterAngkatan && m.angkatan !== parseInt(filterAngkatan)) {
      match = false;
    }

    if (filterSemester && m.semester !== parseInt(filterSemester)) {
      match = false;
    }

    if (filterProgram && m.program_studi !== filterProgram) {
      match = false;
    }

    return match;
  });

  // Phase 2: Row selection - must be at top level, not inside conditional render
  const rowSelection = useRowSelection({
    data: filteredList,
    getKey: (m) => m.id,
  });

  // Phase 2: Export handler
  const handleExport = () => {
    exportToCSV({
      columns: [
        { key: "nim", label: "NIM" },
        {
          key: "users",
          label: "Nama",
          formatter: (val) => val?.full_name || "",
        },
        { key: "angkatan", label: "Angkatan" },
        { key: "semester", label: "Semester" },
        { key: "program_studi", label: "Program Studi" },
        { key: "users", label: "Email", formatter: (val) => val?.email || "" },
      ],
      data: filteredList,
      filename: `mahasiswa-${new Date().toISOString().split("T")[0]}`,
    });
    toast.success(`Exported ${filteredList.length} mahasiswa to CSV`);
  };

  // Phase 2: Bulk update semester handler
  const handleBulkUpdateSemester = async (selectedMahasiswa: Mahasiswa[]) => {
    // TODO: Implement bulk update API call
    toast.success(
      `Bulk update semester for ${selectedMahasiswa.length} mahasiswa`,
    );
  };

  const programList = [...new Set(mahasiswaList.map((m) => m.program_studi))];
  const angkatanList = [...new Set(mahasiswaList.map((m) => m.angkatan))].sort(
    (a, b) => b - a,
  );

  // Statistics
  const stats = {
    total: mahasiswaList.length,
    active: mahasiswaList.filter((m) => m.semester > 0).length,
    programs: programList.length,
    angkatan: angkatanList.length,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold">Manajemen Mahasiswa</h1>
          <p className="text-lg font-semibold text-muted-foreground mt-2">
            Kelola data mahasiswa, update semester, dan tracking akademik
          </p>
        </div>
        <Button
          onClick={loadMahasiswa}
          variant="outline"
          className="border-2 font-semibold"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-linear-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold text-white">
              Total Mahasiswa
            </CardTitle>
            <Users className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold text-white">
              Mahasiswa Aktif
            </CardTitle>
            <UserCheck className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold text-white">
              Program Studi
            </CardTitle>
            <BookOpen className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.programs}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold text-white">
              Angkatan
            </CardTitle>
            <GraduationCap className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.angkatan}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-3 p-6">
          <CardTitle className="text-lg font-bold">Filter & Cari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIM, atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterAngkatan} onValueChange={setFilterAngkatan}>
              <SelectTrigger>
                <SelectValue placeholder="Angkatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Angkatan</SelectItem>
                {angkatanList.map((tahun) => (
                  <SelectItem key={tahun} value={tahun.toString()}>
                    {tahun}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSemester} onValueChange={setFilterSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Semester</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <SelectItem key={sem} value={sem.toString()}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Program Studi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Program</SelectItem>
                {programList.map((program) => (
                  <SelectItem key={program} value={program}>
                    {program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setFilterAngkatan("");
                setFilterSemester("");
                setFilterProgram("");
              }}
              className="font-semibold border-2"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-bold">Daftar Mahasiswa</CardTitle>
          <CardDescription className="text-base font-semibold mt-1">
            Kelola data mahasiswa dan update semester
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <TableSkeleton
              rows={5}
              columns={8}
              columnWidths={[
                "50px",
                "200px",
                "120px",
                "100px",
                "80px",
                "180px",
                "200px",
                "100px",
              ]}
            />
          ) : filteredList.length === 0 ? (
            search || filterAngkatan || filterSemester || filterProgram ? (
              <EmptySearchResults
                onClear={() => {
                  setSearch("");
                  setFilterAngkatan("");
                  setFilterSemester("");
                  setFilterProgram("");
                }}
              />
            ) : (
              <EnhancedEmptyState
                icon={GraduationCap}
                title="Belum ada data mahasiswa"
                description="Mulai dengan menambahkan data mahasiswa ke dalam sistem."
              />
            )
          ) : (
            <>
              {/* Bulk Actions Bar */}
              <BulkActionsBar
                selectedCount={rowSelection.selectedCount}
                onClearSelection={rowSelection.clearSelection}
                isAllSelected={rowSelection.isAllSelected}
                isSomeSelected={rowSelection.isSomeSelected}
                onSelectAll={rowSelection.toggleAll}
                actions={[
                  {
                    label: "Update Semester",
                    icon: Edit2,
                    onClick: () =>
                      handleBulkUpdateSemester(rowSelection.selectedItems),
                    variant: "outline",
                  },
                ]}
              />

              {/* Toolbar with Export and Column Visibility */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {filteredList.length} mahasiswa
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="font-semibold"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <ColumnVisibilityDropdown
                    columns={[
                      {
                        id: "select",
                        label: "Select",
                        visible: columnVisibility.select,
                      },
                      {
                        id: "nama",
                        label: "Nama",
                        visible: columnVisibility.nama,
                      },
                      {
                        id: "nim",
                        label: "NIM",
                        visible: columnVisibility.nim,
                      },
                      {
                        id: "angkatan",
                        label: "Angkatan",
                        visible: columnVisibility.angkatan,
                      },
                      {
                        id: "semester",
                        label: "Semester",
                        visible: columnVisibility.semester,
                      },
                      {
                        id: "program",
                        label: "Program Studi",
                        visible: columnVisibility.program,
                      },
                      {
                        id: "email",
                        label: "Email",
                        visible: columnVisibility.email,
                      },
                      {
                        id: "actions",
                        label: "Aksi",
                        visible: columnVisibility.actions,
                      },
                    ]}
                    onColumnToggle={(columnId) => {
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [columnId]: !prev[columnId as keyof typeof prev],
                      }));
                    }}
                  />
                </div>
              </div>

              <EnhancedTable>
                <EnhancedTableHeader>
                  <EnhancedTableRow>
                    {columnVisibility.select && (
                      <EnhancedTableHead className="w-[50px]">
                        <RowSelectionHeader
                          checked={rowSelection.isAllSelected}
                          indeterminate={rowSelection.isSomeSelected}
                          onCheckedChange={rowSelection.toggleAll}
                        />
                      </EnhancedTableHead>
                    )}
                    {columnVisibility.nama && (
                      <EnhancedTableHead>Nama</EnhancedTableHead>
                    )}
                    {columnVisibility.nim && (
                      <EnhancedTableHead>NIM</EnhancedTableHead>
                    )}
                    {columnVisibility.angkatan && (
                      <EnhancedTableHead>Angkatan</EnhancedTableHead>
                    )}
                    {columnVisibility.semester && (
                      <EnhancedTableHead>Semester</EnhancedTableHead>
                    )}
                    {columnVisibility.program && (
                      <EnhancedTableHead>Program Studi</EnhancedTableHead>
                    )}
                    {columnVisibility.email && (
                      <EnhancedTableHead>Email</EnhancedTableHead>
                    )}
                    {columnVisibility.actions && (
                      <EnhancedTableHead>Aksi</EnhancedTableHead>
                    )}
                  </EnhancedTableRow>
                </EnhancedTableHeader>
                <TableBody>
                  {filteredList.map((mhs) => (
                    <EnhancedTableRow key={mhs.id}>
                      {columnVisibility.select && (
                        <EnhancedTableCell>
                          <RowSelectionCell
                            checked={rowSelection.isSelected(mhs)}
                            onCheckedChange={() => rowSelection.toggleRow(mhs)}
                          />
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.nama && (
                        <EnhancedTableCell className="font-medium">
                          {mhs.users?.full_name}
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.nim && (
                        <EnhancedTableCell>{mhs.nim}</EnhancedTableCell>
                      )}
                      {columnVisibility.angkatan && (
                        <EnhancedTableCell>
                          <Badge variant="outline">{mhs.angkatan}</Badge>
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.semester && (
                        <EnhancedTableCell>
                          <Badge>{mhs.semester}</Badge>
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.program && (
                        <EnhancedTableCell>
                          {mhs.program_studi}
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.email && (
                        <EnhancedTableCell className="text-sm text-muted-foreground">
                          {mhs.users?.email}
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.actions && (
                        <EnhancedTableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenUpdateDialog(mhs)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </EnhancedTableCell>
                      )}
                    </EnhancedTableRow>
                  ))}
                </TableBody>
              </EnhancedTable>
            </>
          )}
        </CardContent>
      </Card>

      {/* Update Semester Dialog */}
      {selectedMahasiswa && (
        <UpdateSemesterDialog
          open={showUpdateDialog}
          onOpenChange={setShowUpdateDialog}
          mahasiswa={{
            id: selectedMahasiswa.id,
            nim: selectedMahasiswa.nim,
            full_name: selectedMahasiswa.users?.full_name || "N/A",
            angkatan: selectedMahasiswa.angkatan,
            semester: selectedMahasiswa.semester,
            program_studi: selectedMahasiswa.program_studi,
          }}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
