/**
 * Jadwal Page - Mahasiswa
 * Display enrolled courses, schedule calendar, and course details
 * 
 * Features:
 * - View enrolled courses
 * - View course details with schedule
 * - Calendar integration (daily/weekly)
 * - Today's schedule
 * - Weekly schedule view
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import {
  getEnrolledCourses,
  getTodaySchedule,
  getWeeklySchedule,
} from '@/lib/api/mahasiswa.api';
import type { EnrolledCourse } from '@/types/mata-kuliah.types';
import type { TodaySchedule, WeeklySchedule } from '@/types/jadwal.types';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Icons
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  Users,
  Filter,
  Grid,
  List,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  PlayCircle,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'list' | 'calendar';
type DayFilter = 'all' | 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function JadwalPage() {
  const { user } = useAuth();
  
  // State
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [dayFilter, setDayFilter] = useState<DayFilter>('all');
  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(null);

  // Fetch data
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get mahasiswa ID from user
      const { data: mahasiswaData } = await supabase
        .from('mahasiswa')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!mahasiswaData) {
        throw new Error('Mahasiswa profile not found');
      }

      // Fetch all data in parallel
      const [courses, today, weekly] = await Promise.all([
        getEnrolledCourses(mahasiswaData.id),
        getTodaySchedule(mahasiswaData.id),
        getWeeklySchedule(mahasiswaData.id),
      ]);

      setEnrolledCourses(courses);
      setTodaySchedule(today);
      setWeeklySchedule(weekly);
    } catch (err: any) {
      console.error('Error fetching jadwal data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter courses by day
  const filteredCourses = dayFilter === 'all'
    ? enrolledCourses
    : enrolledCourses.filter(course => 
        weeklySchedule
          .find(w => w.hari === dayFilter)
          ?.schedules.some(s => s.kelas_id === course.kelas_id)
      );

  // Stats
  const stats = {
    totalCourses: enrolledCourses.length,
    todayClasses: todaySchedule.length,
    weeklyClasses: weeklySchedule.reduce((sum, day) => sum + day.schedules.length, 0),
  };

  // ============================================================================
  // RENDER - LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // ============================================================================
  // RENDER - ERROR STATE
  // ============================================================================

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // ============================================================================
  // RENDER - MAIN CONTENT
  // ============================================================================

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jadwal Praktikum</h1>
          <p className="text-muted-foreground">
            Lihat jadwal kuliah dan praktikum Anda
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="mr-2 h-4 w-4" />
            List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Grid className="mr-2 h-4 w-4" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Mata Kuliah</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Mata kuliah yang diikuti
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kelas Hari Ini</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayClasses}</div>
            <p className="text-xs text-muted-foreground">
              Jadwal praktikum hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Minggu Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyClasses}</div>
            <p className="text-xs text-muted-foreground">
              Total kelas seminggu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule Alert */}
      {todaySchedule.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Anda memiliki <strong>{todaySchedule.length} kelas</strong> hari ini.
            {todaySchedule.some(s => s.is_now) && (
              <span className="text-orange-600 font-semibold"> Sedang berlangsung!</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Hari Ini</TabsTrigger>
          <TabsTrigger value="courses">Mata Kuliah</TabsTrigger>
          <TabsTrigger value="weekly">Jadwal Mingguan</TabsTrigger>
        </TabsList>

        {/* Today's Schedule Tab */}
        <TabsContent value="today" className="space-y-4">
          {todaySchedule.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Tidak ada jadwal hari ini</p>
                <p className="text-sm text-muted-foreground">
                  Nikmati hari libur Anda!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {todaySchedule.map((schedule) => (
                <TodayScheduleCard key={schedule.id} schedule={schedule} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Enrolled Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          {/* Day Filter */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Filter Hari</CardTitle>
                  <CardDescription>Pilih hari untuk melihat mata kuliah</CardDescription>
                </div>
                <Filter className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['all', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'].map((day) => (
                  <Button
                    key={day}
                    variant={dayFilter === day ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDayFilter(day as DayFilter)}
                  >
                    {day === 'all' ? 'Semua' : day.charAt(0).toUpperCase() + day.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Courses List */}
          {viewMode === 'list' ? (
            <CoursesList 
              courses={filteredCourses} 
              weeklySchedule={weeklySchedule}
              onSelectCourse={setSelectedCourse}
            />
          ) : (
            <CoursesGrid 
              courses={filteredCourses}
              weeklySchedule={weeklySchedule}
              onSelectCourse={setSelectedCourse}
            />
          )}
        </TabsContent>

        {/* Weekly Schedule Tab */}
        <TabsContent value="weekly" className="space-y-4">
          <WeeklyScheduleView weeklySchedule={weeklySchedule} />
        </TabsContent>
      </Tabs>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          weeklySchedule={weeklySchedule}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Today's Schedule Card
 */
function TodayScheduleCard({ schedule }: { schedule: TodaySchedule }) {
  const getStatusIcon = () => {
    if (schedule.is_now) return <PlayCircle className="h-5 w-5 text-orange-600" />;
    if (schedule.is_past) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <Clock className="h-5 w-5 text-blue-600" />;
  };

  const getStatusBadge = () => {
    if (schedule.is_now) return <Badge className="bg-orange-600">Sedang Berlangsung</Badge>;
    if (schedule.is_past) return <Badge variant="secondary">Selesai</Badge>;
    return <Badge variant="default">Akan Datang</Badge>;
  };

  return (
    <Card className={schedule.is_now ? 'border-orange-600 border-2' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {getStatusIcon()}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{schedule.nama_mk}</h3>
                <p className="text-sm text-muted-foreground">
                  {schedule.kode_mk} • {schedule.nama_kelas}
                </p>
              </div>
              {getStatusBadge()}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{schedule.jam_mulai} - {schedule.jam_selesai}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{schedule.nama_lab}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{schedule.dosen_name}</span>
              </div>
              {schedule.topik && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{schedule.topik}</span>
                </div>
              )}
            </div>

            {schedule.catatan && (
              <div className="text-sm text-muted-foreground border-t pt-2 mt-2">
                <p>{schedule.catatan}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Courses List View
 */
function CoursesList({ 
  courses, 
  weeklySchedule,
  onSelectCourse 
}: { 
  courses: EnrolledCourse[];
  weeklySchedule: WeeklySchedule[];
  onSelectCourse: (course: EnrolledCourse) => void;
}) {
  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Tidak ada mata kuliah</p>
          <p className="text-sm text-muted-foreground">
            Belum ada mata kuliah yang terdaftar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {courses.map((course) => {
        // Get schedule for this course
        const courseSchedules = weeklySchedule.flatMap(day => 
          day.schedules.filter(s => s.kelas_id === course.kelas_id)
        );

        return (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{course.nama_mk}</h3>
                    <Badge variant="secondary">{course.sks} SKS</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {course.kode_mk} • {course.nama_kelas}
                  </p>

                  {/* Schedule Summary */}
                  <div className="space-y-2">
                    {courseSchedules.length > 0 ? (
                      courseSchedules.map((schedule, idx) => (
                        <div key={idx} className="flex items-center gap-4 text-sm">
                          <Badge variant="outline">
                            {schedule.hari.charAt(0).toUpperCase() + schedule.hari.slice(1)}
                          </Badge>
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {schedule.jam_mulai} - {schedule.jam_selesai}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {schedule.nama_lab}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Belum ada jadwal
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{course.dosen_name}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectCourse(course)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Courses Grid View
 */
function CoursesGrid({ 
  courses,
  weeklySchedule,
  onSelectCourse 
}: { 
  courses: EnrolledCourse[];
  weeklySchedule: WeeklySchedule[];
  onSelectCourse: (course: EnrolledCourse) => void;
}) {
  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Tidak ada mata kuliah</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const courseSchedules = weeklySchedule.flatMap(day => 
          day.schedules.filter(s => s.kelas_id === course.kelas_id)
        );

        return (
          <Card 
            key={course.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectCourse(course)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{course.nama_mk}</CardTitle>
                  <CardDescription>{course.kode_mk}</CardDescription>
                </div>
                <Badge variant="secondary">{course.sks} SKS</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">{course.nama_kelas}</p>
              <p className="text-sm text-muted-foreground">{course.dosen_name}</p>
              
              {courseSchedules.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Jadwal:</p>
                  {courseSchedules.slice(0, 2).map((schedule, idx) => (
                    <p key={idx} className="text-xs">
                      {schedule.hari.charAt(0).toUpperCase() + schedule.hari.slice(1)}, {schedule.jam_mulai}
                    </p>
                  ))}
                  {courseSchedules.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{courseSchedules.length - 2} lainnya
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Weekly Schedule View
 */
function WeeklyScheduleView({ weeklySchedule }: { weeklySchedule: WeeklySchedule[] }) {
  const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const daySchedule = weeklySchedule.find(w => w.hari === day);
        const schedules = daySchedule?.schedules || [];

        return (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="text-lg">
                {day.charAt(0).toUpperCase() + day.slice(1)}
                <Badge variant="secondary" className="ml-2">
                  {schedules.length} kelas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Tidak ada jadwal
                </p>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <div 
                      key={schedule.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{schedule.nama_mk}</h4>
                        <p className="text-sm text-muted-foreground">
                          {schedule.kode_mk} • {schedule.nama_kelas}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {schedule.jam_mulai} - {schedule.jam_selesai}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {schedule.nama_lab}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Course Detail Modal (Placeholder)
 */
function CourseDetailModal({ 
  course, 
  weeklySchedule,
  onClose 
}: { 
  course: EnrolledCourse;
  weeklySchedule: WeeklySchedule[];
  onClose: () => void;
}) {
  const courseSchedules = weeklySchedule.flatMap(day => 
    day.schedules.filter(s => s.kelas_id === course.kelas_id)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{course.nama_mk}</CardTitle>
              <CardDescription>
                {course.kode_mk} • {course.nama_kelas} • {course.sks} SKS
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dosen */}
          <div>
            <h3 className="font-semibold mb-2">Dosen Pengampu</h3>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{course.dosen_name}</span>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="font-semibold mb-2">Jadwal Praktikum</h3>
            {courseSchedules.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Belum ada jadwal</p>
            ) : (
              <div className="space-y-2">
                {courseSchedules.map((schedule, idx) => (
                  <div key={idx} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">
                        {schedule.hari.charAt(0).toUpperCase() + schedule.hari.slice(1)}
                      </Badge>
                      {schedule.minggu_ke && (
                        <Badge variant="secondary">Minggu {schedule.minggu_ke}</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {schedule.jam_mulai} - {schedule.jam_selesai}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {schedule.nama_lab}
                      </div>
                    </div>
                    {schedule.topik && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        Topik: {schedule.topik}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}