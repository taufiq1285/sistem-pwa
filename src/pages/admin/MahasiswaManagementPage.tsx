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
import { Plus, Edit2, Trash2, Filter, RefreshCw, Loader2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

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

  const programList = [...new Set(mahasiswaList.map((m) => m.program_studi))];
  const angkatanList = [...new Set(mahasiswaList.map((m) => m.angkatan))].sort(
    (a, b) => b - a,
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Mahasiswa</h1>
          <p className="text-muted-foreground mt-1">
            Total {filteredList.length} mahasiswa
          </p>
        </div>
        <Button onClick={loadMahasiswa} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter & Cari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Input
                placeholder="Cari nama, NIM, atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Daftar Mahasiswa</CardTitle>
              <CardDescription>
                {selectedRows.size > 0 && `${selectedRows.size} dipilih`}
              </CardDescription>
            </div>
            {selectedRows.size > 0 && (
              <Button variant="secondary" size="sm">
                Update Semester Bulk
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada mahasiswa yang sesuai dengan filter
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          selectedRows.size === filteredList.length &&
                          filteredList.length > 0
                        }
                        onCheckedChange={handleToggleAllRows}
                      />
                    </TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>NIM</TableHead>
                    <TableHead>Angkatan</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Program Studi</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((mhs) => (
                    <TableRow key={mhs.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(mhs.id)}
                          onCheckedChange={() => handleToggleRow(mhs.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {mhs.users?.full_name}
                      </TableCell>
                      <TableCell>{mhs.nim}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{mhs.angkatan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{mhs.semester}</Badge>
                      </TableCell>
                      <TableCell>{mhs.program_studi}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {mhs.users?.email}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenUpdateDialog(mhs)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
