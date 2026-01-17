// @ts-nocheck
/**
 * API Route: Unified Assignment Management
 *
 * Handles GET requests for fetching unified assignments with filters and search
 * POST requests for various assignment operations
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and has admin permissions
    // Use the imported supabase client
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login to access this resource" },
        { status: 401 },
      );
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      dosen_id: searchParams.get("dosen_id") || undefined,
      mata_kuliah_id: searchParams.get("mata_kuliah_id") || undefined,
      kelas_id: searchParams.get("kelas_id") || undefined,
      status: searchParams.get("status") || undefined,
      semester: searchParams.get("semester") || undefined,
      tahun_ajaran: searchParams.get("tahun_ajaran") || undefined,
    };

    const search = searchParams.get("search") || undefined;

    // Build master assignment query
    let query = supabase
      .from("jadwal_praktikum")
      .select(
        `
        dosen_id,
        mata_kuliah_id,
        kelas_id,
        dosen:users!inner(id, full_name, email),
        mata_kuliah:mata_kuliah!inner(id, nama_mk, kode_mk),
        kelas:kelas!inner(id, nama_kelas, kode_kelas)
      `,
      )
      .eq("is_active", true);

    // Apply filters
    if (filters?.dosen_id) {
      query = query.eq("dosen_id", filters.dosen_id);
    }

    if (filters?.mata_kuliah_id) {
      query = query.eq("mata_kuliah_id", filters.mata_kuliah_id);
    }

    if (filters?.kelas_id) {
      query = query.eq("kelas_id", filters.kelas_id);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.tahun_ajaran) {
      query = query.eq("kelas.tahun_ajaran", filters.tahun_ajaran);
    }

    if (filters?.semester) {
      query = query.eq("kelas.semester_ajaran", filters.semester);
    }

    // Apply search
    if (search) {
      query = query.or(`
        dosen.full_name.ilike.%${search}%,
        mata_kuliah.nama_mk.ilike.%${search}%,
        mata_kuliah.kode_mk.ilike.%${search}%,
        kelas.nama_kelas.ilike.%${search}%,
        kelas.kode_kelas.ilike.%${search}%
      `);
    }

    const { data: rawData, error } = await query;

    if (error) throw error;
    if (!rawData || rawData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        filters,
        search,
      });
    }

    // Group by unique assignment (dosen + mata_kuliah + kelas)
    const assignmentMap = new Map<string, any>();

    rawData.forEach((item: any) => {
      const key = `${item.dosen_id}-${item.mata_kuliah_id}-${item.kelas_id}`;

      if (!assignmentMap.has(key)) {
        assignmentMap.set(key, {
          dosen_id: item.dosen_id,
          mata_kuliah_id: item.mata_kuliah_id,
          kelas_id: item.kelas_id,
          total_jadwal: 0,
          tanggal_mulai: "",
          tanggal_selesai: "",
          dosen: item.dosen,
          mata_kuliah: item.mata_kuliah,
          kelas: item.kelas,
          jadwalDetail: [],
        });
      }
    });

    // Get detailed schedules for each assignment
    const assignmentsWithSchedules = [];

    for (const [key, assignment] of assignmentMap) {
      // Get all jadwal for this assignment
      const { data: jadwalData, error: jadwalError } = await supabase
        .from("jadwal_praktikum")
        .select(
          `
          id,
          tanggal_praktikum,
          hari,
          jam_mulai,
          jam_selesai,
          topik,
          status,
          laboratorium:laboratorium_id (
            id,
            nama_lab,
            kode_lab
          )
        `,
        )
        .eq("dosen_id", assignment.dosen_id)
        .eq("mata_kuliah_id", assignment.mata_kuliah_id)
        .eq("kelas_id", assignment.kelas_id)
        .eq("is_active", true)
        .order("tanggal_praktikum", { ascending: true });

      if (jadwalError) {
        console.warn(
          "Error fetching jadwal details for assignment:",
          key,
          jadwalError,
        );
        continue;
      }

      const jadwalDetail = jadwalData || [];
      const dates = jadwalDetail
        .map((j: any) => j.tanggal_praktikum)
        .filter(Boolean);

      assignmentsWithSchedules.push({
        ...assignment,
        total_jadwal: jadwalDetail.length,
        tanggal_mulai: dates.length > 0 ? dates[0] : "",
        tanggal_selesai: dates.length > 0 ? dates[dates.length - 1] : "",
        jadwalDetail: jadwalDetail,
      });
    }

    return NextResponse.json({
      success: true,
      data: assignmentsWithSchedules,
      count: assignmentsWithSchedules.length,
      filters,
      search,
    });
  } catch (error: any) {
    console.error("Error in unified-assignments GET:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch assignments",
        message: error.message,
        details: error,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and has admin permissions
    // Use the imported supabase client
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login to access this resource" },
        { status: 401 },
      );
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { filters, search } = body;

    // Build master assignment query
    let query = supabase
      .from("jadwal_praktikum")
      .select(
        `
        dosen_id,
        mata_kuliah_id,
        kelas_id,
        dosen:users!inner(id, full_name, email),
        mata_kuliah:mata_kuliah!inner(id, nama_mk, kode_mk),
        kelas:kelas!inner(id, nama_kelas, kode_kelas)
      `,
      )
      .eq("is_active", true);

    // Apply filters
    if (filters?.dosen_id) {
      query = query.eq("dosen_id", filters.dosen_id);
    }

    if (filters?.mata_kuliah_id) {
      query = query.eq("mata_kuliah_id", filters.mata_kuliah_id);
    }

    if (filters?.kelas_id) {
      query = query.eq("kelas_id", filters.kelas_id);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.tahun_ajaran) {
      query = query.eq("kelas.tahun_ajaran", filters.tahun_ajaran);
    }

    if (filters?.semester) {
      query = query.eq("kelas.semester_ajaran", filters.semester);
    }

    // Apply search
    if (search) {
      query = query.or(`
        dosen.full_name.ilike.%${search}%,
        mata_kuliah.nama_mk.ilike.%${search}%,
        mata_kuliah.kode_mk.ilike.%${search}%,
        kelas.nama_kelas.ilike.%${search}%,
        kelas.kode_kelas.ilike.%${search}%
      `);
    }

    const { data: rawData, error } = await query;

    if (error) throw error;
    if (!rawData || rawData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        filters,
        search,
      });
    }

    // Group by unique assignment (dosen + mata_kuliah + kelas)
    const assignmentMap = new Map<string, any>();

    rawData.forEach((item: any) => {
      const key = `${item.dosen_id}-${item.mata_kuliah_id}-${item.kelas_id}`;

      if (!assignmentMap.has(key)) {
        assignmentMap.set(key, {
          dosen_id: item.dosen_id,
          mata_kuliah_id: item.mata_kuliah_id,
          kelas_id: item.kelas_id,
          total_jadwal: 0,
          tanggal_mulai: "",
          tanggal_selesai: "",
          dosen: item.dosen,
          mata_kuliah: item.mata_kuliah,
          kelas: item.kelas,
          jadwalDetail: [],
        });
      }
    });

    // Get detailed schedules for each assignment
    const assignmentsWithSchedules = [];

    for (const [key, assignment] of assignmentMap) {
      // Get all jadwal for this assignment
      const { data: jadwalData, error: jadwalError } = await supabase
        .from("jadwal_praktikum")
        .select(
          `
          id,
          tanggal_praktikum,
          hari,
          jam_mulai,
          jam_selesai,
          topik,
          status,
          laboratorium:laboratorium_id (
            id,
            nama_lab,
            kode_lab
          )
        `,
        )
        .eq("dosen_id", assignment.dosen_id)
        .eq("mata_kuliah_id", assignment.mata_kuliah_id)
        .eq("kelas_id", assignment.kelas_id)
        .eq("is_active", true)
        .order("tanggal_praktikum", { ascending: true });

      if (jadwalError) {
        console.warn(
          "Error fetching jadwal details for assignment:",
          key,
          jadwalError,
        );
        continue;
      }

      const jadwalDetail = jadwalData || [];
      const dates = jadwalDetail
        .map((j: any) => j.tanggal_praktikum)
        .filter(Boolean);

      assignmentsWithSchedules.push({
        ...assignment,
        total_jadwal: jadwalDetail.length,
        tanggal_mulai: dates.length > 0 ? dates[0] : "",
        tanggal_selesai: dates.length > 0 ? dates[dates.length - 1] : "",
        jadwalDetail: jadwalDetail,
      });
    }

    return NextResponse.json({
      success: true,
      data: assignmentsWithSchedules,
      count: assignmentsWithSchedules.length,
      filters,
      search,
    });
  } catch (error: any) {
    console.error("Error in unified-assignments POST:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error.message,
        details: error,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify user is authenticated and has admin permissions
    // Use the imported supabase client
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login to access this resource" },
        { status: 401 },
      );
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { dosen_id, mata_kuliah_id, kelas_id, options } = body;

    if (!dosen_id || !mata_kuliah_id || !kelas_id) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: dosen_id, mata_kuliah_id, kelas_id",
        },
        { status: 400 },
      );
    }

    // TODO: Implement deleteAssignmentCascade function
    return NextResponse.json(
      { error: "DELETE functionality not yet implemented" },
      { status: 501 },
    );
  } catch (error: any) {
    console.error("Error in unified-assignments DELETE:", error);
    return NextResponse.json(
      {
        error: "Failed to delete assignment",
        message: error.message,
        details: error,
      },
      { status: 500 },
    );
  }
}
