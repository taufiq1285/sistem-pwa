import { useState, useEffect, useRef } from "react";
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import {
  getEnrolledStudents,
  getAllMahasiswa,
  enrollStudent,
  createOrEnrollMahasiswa,
} from "@/lib/api/kelas.api";
import { supabase } from "@/lib/supabase/client";
import type { KelasMahasiswa } from "@/lib/api/kelas.api";

interface Mahasiswa {
  id: string;
  nim: string;
  users: {
    full_name: string;
    email: string;
  };
}

interface KelolaMahasiswaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kelas: {
    id: string;
    nama_kelas: string;
    kuota?: number;
  };
}

export function KelolaMahasiswaDialog({
  open,
  onOpenChange,
  kelas,
}: KelolaMahasiswaDialogProps) {
  const [enrolledStudents, setEnrolledStudents] = useState<KelasMahasiswa[]>(
    [],
  );
  const [availableMahasiswa, setAvailableMahasiswa] = useState<Mahasiswa[]>([]);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddNewDialog, setShowAddNewDialog] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const [newStudentForm, setNewStudentForm] = useState({
    nim: "",
    full_name: "",
    email: "",
  });

  const realtimeChannelRef = useRef<any>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (open && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
      setupRealtimeSubscription();
    }

    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
        realtimeChannelRef.current = null;
      }
      if (!open) {
        hasLoadedRef.current = false;
      }
    };
  }, [open, kelas.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [students, mahasiswa] = await Promise.all([
        getEnrolledStudents(kelas.id),
        getAllMahasiswa(),
      ]);

      setEnrolledStudents(students);
      setAvailableMahasiswa(mahasiswa);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(error.message || "Gagal memuat data mahasiswa");
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`kelas_mahasiswa:${kelas.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kelas_mahasiswa",
          filter: `kelas_id=eq.${kelas.id}`,
        },
        async (payload) => {
          console.log("Realtime update:", payload);
          await loadData();

          if (payload.eventType === "INSERT") {
            toast.success("Mahasiswa baru ditambahkan ke kelas!");
          } else if (payload.eventType === "DELETE") {
            toast.info("Mahasiswa dikeluarkan dari kelas");
          }
        },
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
        if (status === "SUBSCRIBED") {
          setRealtimeConnected(true);
        } else {
          setRealtimeConnected(false);
        }
      });

    realtimeChannelRef.current = channel;
  };

  const filteredMahasiswa = availableMahasiswa.filter(
    (mahasiswa) =>
      !enrolledStudents.some(
        (enrolled) => enrolled.mahasiswa_id === mahasiswa.id,
      ) &&
      (mahasiswa.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mahasiswa.users.full_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        mahasiswa.users.email
          .toLowerCase()
          .includes(searchQuery.toLowerCase())),
  );

  const handleAddStudents = async () => {
    if (selectedMahasiswa.length === 0) {
      toast.error("Pilih mahasiswa terlebih dahulu");
      return;
    }

    setIsAddingStudent(true);
    try {
      await Promise.all(
        selectedMahasiswa.map((mahasiswaId) =>
          enrollStudent(kelas.id, mahasiswaId),
        ),
      );

      toast.success(
        `${selectedMahasiswa.length} mahasiswa berhasil ditambahkan`,
      );
      setSelectedMahasiswa([]);
      await loadData();
    } catch (error: any) {
      console.error("Error adding students:", error);
      toast.error(error.message || "Gagal menambahkan mahasiswa");
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleAddNewStudent = async () => {
    const { nim, full_name, email } = newStudentForm;

    if (!nim || !full_name || !email) {
      toast.error("Semua field wajib diisi");
      return;
    }

    setIsAddingStudent(true);
    try {
      const result = await createOrEnrollMahasiswa(kelas.id, {
        nim,
        full_name,
        email,
      });

      if (result.success) {
        toast.success(result.message);
        setNewStudentForm({ nim: "", full_name: "", email: "" });
        setShowAddNewDialog(false);
        await loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error("Error adding new student:", error);
      toast.error(error.message || "Gagal menambahkan mahasiswa baru");
    } finally {
      setIsAddingStudent(false);
    }
  };

  const toggleMahasiswaSelection = (mahasiswaId: string) => {
    setSelectedMahasiswa((prev) =>
      prev.includes(mahasiswaId)
        ? prev.filter((id) => id !== mahasiswaId)
        : [...prev, mahasiswaId],
    );
  };

  const selectAllMahasiswa = () => {
    if (selectedMahasiswa.length === filteredMahasiswa.length) {
      setSelectedMahasiswa([]);
    } else {
      setSelectedMahasiswa(filteredMahasiswa.map((m) => m.id));
    }
  };

  const currentEnrollment = enrolledStudents.filter((e) => e.is_active).length;
  const availableSlots = kelas.kuota
    ? kelas.kuota - currentEnrollment
    : Infinity;
  const isClassFull = availableSlots <= 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Kelola Mahasiswa - {kelas.nama_kelas}
            </DialogTitle>
            <DialogDescription>
              Kelola mahasiswa yang terdaftar dalam kelas ini
            </DialogDescription>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary" className="text-xs">
                {currentEnrollment}/{kelas.kuota || "∞"} Mahasiswa
              </Badge>
              {realtimeConnected && (
                <Badge
                  variant="outline"
                  className="text-xs flex items-center gap-1"
                >
                  <Wifi className="h-3 w-3" />
                  Realtime Active
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {isClassFull && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Kelas sudah penuh! Tidak bisa menambah mahasiswa baru.
                </AlertDescription>
              </Alert>
            )}

            {/* Current Enrolled Students */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Mahasiswa Terdaftar</h3>
                <Badge variant="outline">
                  {enrolledStudents.length} Mahasiswa
                </Badge>
              </div>

              {enrolledStudents.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">
                    Belum ada mahasiswa yang terdaftar
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>NIM</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal Daftar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrolledStudents.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell>{student.mahasiswa?.nim || "-"}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src="" />
                                <AvatarFallback className="text-xs">
                                  {student.mahasiswa?.users?.full_name?.[0] ||
                                    "M"}
                                </AvatarFallback>
                              </Avatar>
                              {student.mahasiswa?.users?.full_name || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.mahasiswa?.users?.email || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.is_active ? "default" : "secondary"
                              }
                            >
                              {student.is_active ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {student.enrolled_at
                              ? new Date(
                                  student.enrolled_at,
                                ).toLocaleDateString("id-ID")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Add Students Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tambah Mahasiswa</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddNewDialog(true)}
                  disabled={isClassFull}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Mahasiswa Baru
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari mahasiswa berdasarkan NIM, nama, atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Available Students List */}
              <div className="space-y-2">
                {searchQuery && filteredMahasiswa.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Tidak ada mahasiswa yang cocok dengan pencarian
                  </div>
                )}

                {filteredMahasiswa.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={
                          selectedMahasiswa.length ===
                            filteredMahasiswa.length &&
                          filteredMahasiswa.length > 0
                        }
                        onCheckedChange={selectAllMahasiswa}
                      />
                      <Label
                        htmlFor="select-all"
                        className="text-sm font-medium"
                      >
                        Pilih Semua ({filteredMahasiswa.length})
                      </Label>
                    </div>
                    {selectedMahasiswa.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {selectedMahasiswa.length} terpilih
                        </span>
                        <Button
                          size="sm"
                          onClick={handleAddStudents}
                          disabled={isAddingStudent || isClassFull}
                        >
                          {isAddingStudent ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Menambahkan...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Tambah ke Kelas
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1 max-h-64 overflow-y-auto border rounded-lg p-2">
                  {filteredMahasiswa.map((mahasiswa) => (
                    <div
                      key={mahasiswa.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`mahasiswa-${mahasiswa.id}`}
                        checked={selectedMahasiswa.includes(mahasiswa.id)}
                        onCheckedChange={() =>
                          toggleMahasiswaSelection(mahasiswa.id)
                        }
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {mahasiswa.users.full_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {mahasiswa.users.full_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {mahasiswa.nim} • {mahasiswa.users.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Student Dialog */}
      <AlertDialog open={showAddNewDialog} onOpenChange={setShowAddNewDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Tambah Mahasiswa Baru
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tambahkan mahasiswa baru yang belum terdaftar ke sistem dan
              masukkan ke kelas {kelas.nama_kelas}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nim">NIM *</Label>
              <Input
                id="nim"
                placeholder="Contoh: 1234567890"
                value={newStudentForm.nim}
                onChange={(e) =>
                  setNewStudentForm({ ...newStudentForm, nim: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                placeholder="Contoh: John Doe"
                value={newStudentForm.full_name}
                onChange={(e) =>
                  setNewStudentForm({
                    ...newStudentForm,
                    full_name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Contoh: john.doe@example.com"
                value={newStudentForm.email}
                onChange={(e) =>
                  setNewStudentForm({
                    ...newStudentForm,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Akun mahasiswa akan dibuat dengan password default: NIM + 123
              </AlertDescription>
            </Alert>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddNewStudent}
              disabled={isAddingStudent}
            >
              {isAddingStudent ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menambahkan...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tambah Mahasiswa
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
