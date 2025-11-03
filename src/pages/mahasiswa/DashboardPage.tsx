/**
 * Mahasiswa Dashboard Page
 * 
 * Displays:
 * - Statistics cards (enrolled courses, upcoming quizzes, grades, schedule)
 * - Today's schedule
 * - Upcoming quizzes
 * - Enrolled courses
 * - Latest grades
 */

import { useEffect, useState, type JSX } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  getMahasiswaDashboard,
  type DashboardData 
} from '@/lib/api/mahasiswa.api';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

// Icons
import { 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  TrendingUp,
  Clock,
  MapPin,
  User,
  Award,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MahasiswaDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboard();
    } else {
      setLoading(true);
    }
  }, [user]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        return;
      }

      // Try multiple ways to get mahasiswa_id
      let mahasiswaId: string | null = null;

      if ((user as any)?.mahasiswa_id) {
        mahasiswaId = (user as any).mahasiswa_id;
      } else if ((user as any)?.mahasiswa?.id) {
        mahasiswaId = (user as any).mahasiswa.id;
      } else if (user?.id) {
        mahasiswaId = user.id;
      }
      
      if (!mahasiswaId) {
        throw new Error('Mahasiswa ID tidak ditemukan');
      }

      const result = await getMahasiswaDashboard(mahasiswaId);

      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.error || 'Gagal memuat dashboard');
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Memuat dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button onClick={loadDashboard} className="mt-4">
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = dashboardData?.stats;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Selamat Datang, {user?.full_name || 'Mahasiswa'}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Berikut ringkasan aktivitas akademik Anda hari ini
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Mata Kuliah"
          value={stats?.course.total_enrolled || 0}
          icon={BookOpen}
          description="Mata kuliah aktif"
        />
        <StatCard
          title="Kuis Mendatang"
          value={stats?.quiz.upcoming_quiz || 0}
          icon={ClipboardList}
          description="Belum dikerjakan"
          variant="warning"
        />
        <StatCard
          title="Rata-rata Nilai"
          value={stats?.course.average_grade ? stats.course.average_grade.toFixed(1) : '-'}
          icon={TrendingUp}
          description="Semester ini"
          variant="success"
        />
        <StatCard
          title="Jadwal Hari Ini"
          value={stats?.schedule.total_classes_today || 0}
          icon={Calendar}
          description="Praktikum"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <TodayScheduleSection schedules={dashboardData?.todaySchedule || []} />

        {/* Upcoming Quizzes */}
        <UpcomingQuizzesSection quizzes={dashboardData?.upcomingQuizzes || []} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrolled Courses */}
        <EnrolledCoursesSection courses={dashboardData?.enrolledCourses || []} />

        {/* Latest Grades */}
        <LatestGradesSection grades={dashboardData?.latestGrades || []} />
      </div>
    </div>
  );
}

// Named export for compatibility
export { MahasiswaDashboardPage as DashboardPage };

// ========================================
// STAT CARD COMPONENT
// ========================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) {
  const variantColors = {
    default: 'text-blue-600 bg-blue-50',
    success: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    danger: 'text-red-600 bg-red-50'
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${variantColors[variant]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========================================
// TODAY'S SCHEDULE SECTION
// ========================================

function TodayScheduleSection({ schedules }: { schedules: any[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Jadwal Hari Ini
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </CardDescription>
          </div>
          <Link to="/mahasiswa/jadwal">
            <Button variant="ghost" size="sm">
              Lihat Semua
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Tidak ada jadwal"
            description="Anda tidak memiliki jadwal praktikum hari ini"
          />
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScheduleCard({ schedule }: { schedule: any }) {
  const statusColors: Record<string, string> = {
    past: 'bg-gray-100 border-gray-300',
    ongoing: 'bg-green-50 border-green-300',
    upcoming: 'bg-blue-50 border-blue-300'
  };

  const statusBadges: Record<string, JSX.Element> = {
    past: <Badge variant="secondary">Selesai</Badge>,
    ongoing: <Badge className="bg-green-600">Berlangsung</Badge>,
    upcoming: <Badge>Akan Datang</Badge>
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${statusColors[schedule.time_status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold">
              {schedule.jam_mulai} - {schedule.jam_selesai}
            </span>
            {statusBadges[schedule.time_status]}
          </div>
          <h4 className="font-semibold text-sm truncate">{schedule.nama_mk}</h4>
          <p className="text-xs text-muted-foreground">{schedule.nama_kelas}</p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{schedule.nama_lab}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{schedule.dosen_name}</span>
            </div>
          </div>

          {schedule.topik && (
            <p className="text-xs mt-2 text-muted-foreground">
              <strong>Topik:</strong> {schedule.topik}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================================
// UPCOMING QUIZZES SECTION
// ========================================

function UpcomingQuizzesSection({ quizzes }: { quizzes: any[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Kuis Mendatang
            </CardTitle>
            <CardDescription>Kuis yang perlu dikerjakan</CardDescription>
          </div>
          <Link to="/mahasiswa/kuis">
            <Button variant="ghost" size="sm">
              Lihat Semua
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {quizzes.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Tidak ada kuis"
            description="Anda tidak memiliki kuis yang perlu dikerjakan saat ini"
          />
        ) : (
          <div className="space-y-3">
            {quizzes.slice(0, 3).map((quiz) => (
              <div key={quiz.id} className="p-4 rounded-lg border">
                <h4 className="font-semibold text-sm">{quiz.judul}</h4>
                <p className="text-xs text-muted-foreground">{quiz.nama_mk}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========================================
// ENROLLED COURSES SECTION
// ========================================

function EnrolledCoursesSection({ courses }: { courses: any[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Mata Kuliah Aktif
            </CardTitle>
            <CardDescription>
              Total {courses.length} mata kuliah
            </CardDescription>
          </div>
          <Link to="/mahasiswa/mata-kuliah">
            <Button variant="ghost" size="sm">
              Lihat Semua
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Belum ada mata kuliah"
            description="Anda belum terdaftar di mata kuliah manapun"
          />
        ) : (
          <div className="space-y-3">
            {courses.slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CourseCard({ course }: { course: any }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">{course.kode_mk}</Badge>
            <Badge variant="secondary">{course.sks} SKS</Badge>
          </div>
          <h4 className="font-semibold text-sm truncate">{course.nama_mk}</h4>
          <p className="text-xs text-muted-foreground">{course.nama_kelas}</p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{course.dosen_name}</span>
            </div>
          </div>
        </div>
        
        <Link to={`/mahasiswa/mata-kuliah/${course.kelas_id}`}>
          <Button variant="ghost" size="sm">
            Detail
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ========================================
// LATEST GRADES SECTION
// ========================================

function LatestGradesSection({ grades }: { grades: any[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Nilai Terbaru
            </CardTitle>
            <CardDescription>Nilai yang baru diinput</CardDescription>
          </div>
          <Link to="/mahasiswa/nilai">
            <Button variant="ghost" size="sm">
              Lihat Semua
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {grades.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Belum ada nilai"
            description="Nilai Anda belum diinput oleh dosen"
          />
        ) : (
          <div className="space-y-3">
            {grades.slice(0, 4).map((grade) => (
              <div key={grade.id} className="p-4 rounded-lg border">
                <h4 className="font-semibold text-sm">{grade.nama_mk}</h4>
                <p className="text-xs text-muted-foreground">{grade.kelas}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}