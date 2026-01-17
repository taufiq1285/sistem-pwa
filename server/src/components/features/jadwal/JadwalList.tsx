import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getJadwalMingguIni } from "@/lib/api/jadwal.api";
import type { Jadwal } from "@/types/jadwal.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, BookOpen } from "lucide-react";

export default function JadwalList() {
  const { user } = useAuth();
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadJadwal() {
      if (!user?.id) return;

      try {
        setLoading(true);
        const data = await getJadwalMingguIni(user.id);
        setJadwal(data);
      } catch (err: any) {
        console.error("Failed to load jadwal:", err);
        setError("Gagal memuat jadwal praktikum");
      } finally {
        setLoading(false);
      }
    }

    loadJadwal();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="h-32 animate-pulse bg-gray-100" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-600">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (jadwal.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">
            Tidak ada jadwal praktikum minggu ini
          </p>
          <p className="text-sm text-muted-foreground">
            Nikmati waktu libur Anda!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Jadwal Praktikum (7 Hari Ke Depan)</h2>

      {jadwal.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{(item as any).nama_mk}</span>
              <Badge variant="outline">{(item as any).kode_kelas}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="capitalize">
                {item.hari}, {item.tanggal_praktikum}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>
                {item.jam_mulai} - {item.jam_selesai}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>
                {(item as any).nama_lab} - {(item as any).lokasi}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>{(item as any).nama_dosen}</span>
            </div>

            {item.topik && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <p className="text-sm font-semibold">Topik:</p>
                </div>
                <p className="text-sm mt-1">{item.topik}</p>
              </div>
            )}

            {item.catatan && (
              <div className="mt-2 p-2 bg-yellow-50 rounded">
                <p className="text-sm font-semibold text-yellow-800">
                  Catatan:
                </p>
                <p className="text-sm text-yellow-700">{item.catatan}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
