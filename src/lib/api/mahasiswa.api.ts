/**
 * Mahasiswa API Functions
 * 
 * API functions for mahasiswa dashboard and features
 * Schema-compliant version matching actual Supabase database
 */

import { supabase } from '@/lib/supabase/client';
import type { 
  EnrolledCourse, 
  CourseStats 
} from '@/types/mata-kuliah.types';
import type { 
  UpcomingQuiz, 
  QuizStats
} from '@/types/kuis.types';
import type { 
  TodaySchedule, 
  WeeklySchedule,
  ScheduleStats 
} from '@/types/jadwal.types';
import type { Nilai } from '@/types/nilai.types';

// ========================================
// TYPES
// ========================================

/**
 * Dashboard Data Structure
 */
export interface DashboardData {
  enrolledCourses: EnrolledCourse[];
  upcomingQuizzes: UpcomingQuiz[];
  latestGrades: Nilai[];
  todaySchedule: TodaySchedule[];
  stats: {
    course: CourseStats;
    quiz: QuizStats;
    schedule: ScheduleStats;
  };
}

// ========================================
// DASHBOARD API
// ========================================

/**
 * Get Complete Dashboard Data for Mahasiswa
 */
export async function getMahasiswaDashboard(mahasiswaId: string): Promise<{
  success: boolean;
  data?: DashboardData;
  error?: string;
}> {
  try {
    // Fetch all data in parallel
    const [
      enrolledCourses,
      upcomingQuizzes,
      latestGrades,
      todaySchedule,
      courseStats,
      quizStats,
      scheduleStats
    ] = await Promise.all([
      getEnrolledCourses(mahasiswaId),
      getUpcomingQuizzes(mahasiswaId),
      getLatestGrades(mahasiswaId),
      getTodaySchedule(mahasiswaId),
      getCourseStats(mahasiswaId),
      getQuizStats(mahasiswaId),
      getScheduleStats(mahasiswaId)
    ]);

    return {
      success: true,
      data: {
        enrolledCourses,
        upcomingQuizzes,
        latestGrades,
        todaySchedule,
        stats: {
          course: courseStats,
          quiz: quizStats,
          schedule: scheduleStats
        }
      }
    };
  } catch (error: any) {
    console.error('Error fetching mahasiswa dashboard:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard data'
    };
  }
}

// ========================================
// STATISTICS
// ========================================

/**
 * Get Course Statistics
 */
async function getCourseStats(mahasiswaId: string): Promise<CourseStats> {
  try {
    // Get active courses count
    const { count: activeCourses } = await supabase
      .from('kelas_mahasiswa')
      .select('id', { count: 'exact' })
      .eq('mahasiswa_id', mahasiswaId)
      .eq('is_active', true);

    // TODO: Calculate completed courses and average grade when nilai table is ready
    const completedCourses = 0;
    const averageGrade = 0;

    return {
      total_enrolled: activeCourses || 0,
      active_courses: activeCourses || 0,
      completed_courses: completedCourses,
      average_grade: averageGrade
    };
  } catch (error) {
    console.error('Error fetching course stats:', error);
    return {
      total_enrolled: 0,
      active_courses: 0,
      completed_courses: 0,
      average_grade: 0
    };
  }
}

/**
 * Get Quiz Statistics
 * TODO: Implement when kuis & attempt_kuis tables are ready
 */
async function getQuizStats(_mahasiswaId: string): Promise<QuizStats> {
  return {
    total_quiz: 0,
    completed_quiz: 0,
    upcoming_quiz: 0,
    average_score: 0
  };
}

/**
 * Get Schedule Statistics
 */
async function getScheduleStats(mahasiswaId: string): Promise<ScheduleStats> {
  try {
    // Get student's enrolled classes
    const { data: enrollments } = await supabase
      .from('kelas_mahasiswa')
      .select('kelas_id')
      .eq('mahasiswa_id', mahasiswaId)
      .eq('is_active', true);

    const kelasIds = enrollments?.map(e => e.kelas_id) || [];

    if (kelasIds.length === 0) {
      return {
        total_classes_today: 0,
        total_classes_week: 0,
        total_classes_month: 0  // FIXED: Added missing property
      };
    }

    // Get today's day name (lowercase)
    const today = new Date()
      .toLocaleDateString('id-ID', { weekday: 'long' })
      .toLowerCase() as 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
    
    const { count: todayCount } = await supabase
      .from('jadwal')
      .select('id', { count: 'exact' })
      .in('kelas_id', kelasIds)
      .eq('hari', today)
      .eq('is_active', true);

    return {
      total_classes_today: todayCount || 0,
      total_classes_week: 0,
      total_classes_month: 0  // FIXED: Added missing property
    };
  } catch (error) {
    console.error('Error fetching schedule stats:', error);
    return {
      total_classes_today: 0,
      total_classes_week: 0,
      total_classes_month: 0  // FIXED: Added missing property
    };
  }
}

// ========================================
// ENROLLED COURSES
// ========================================

/**
 * Get Enrolled Courses for Mahasiswa
 * Schema: kelas_mahasiswa has enrolled_at (not created_at)
 */
export async function getEnrolledCourses(
  mahasiswaId: string,
  _status?: 'active' | 'completed' | 'dropped'
): Promise<EnrolledCourse[]> {
  try {
    const { data, error } = await supabase
      .from('kelas_mahasiswa')
      .select(`
        *,
        kelas!inner(
          *,
          mata_kuliah!inner(*),
          dosen!inner(
            id,
            users!inner(full_name),
            gelar_depan,
            gelar_belakang
          )
        )
      `)
      .eq('mahasiswa_id', mahasiswaId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    // Transform to EnrolledCourse format
    const courses: EnrolledCourse[] = (data || []).map((enrollment: any) => {
      const kelas = enrollment.kelas;
      const mk = kelas.mata_kuliah;
      const dosen = kelas.dosen;

      // Format dosen name with gelar
      let dosenName = dosen.users.full_name;
      if (dosen.gelar_depan) dosenName = `${dosen.gelar_depan} ${dosenName}`;
      if (dosen.gelar_belakang) dosenName = `${dosenName}, ${dosen.gelar_belakang}`;

      return {
        id: mk.id,
        kelas_id: kelas.id,
        enrollment_id: enrollment.id,
        kode_mk: mk.kode_mk,
        nama_mk: mk.nama_mk,
        nama_kelas: kelas.nama_kelas,
        sks: mk.sks,
        semester: mk.semester,
        dosen_name: dosenName,
        dosen_gelar: '',
        hari: undefined,
        jam_mulai: undefined,
        jam_selesai: undefined,
        ruangan: kelas.ruangan,
        status: 'active',
        enrolled_at: enrollment.enrolled_at
      };
    });

    return courses;
  } catch (error: any) {
    console.error('Error fetching enrolled courses:', error);
    throw error;
  }
}

// ========================================
// UPCOMING QUIZZES
// ========================================

/**
 * Get Upcoming Quizzes for Mahasiswa
 * TODO: Implement when kuis & attempt_kuis tables are ready
 */
export async function getUpcomingQuizzes(
  _mahasiswaId: string,
  _limit: number = 5
): Promise<UpcomingQuiz[]> {
  return [];
}

// ========================================
// GRADES
// ========================================

/**
 * Get Latest Grades for Mahasiswa
 * TODO: Implement when nilai table is ready
 */
export async function getLatestGrades(
  _mahasiswaId: string,
  _limit: number = 5
): Promise<Nilai[]> {
  return [];
}

/**
 * Get All Grades for Mahasiswa
 * TODO: Implement when nilai table is ready
 */
export async function getAllGrades(_mahasiswaId: string): Promise<Nilai[]> {
  return [];
}

// ========================================
// SCHEDULE
// ========================================

/**
 * Get Today's Schedule for Mahasiswa
 * Schema: jadwal has hari (day_of_week enum), topik, deskripsi
 */
export async function getTodaySchedule(mahasiswaId: string): Promise<TodaySchedule[]> {
  try {
    // Get today's day name (lowercase)
    const today = new Date()
      .toLocaleDateString('id-ID', { weekday: 'long' })
      .toLowerCase() as 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
    
    const now = new Date();

    // Get student's enrolled classes
    const { data: enrollments, error: enrollError } = await supabase
      .from('kelas_mahasiswa')
      .select('kelas_id')
      .eq('mahasiswa_id', mahasiswaId)
      .eq('is_active', true);

    if (enrollError) throw enrollError;

    const kelasIds = enrollments?.map(e => e.kelas_id) || [];

    if (kelasIds.length === 0) {
      return [];
    }

    // FIXED: Changed from jadwal_praktikum to jadwal
    const { data: schedules, error: scheduleError } = await supabase
      .from('jadwal')
      .select(`
        *,
        kelas!inner(
          *,
          mata_kuliah!inner(*),
          dosen!inner(
            users!inner(full_name),
            gelar_depan,
            gelar_belakang
          )
        ),
        laboratorium!inner(*)
      `)
      .in('kelas_id', kelasIds)
      .eq('hari', today)
      .eq('is_active', true)
      .order('jam_mulai', { ascending: true });

    if (scheduleError) throw scheduleError;

    // Transform to TodaySchedule format
    const todaySchedules: TodaySchedule[] = (schedules || []).map((schedule: any) => {
      const kelas = schedule.kelas;
      const mk = kelas.mata_kuliah;
      const dosen = kelas.dosen;
      const lab = schedule.laboratorium;

      // Format dosen name
      let dosenName = dosen.users.full_name;
      if (dosen.gelar_depan) dosenName = `${dosen.gelar_depan} ${dosenName}`;
      if (dosen.gelar_belakang) dosenName = `${dosenName}, ${dosen.gelar_belakang}`;

      // Determine time status
      const [startHour, startMinute] = schedule.jam_mulai.split(':').map(Number);
      const [endHour, endMinute] = schedule.jam_selesai.split(':').map(Number);
      
      const startTime = new Date(now);
      startTime.setHours(startHour, startMinute, 0);
      
      const endTime = new Date(now);
      endTime.setHours(endHour, endMinute, 0);

      let timeStatus: 'past' | 'ongoing' | 'upcoming' = 'upcoming';
      if (now > endTime) {
        timeStatus = 'past';
      } else if (now >= startTime && now <= endTime) {
        timeStatus = 'ongoing';
      }

      return {
        id: schedule.id,
        kelas_id: schedule.kelas_id,
        kelas: kelas,  // FIXED: Added missing property
        tanggal_praktikum: today,  // FIXED: Added missing property
        kode_mk: mk.kode_mk,
        nama_mk: mk.nama_mk,
        nama_kelas: kelas.nama_kelas,
        sks: mk.sks,
        hari: schedule.hari,
        jam_mulai: schedule.jam_mulai,
        jam_selesai: schedule.jam_selesai,
        minggu_ke: schedule.minggu_ke,
        laboratorium_id: schedule.laboratorium_id,
        nama_lab: lab.nama_lab,
        kode_lab: lab.kode_lab,
        kapasitas: lab.kapasitas,
        topik: schedule.topik,
        catatan: schedule.deskripsi,
        dosen_name: dosenName,
        dosen_gelar: '',
        is_now: timeStatus === 'ongoing',
        is_upcoming: timeStatus === 'upcoming',
        is_past: timeStatus === 'past',
        time_status: timeStatus
      };
    });

    return todaySchedules;
  } catch (error: any) {
    console.error('Error fetching today schedule:', error);
    return [];
  }
}

/**
 * Get Weekly Schedule for Mahasiswa
 */
export async function getWeeklySchedule(mahasiswaId: string): Promise<WeeklySchedule[]> {
  try {
    // Get student's enrolled classes
    const { data: enrollments, error: enrollError } = await supabase
      .from('kelas_mahasiswa')
      .select('kelas_id')
      .eq('mahasiswa_id', mahasiswaId)
      .eq('is_active', true);

    if (enrollError) throw enrollError;

    const kelasIds = enrollments?.map(e => e.kelas_id) || [];

    if (kelasIds.length === 0) {
      return [];
    }

    // FIXED: Changed from jadwal_praktikum to jadwal
    const { data: schedules, error: scheduleError } = await supabase
      .from('jadwal')
      .select(`
        *,
        kelas!inner(
          *,
          mata_kuliah!inner(*),
          dosen!inner(
            users!inner(full_name),
            gelar_depan,
            gelar_belakang
          )
        ),
        laboratorium!inner(*)
      `)
      .in('kelas_id', kelasIds)
      .eq('is_active', true)
      .order('jam_mulai', { ascending: true });

    if (scheduleError) throw scheduleError;

    // Group by day
    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const weeklySchedule: WeeklySchedule[] = days.map(hari => {
      const daySchedules = (schedules || [])
        .filter((s: any) => s.hari === hari)
        .map((schedule: any) => {
          const kelas = schedule.kelas;
          const mk = kelas.mata_kuliah;
          const dosen = kelas.dosen;
          const lab = schedule.laboratorium;

          // Format dosen name
          let dosenName = dosen.users.full_name;
          if (dosen.gelar_depan) dosenName = `${dosen.gelar_depan} ${dosenName}`;
          if (dosen.gelar_belakang) dosenName = `${dosenName}, ${dosen.gelar_belakang}`;

          return {
            id: schedule.id,
            kelas_id: schedule.kelas_id,
            kelas: kelas,  // Added for type compatibility
            tanggal_praktikum: hari,  // Added for type compatibility
            kode_mk: mk.kode_mk,
            nama_mk: mk.nama_mk,
            nama_kelas: kelas.nama_kelas,
            sks: mk.sks,
            hari: schedule.hari,
            jam_mulai: schedule.jam_mulai,
            jam_selesai: schedule.jam_selesai,
            minggu_ke: schedule.minggu_ke,
            laboratorium_id: schedule.laboratorium_id,
            nama_lab: lab.nama_lab,
            kode_lab: lab.kode_lab,
            kapasitas: lab.kapasitas,
            topik: schedule.topik,
            catatan: schedule.deskripsi,
            dosen_name: dosenName,
            dosen_gelar: '',
            is_now: false,
            is_upcoming: false,
            is_past: false,
            time_status: 'upcoming' as const
          };
        });

      return {
        hari,
        tanggal: hari,  // FIXED: Added missing property
        schedules: daySchedules
      };
    });

    return weeklySchedule;
  } catch (error: any) {
    console.error('Error fetching weekly schedule:', error);
    return [];
  }
}