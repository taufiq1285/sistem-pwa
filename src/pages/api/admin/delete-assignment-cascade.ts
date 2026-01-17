// @ts-nocheck
/**
 * API Route: Delete Assignment Cascade
 *
 * Handles cascade deletion of assignments with proper cleanup
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and has admin permissions
    const supabase = createClient();
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

    // Validate required parameters
    if (!dosen_id || !mata_kuliah_id || !kelas_id) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          message: "dosen_id, mata_kuliah_id, and kelas_id are required",
        },
        { status: 400 },
      );
    }

    // Validate parameter format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      !uuidRegex.test(dosen_id) ||
      !uuidRegex.test(mata_kuliah_id) ||
      !uuidRegex.test(kelas_id)
    ) {
      return NextResponse.json(
        {
          error: "Invalid parameter format",
          message: "All IDs must be valid UUIDs",
        },
        { status: 400 },
      );
    }

    // Validate options
    const validOptions = {
      alsoDeleteKelas: Boolean(options?.alsoDeleteKelas),
      notifyDosen: Boolean(options?.notifyDosen),
    };

    // Perform cascade delete
    console.log("🗑️ Deleting assignment cascade:", {
      dosen_id,
      mata_kuliah_id,
      kelas_id,
      options: validOptions,
    });

    // Start by counting what will be deleted
    const { data: jadwalToDelete, error: countError } = await supabase
      .from("jadwal_praktikum")
      .select("id, tanggal_praktikum, topik")
      .eq("dosen_id", dosen_id)
      .eq("mata_kuliah_id", mata_kuliah_id)
      .eq("kelas_id", kelas_id);

    if (countError) throw countError;

    const totalJadwal = jadwalToDelete?.length || 0;
    console.log(`Found ${totalJadwal} jadwal to delete`);

    // Step 1: Delete all jadwal praktikum for this assignment
    const { error: jadwalDeleteError } = await supabase
      .from("jadwal_praktikum")
      .delete()
      .eq("dosen_id", dosen_id)
      .eq("mata_kuliah_id", mata_kuliah_id)
      .eq("kelas_id", kelas_id);

    if (jadwalDeleteError) throw jadwalDeleteError;

    console.log(`✅ Deleted ${totalJadwal} jadwal praktikum`);

    // Step 2: Check if we should also clean up the kelas
    let kelasDeleted = false;
    if (validOptions?.alsoDeleteKelas) {
      // Check if kelas has any students
      const { count, error: studentCountError } = await supabase
        .from("kelas_mahasiswa")
        .select("*", { count: "exact", head: true })
        .eq("kelas_id", kelas_id);

      if (studentCountError) throw studentCountError;

      if (count === 0) {
        // Check if kelas has other active jadwal
        const { count: otherJadwalCount, error: otherJadwalError } =
          await supabase
            .from("jadwal_praktikum")
            .select("*", { count: "exact", head: true })
            .eq("kelas_id", kelas_id)
            .eq("is_active", true);

        if (otherJadwalError) throw otherJadwalError;

        if (otherJadwalCount === 0) {
          // Safe to delete the kelas
          const { error: kelasDeleteError } = await supabase
            .from("kelas")
            .delete()
            .eq("id", kelas_id);

          if (kelasDeleteError) throw kelasDeleteError;
          kelasDeleted = true;
          console.log(`✅ Deleted kelas ${kelas_id}`);
        }
      }
    }

    // Step 3: Clean up dosen_mata_kuliah if no other assignments for this mata kuliah
    const { data: otherAssignments, error: otherAssignError } = await supabase
      .from("jadwal_praktikum")
      .select("id")
      .eq("dosen_id", dosen_id)
      .eq("mata_kuliah_id", mata_kuliah_id)
      .eq("is_active", true);

    if (otherAssignError) throw otherAssignError;

    if (!otherAssignments || otherAssignments.length === 0) {
      const { error: dmDeleteError } = await supabase
        .from("dosen_mata_kuliah")
        .delete()
        .eq("dosen_id", dosen_id)
        .eq("mata_kuliah_id", mata_kuliah_id);

      if (dmDeleteError) throw dmDeleteError;
      console.log(`✅ Cleaned up dosen_mata_kuliah record`);
    }

    // Step 4: Send notification if requested
    if (validOptions?.notifyDosen) {
      // Get dosen details for notification
      const { data: dosenData } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", dosen_id)
        .single();

      const { data: mkData } = await supabase
        .from("mata_kuliah")
        .select("nama_mk")
        .eq("id", mata_kuliah_id)
        .single();

      const { data: kelasData } = await supabase
        .from("kelas")
        .select("nama_kelas")
        .eq("id", kelas_id)
        .single();

      // Create notification
      await supabase.from("notifications").insert({
        user_id: dosen_id,
        title: "Assignment Dihapus",
        message: `Assignment untuk mata kuliah ${mkData?.nama_mk} di kelas ${kelasData?.nama_kelas} telah dihapus oleh admin.`,
        type: "assignment_deleted",
        metadata: {
          dosen_id: dosen_id,
          mata_kuliah_id: mata_kuliah_id,
          kelas_id: kelas_id,
          deleted_jadwal_count: totalJadwal,
          kelas_deleted: kelasDeleted,
        },
      });

      console.log(`✅ Sent notification to dosen ${dosenData?.full_name}`);
    }

    const deleteResult = {
      success: true,
      message: `Assignment berhasil dihapus`,
      details: {
        deleted_jadwal_count: totalJadwal,
        kelas_deleted: kelasDeleted,
        jadwal_details: jadwalToDelete,
      },
    };

    if (!deleteResult.success) {
      return NextResponse.json(
        {
          error: "Delete operation failed",
          message: deleteResult.message,
          details: deleteResult.details,
        },
        { status: 500 },
      );
    }

    // Log the delete operation for audit
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "DELETE_ASSIGNMENT_CASCADE",
      table_name: "jadwal_praktikum",
      record_id: `${dosen_id}-${mata_kuliah_id}-${kelas_id}`,
      old_data: {
        dosen_id,
        mata_kuliah_id,
        kelas_id,
        options: validOptions,
      },
      new_data: deleteResult.details,
      ip_address: request.ip || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: deleteResult.message,
      details: deleteResult.details,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in delete-assignment-cascade:", error);

    // Log error for debugging
    const supabase = createClient();
    await supabase.from("error_logs").insert({
      error_type: "CASCADE_DELETE_ERROR",
      message: error.message,
      stack: error.stack,
      user_agent: request.headers.get("user-agent") || "unknown",
      ip_address: request.ip || "unknown",
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process delete operation",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
