/**
 * KehadiranHistory Component
 * Displays past attendance records with expandable details
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Calendar, Users } from "lucide-react";
import {
  getKehadiranHistory,
  type KehadiranHistoryRecord,
} from "@/lib/api/kehadiran.api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface KehadiranHistoryProps {
  kelasId: string;
  kelasNama: string;
  onSelectDate?: (date: string) => void;
}

export function KehadiranHistory({
  kelasId,
  kelasNama,
  onSelectDate,
}: KehadiranHistoryProps) {
  const [history, setHistory] = useState<KehadiranHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();
  }, [kelasId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getKehadiranHistory(kelasId);
      setHistory(data);
    } catch (error: any) {
      console.error("Error loading history:", error);
      toast.error("Gagal memuat riwayat kehadiran");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calculatePercentage = (hadir: number, total: number) => {
    return total > 0 ? Math.round((hadir / total) * 100) : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-muted-foreground">Memuat riwayat...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Belum ada riwayat kehadiran</p>
            <p className="text-sm mt-1">
              Mulai input kehadiran untuk melihat riwayat
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Riwayat Kehadiran
        </CardTitle>
        <CardDescription>
          {kelasNama} • {history.length} pertemuan tercatat
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {history.map((record) => {
            const isExpanded = expandedDates.has(record.tanggal);
            const percentage = calculatePercentage(
              record.hadir,
              record.total_mahasiswa,
            );

            return (
              <div
                key={record.tanggal}
                className="border rounded-lg overflow-hidden transition-all hover:shadow-md"
              >
                <button
                  onClick={() => toggleExpand(record.tanggal)}
                  className="w-full p-4 hover:bg-muted/50 transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex-1">
                    <div className="font-medium text-base">
                      {formatDate(record.tanggal)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      {record.total_mahasiswa} mahasiswa • {percentage}%
                      kehadiran
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      ✓ {record.hadir}
                    </Badge>
                    {record.izin > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        📝 {record.izin}
                      </Badge>
                    )}
                    {record.sakit > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        🏥 {record.sakit}
                      </Badge>
                    )}
                    {record.alpha > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200"
                      >
                        ✗ {record.alpha}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 bg-muted/20 border-t">
                    <div className="grid grid-cols-4 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {record.hadir}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Hadir
                        </div>
                        <div className="text-xs text-muted-foreground">
                          (
                          {Math.round(
                            (record.hadir / record.total_mahasiswa) * 100,
                          )}
                          %)
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {record.izin}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Izin
                        </div>
                        <div className="text-xs text-muted-foreground">
                          (
                          {Math.round(
                            (record.izin / record.total_mahasiswa) * 100,
                          )}
                          %)
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-600">
                          {record.sakit}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Sakit
                        </div>
                        <div className="text-xs text-muted-foreground">
                          (
                          {Math.round(
                            (record.sakit / record.total_mahasiswa) * 100,
                          )}
                          %)
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">
                          {record.alpha}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Alpha
                        </div>
                        <div className="text-xs text-muted-foreground">
                          (
                          {Math.round(
                            (record.alpha / record.total_mahasiswa) * 100,
                          )}
                          %)
                        </div>
                      </div>
                    </div>

                    {onSelectDate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => onSelectDate(record.tanggal)}
                      >
                        Lihat Detail / Edit Kehadiran
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
