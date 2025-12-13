/**
 * KuisCreatePage
 *
 * Purpose: Create new quiz page (Dosen)
 * Route: /dosen/kuis/create
 * Features: Directly show quiz builder - simplified UX
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizBuilder } from "@/components/features/kuis/builder/QuizBuilder";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";

export default function KuisCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dosenId, setDosenId] = useState<string>("");
  const [isLoadingDosenId, setIsLoadingDosenId] = useState(false);

  // Fetch dosen_id if not available in user object
  useEffect(() => {
    async function fetchDosenId() {
      if (user?.dosen?.id) {
        setDosenId(user.dosen.id);
        return;
      }

      // Fallback: Fetch from database
      if (user?.id && user?.role === "dosen") {
        setIsLoadingDosenId(true);
        try {
          const { data, error } = await supabase
            .from("dosen")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (error) throw error;

          if (data) {
            console.log("✅ Fetched dosen_id from database:", data.id);
            setDosenId(data.id);
          } else {
            console.error("❌ No dosen record found for user_id:", user.id);
          }
        } catch (error) {
          console.error("❌ Error fetching dosen_id:", error);
        } finally {
          setIsLoadingDosenId(false);
        }
      }
    }

    fetchDosenId();
  }, [user]);

  // Redirect if not dosen
  if (user && user.role !== "dosen") {
    console.error("❌ Not a dosen:", { role: user.role });
    navigate("/");
    return null;
  }

  // Show loading while fetching dosen ID
  if (isLoadingDosenId) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Show error if no dosen ID found
  if (!dosenId && user) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="text-center text-red-500">
          Error: Data dosen tidak ditemukan. Silakan logout dan login kembali.
        </div>
      </div>
    );
  }

  const handleSave = () => {
    navigate("/dosen/kuis");
  };

  const handleCancel = () => {
    navigate("/dosen/kuis");
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dosen/kuis")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar Kuis
        </Button>

        <h1 className="text-3xl font-bold">Buat Kuis Baru</h1>
        <p className="text-muted-foreground mt-2">
          Isi informasi kuis dan tambahkan soal
        </p>
      </div>

      {/* ✅ SIMPLIFIED: Directly show QuizBuilder without type selection */}
      <QuizBuilder
        dosenId={dosenId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
