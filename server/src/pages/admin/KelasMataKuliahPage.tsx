/**
 * Admin Kelas Mata Kuliah Assignment Page
 *
 * Purpose: Assign mata_kuliah to kelas that don't have them
 * This fixes the issue where assignment tracking shows "Belum ada mata kuliah"
 */

import { useState, useEffect } from "react";
import { BookOpen, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// API
import { supabase } from "@/lib/supabase/client";
import type { Kelas, MataKuliah } from "@/types";

type KelasWithMK = Kelas & {
  mata_kuliah?: MataKuliah | null;
};

export default function KelasMataKuliahPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kelasList, setKelasList] = useState<KelasWithMK[]>([]);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [updates, setUpdates] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [kelasResponse, mkResponse] = await Promise.all([
        supabase
          .from("kelas")
          .select(`
            *,
            mata_kuliah (
              id,
              nama_mk,
              kode_mk,
              sks
            )
          `)
          .eq("is_active", true)
          .order("nama_kelas"),
        supabase
          .from("mata_kuliah")
          .select("*")
          .eq("is_active", true)
          .order("nama_mk"),
      ]);

      if (kelasResponse.error) throw kelasResponse.error;
      if (mkResponse.error) throw mkResponse.error;

      setKelasList(kelasResponse.data || []);
      setMataKuliahList(mkResponse.data || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      const updatesArray = Object.entries(updates).map(([kelasId, mataKuliahId]) => ({
        id: kelasId,
        mata_kuliah_id: mataKuliahId === "null" ? null : mataKuliahId,
      }));

      if (updatesArray.length === 0) {
        toast.info("Tidak ada perubahan untuk disimpan");
        return;
      }

      // Update each kelas
      const promises = updatesArray.map(async (update) => {
        const { error } = await supabase
          .from("kelas")
          .update({ mata_kuliah_id: update.mata_kuliah_id })
          .eq("id", update.id);

        if (error) throw error;
        return update.id;
      });

      await Promise.all(promises);

      toast.success(`Berhasil update ${updatesArray.length} kelas`);
      setUpdates({});
      await loadData(); // Reload data
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(error.message || "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  }

  const kelasWithoutMK = kelasList.filter(k => !k.mata_kuliah_id);
  const hasChanges = Object.keys(updates).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assign Mata Kuliah ke Kelas</h1>
        <p className="text-muted-foreground">
          Atur mata kuliah untuk kelas yang belum memiliki mata kuliah
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total Kelas Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kelasList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Belum Ada Mata Kuliah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {kelasWithoutMK.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sudah Ada Mata Kuliah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {kelasList.length - kelasWithoutMK.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      {kelasWithoutMK.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Terdapat {kelasWithoutMK.length} kelas yang belum memiliki mata kuliah.
            Pilih mata kuliah yang sesuai untuk setiap kelas, lalu klik Simpan.
          </AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas</CardTitle>
          <CardDescription>
            Kelas yang perlu diassign mata kuliah
          </CardDescription>
        </CardHeader>
        <CardContent>
          {kelasWithoutMK.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <p>Semua kelas sudah memiliki mata kuliah!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Kode Kelas</TableHead>
                  <TableHead>Mata Kuliah Saat Ini</TableHead>
                  <TableHead>Pilih Mata Kuliah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kelasWithoutMK.map((kelas) => (
                  <TableRow key={kelas.id}>
                    <TableCell className="font-medium">
                      {kelas.nama_kelas}
                    </TableCell>
                    <TableCell>{kelas.kode_kelas}</TableCell>
                    <TableCell>
                      {kelas.mata_kuliah ? (
                        <div>
                          <div className="font-medium">{kelas.mata_kuliah.nama_mk}</div>
                          <div className="text-sm text-muted-foreground">
                            {kelas.mata_kuliah.kode_mk} ({kelas.mata_kuliah.sks} SKS)
                          </div>
                        </div>
                      ) : (
                        <Badge variant="secondary">Belum ada</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={updates[kelas.id] || ""}
                        onValueChange={(value) => {
                          setUpdates(prev => ({
                            ...prev,
                            [kelas.id]: value
                          }));
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih mata kuliah" />
                        </SelectTrigger>
                        <SelectContent>
                          {mataKuliahList.map((mk) => (
                            <SelectItem key={mk.id} value={mk.id}>
                              {mk.nama_mk} ({mk.kode_mk})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Atau gunakan SQL script untuk batch update:</p>
          <code className="block p-4 bg-muted rounded-md text-sm">
            {`UPDATE kelas
SET mata_kuliah_id = 'YOUR_MATA_KULIAH_ID'
WHERE mata_kuliah_id IS NULL;`}
          </code>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(
                `-- First get mata_kuliah_id from mata_kuliah table
SELECT id, nama_mk FROM mata_kuliah WHERE is_active = true;

-- Then update kelas
UPDATE kelas
SET mata_kuliah_id = 'YOUR_MATA_KULIAH_ID'
WHERE mata_kuliah_id IS NULL;`
              );
              toast.success("SQL script copied to clipboard!");
            }}
          >
            Copy SQL Script
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}