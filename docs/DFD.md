# Data Flow Diagram (DFD)
## Sistem Praktikum PWA - All Levels

---

## 1. NOTASI & SIMBOL

### Simbol DFD yang Digunakan:

```
┌─────────────┐
│  PROCESS    │  = Proses/Transformasi (circle/rounded rectangle)
└─────────────┘

┌─────────────┐
│   ENTITY    │  = Entity External (terminator)
└─────────────┘

┌─────────────┐
│  DATA STORE │  = Data Storage (database)
└─────────────┘

──────→        = Data Flow (panah)
```

---

## 2. DFD LEVEL 0 - CONTEXT DIAGRAM

### 2.1 Context Diagram (Mermaid)

```mermaid
graph LR
    subgraph "External Entities"
        Mahasiswa[Mahasiswa]
        Dosen[Dosen]
        Laboran[Laboran]
        Admin[Admin]
        Supabase[Supabase Server]
    end

    subgraph "System: Sistem Praktikum PWA"
        SPWA[Sistem Praktikum PWA]
    end

    Mahasiswa <-->|Login, Lihat Jadwal, Kerjakan Kuis, Akses Materi| SPWA
    Dosen <-->|Kelola Kuis, Upload Materi, Kelola Kelas| SPWA
    Laboran <-->|Lihat Jadwal Lab, Resolve Konflik| SPWA
    Admin <-->|Kelola User, Kelola Kelas, Generate Reports| SPWA
    SPWA <-->|Sync Data| Supabase
```

### 2.2 Deskripsi Context Diagram

**Sistem**: Sistem Praktikum PWA
**External Entities**: 5 entities
- Mahasiswa
- Dosen
- Laboran
- Admin
- Supabase Server

**Data Flows**:
- Mahasiswa → Sistem: Login request, lihat jadwal, kerjakan kuis
- Sistem → Mahasiswa: Jadwal praktikum, kuis, materi, notifikasi
- Dosen → Sistem: Buat kuis, upload materi, kelola kelas
- Sistem → Dosen: Daftar kuis, kelas, rekap nilai
- Laboran → Sistem: Lihat jadwal lab, resolve konflik
- Sistem → Laboran: Jadwal lab, conflict alerts
- Admin → Sistem: Manage users, manage kelas, generate reports
- Sistem → Admin: User lists, statistics, reports
- Sistem ↔ Supabase: Sync data online/offline

---

## 3. DFD LEVEL 1

### 3.1 Level 1 Diagram (Mermaid)

```mermaid
graph TB
    subgraph "External Entities"
        Mahasiswa
        Dosen
        Laboran
        Admin
        Supabase
    end

    subgraph "Processes"
        P1(Authentication)
        P2(Kelola Jadwal)
        P3(Kelola Kuis & Bank Soal)
        P4(Kelola Materi)
        P5(Kelola Kelas)
        P6(Kelola User)
        P7(Notification System)
        P8(Offline Sync & Cache)
    end

    subgraph "Data Stores"
        D1[(Database Supabase)]
        D2[(IndexedDB Cache)]
        D3[(Offline Queue)]
    end

    %% Authentication Flow
    Mahasiswa -->|Login Credentials| P1
    Dosen -->|Login Credentials| P1
    Laboran -->|Login Credentials| P1
    Admin -->|Login Credentials| P1
    P1 <-->|Validate User| D1
    P1 -->|Session Token| Mahasiswa
    P1 -->|Session Token| Dosen
    P1 -->|Session Token| Laboran
    P1 -->|Session Token| Admin

    %% Jadwal Flow
    Mahasiswa -->|Request Jadwal| P2
    Laboran -->|Request Jadwal Lab| P2
    P2 <-->|Query Jadwal| D1
    P2 <-->|Cache Jadwal| D2
    P2 -->|Display Jadwal| Mahasiswa
    P2 -->|Display Jadwal| Laboran

    %% Kuis Flow
    Mahasiswa -->|Kerjakan Kuis| P3
    Dosen -->|Kelola Kuis/Bank Soal| P3
    P3 <-->|CRUD Kuis| D1
    P3 <-->|Cache Data| D2
    P3 -->|Kuis & Nilai| Mahasiswa
    P3 -->|Bank Soal Management| Dosen

    %% Materi Flow
    Dosen -->|Upload Materi| P4
    Mahasiswa -->|Download Materi| P4
    P4 <-->|CRUD Materi| D1
    P4 <-->|Cache Materi| D2
    P4 -->|Materi List| Mahasiswa

    %% Kelas Flow
    Dosen -->|Manage Kelas| P5
    Admin -->|Manage Kelas| P5
    Mahasiswa -->|Lihat Kelas| P5
    P5 <-->|CRUD Kelas| D1
    P5 <-->|Cache Kelas| D2
    P5 -->|Kelas Info| Dosen
    P5 -->|Kelas Info| Mahasiswa
    P5 -->|Kelas Info| Admin

    %% User Management Flow
    Admin -->|CRUD Users| P6
    P6 <-->|Manage Users| D1
    P6 -->|User Lists| Admin

    %% Notification Flow
    P3 -->|Trigger Event| P7
    P4 -->|Trigger Event| P7
    P5 -->|Trigger Event| P7
    P7 <-->|Store Notifications| D1
    P7 <-->|Cache Notifications| D2
    P7 -->|Push Notification| Mahasiswa
    P7 -->|Push Notification| Dosen

    %% Offline Sync Flow
    P2 -->|Sync Data| P8
    P3 -->|Sync Data| P8
    P4 -->|Sync Data| P8
    P5 -->|Sync Data| P8
    P8 <-->|Queue Operations| D3
    P8 <-->|Manage Cache| D2
    P8 <-->|Sync Database| D1
    P8 <-->|Resolve Conflicts| Supabase
```

### 3.2 Deskripsi Proses Level 1

| Process ID | Nama Proses | Deskripsi |
|------------|-------------|-----------|
| **P1** | Authentication | Validasi login/logout, manage session |
| **P2** | Kelola Jadwal | CRUD jadwal praktikum & jadwal lab |
| **P3** | Kelola Kuis & Bank Soal | CRUD kuis, bank soal, penilaian |
| **P4** | Kelola Materi | Upload/download materi perkuliahan |
| **P5** | Kelola Kelas | CRUD kelas, enrollment mahasiswa |
| **P6** | Kelola User | Manage users, roles, permissions |
| **P7** | Notification System | Auto-notification untuk events |
| **P8** | Offline Sync & Cache | Cache management, offline queue, sync, conflict resolution |

### 3.3 Deskripsi Data Store Level 1

| Data Store ID | Nama | Deskripsi |
|---------------|------|-----------|
| **D1** | Database Supabase | Database utama (PostgreSQL) |
| **D2** | IndexedDB Cache | Browser cache untuk offline |
| **D3** | Offline Queue | Queue untuk write operations saat offline |

---

## 4. DFD LEVEL 2

### 4.1 Process 1: Authentication (Detailed)

```mermaid
graph TB
    subgraph "External Entities"
        User[Mahasiswa/Dosen/Laboran/Admin]
        SupabaseAuth[Supabase Auth Service]
    end

    subgraph "Process 1.1 - Authentication Detail"
        P1_1[Validate Credentials]
        P1_2[Generate Session]
        P1_3[Manage Role-Based Access]
        P1_4[Logout & Clear Session]
    end

    subgraph "Data Stores"
        D1_1[(User Profiles)]
        D1_2[(Session Storage)]
    end

    User -->|Login Request| P1_1
    P1_1 <-->|Check Credentials| D1_1
    P1_1 <-->|Verify User| SupabaseAuth
    P1_1 -->|Valid User| P1_2
    P1_1 -->|Invalid User| User

    P1_2 -->|Create Token| P1_3
    P1_3 -->|Store Session| D1_2
    P1_3 -->|Grant Access| User

    User -->|Logout Request| P1_4
    P1_4 -->|Clear Session| D1_2
    P1_4 -->|Redirect to Login| User
```

**Deskripsi**:
- **P1.1**: Validasi email/password ke Supabase Auth
- **P1.2**: Generate JWT session token
- **P1.3**: Cek role (admin/dosen/mahasiswa/laboran) dan grant permissions
- **P1.4**: Clear session saat logout

---

### 4.2 Process 2: Kelola Jadwal (Detailed)

```mermaid
graph TB
    subgraph "External Entities"
        Mahasiswa
        Laboran
        Dosen
    end

    subgraph "Process 2.0 - Kelola Jadwal Detail"
        P2_1[Query Jadwal with Filters]
        P2_2[Check Cache Status]
        P2_3[Fetch from Database]
        P2_4[Store to Cache]
        P2_5[Display Jadwal]
        P2_6[Create/Update Jadwal]
    end

    subgraph "Data Stores"
        D2_1[(Jadwal Table)]
        D2_2[(Cache Storage)]
    end

    %% Read Flow
    Mahasiswa -->|Lihat Jadwal| P2_1
    Laboran -->|Lihat Jadwal Lab| P2_1
    Dosen -->|Lihat Jadwal Mengajar| P2_1

    P2_1 -->|Generate Query Key| P2_2
    P2_2 -->|Cache MISS?| P2_3
    P2_2 -->|Cache HIT| P2_5

    P2_3 <-->|SELECT Jadwal| D2_1
    P2_3 -->|Return Data| P2_4
    P2_4 -->|Store with TTL| D2_2
    P2_4 -->|Cached Data| P2_5

    P2_5 -->|Formatted Jadwal| Mahasiswa
    P2_5 -->|Formatted Jadwal| Laboran
    P2_5 -->|Formatted Jadwal| Dosen

    %% Write Flow (Admin/Dosen only)
    Dosen -->|Create Jadwal| P2_6
    P2_6 <-->|INSERT/UPDATE| D2_1
    P2_6 -->|Invalidate Cache| D2_2
    P2_6 -->|Success| Dosen
```

**Deskripsi**:
- **P2.1**: Proses request jadwal dengan filters (hari, lab, kelas)
- **P2.2**: Cek cache - apakah data ada di IndexedDB?
- **P2.3**: Jika cache miss, fetch dari Supabase
- **P2.4**: Simpan ke cache dengan TTL (5 menit)
- **P2.5**: Tampilkan jadwal ke user
- **P2.6**: Create/update jadwal (admin/dosen only), invalidate cache

---

### 4.3 Process 3: Kelola Kuis & Bank Soal (Detailed)

```mermaid
graph TB
    subgraph "External Entities"
        Dosen
        Mahasiswa
    end

    subgraph "Process 3.0 - Kuis & Bank Soal Detail"
        P3_1[Manage Kuis]
        P3_2[Manage Bank Soal]
        P3_3[Kerjakan Kuis]
        P3_4[Penilaian Kuis]
        P3_5[Auto Notification]
    end

    subgraph "Data Stores"
        D3_1[(Kuis Table)]
        D3_2[(Bank Soal Table)]
        D3_3[(Soal Table)]
        D3_4[(Submission Table)]
        D3_5[(Notification Queue)]
    end

    %% Dosen Flow - Manage Kuis
    Dosen -->|Create Kuis| P3_1
    P3_1 <-->|INSERT Kuis| D3_1
    P3_1 <-->|Add Soal from Bank| D3_2
    P3_1 <-->|Link Soal| D3_3
    P3_1 -->|Trigger Notification| P3_5
    P3_1 -->|Kuis Created| Dosen

    %% Dosen Flow - Manage Bank Soal
    Dosen -->|Add to Bank Soal| P3_2
    P3_2 <-->|INSERT Bank Soal| D3_2
    P3_2 -->|Bank Soal Updated| Dosen

    %% Mahasiswa Flow - Kerjakan Kuis
    Mahasiswa -->|Request Kuis| P3_1
    P3_1 -->|Display Kuis| Mahasiswa

    Mahasiswa -->|Submit Jawaban| P3_3
    P3_3 <-->|Store Submission| D3_4
    P3_3 -->|Submission Recorded| Mahasiswa

    %% Dosen Flow - Penilaian
    Dosen -->|Request Submission| P3_4
    P3_4 <-->|Read Submission| D3_4
    P3_4 -->|Display for Grading| Dosen

    Dosen -->|Input Nilai| P3_4
    P3_4 <-->|UPDATE Nilai| D3_4
    P3_4 -->|Trigger Notification| P3_5
    P3_4 -->|Nilai Recorded| Mahasiswa

    %% Notification
    P3_5 -->|Queue Notification| D3_5
```

**Deskripsi**:
- **P3.1**: CRUD kuis (create, read, update, delete)
- **P3.2**: CRUD bank soal untuk reuse pertanyaan
- **P3.3**: Mahasiswa kerjakan kuis, simpan jawaban
- **P3.4**: Dosen nilai kuis, simpan nilai
- **P3.5**: Trigger notification saat kuis dibuat/dinilai

---

### 4.4 Process 4: Kelola Materi (Detailed)

```mermaid
graph TB
    subgraph "External Entities"
        Dosen
        Mahasiswa
        SupabaseStorage[Supabase Storage]
    end

    subgraph "Process 4.0 - Materi Detail"
        P4_1[Upload Materi]
        P4_2[Download Materi]
        P4_3[List Materi]
        P4_4[Delete Materi]
    end

    subgraph "Data Stores"
        D4_1[(Materi Metadata)]
        D4_2[(File Storage)]
    end

    %% Upload Flow
    Dosen -->|Select File| P4_1
    P4_1 -->|Upload File| SupabaseStorage
    SupabaseStorage -->|File URL| P4_1
    P4_1 <-->|Store Metadata| D4_1
    P4_1 -->|Upload Success| Dosen

    %% List Flow
    Mahasiswa -->|Request List| P4_3
    Dosen -->|Request List| P4_3
    P4_3 <-->|Query Materi| D4_1
    P4_3 -->|Display List| Mahasiswa
    P4_3 -->|Display List| Dosen

    %% Download Flow
    Mahasiswa -->|Click Download| P4_2
    P4_2 <-->|Get File URL| D4_1
    P4_2 -->|Download File| Mahasiswa

    %% Delete Flow
    Dosen -->|Delete Request| P4_4
    P4_4 -->|Delete File| SupabaseStorage
    P4_4 <-->|Delete Metadata| D4_1
    P4_4 -->|Delete Success| Dosen
```

**Deskripsi**:
- **P4.1**: Upload materi ke Supabase Storage, simpan metadata di database
- **P4.2**: Download materi dari Supabase Storage URL
- **P4.3**: List materi berdasarkan kelas/user access
- **P4.4**: Delete materi & file dari storage

---

### 4.5 Process 5: Kelola Kelas (Detailed)

```mermaid
graph TB
    subgraph "External Entities"
        Admin
        Dosen
        Mahasiswa
    end

    subgraph "Process 5.0 - Kelas Detail"
        P5_1[Create Kelas]
        P5_2[Enroll Mahasiswa]
        P5_3[View Kelas Info]
        P5_4[Manage Kelas Members]
    end

    subgraph "Data Stores"
        D5_1[(Kelas Table)]
        D5_2[(Mahasiswa_Kelas Junction)]
        D5_3[(Profiles)]
    end

    %% Create Kelas
    Admin -->|Create Kelas| P5_1
    Dosen -->|Request Kelas| P5_1
    P5_1 <-->|INSERT Kelas| D5_1
    P5_1 -->|Kelas Created| Admin

    %% Enroll Flow
    Mahasiswa -->|Join Kelas| P5_2
    Admin -->|Add Mahasiswa| P5_2
    P5_2 <-->|Check Enrollment| D5_2
    P5_2 -->|Already Enrolled?| Mahasiswa
    P5_2 <-->|Create Enrollment| D5_2
    P5_2 -->|Enrollment Success| Mahasiswa

    %% View Kelas
    Mahasiswa -->|My Classes| P5_3
    Dosen -->|My Classes| P5_3
    P5_3 <-->|Query Kelas| D5_1
    P5_3 <-->|Get Members| D5_2
    P5_3 -->|Class List| Mahasiswa
    P5_3 -->|Class List| Dosen

    %% Manage Members
    Admin -->|Remove Student| P5_4
    P5_4 <-->|DELETE Enrollment| D5_2
    P5_4 -->|Member Removed| Admin
```

**Deskripsi**:
- **P5.1**: Create kelas dengan dosen, mata kuliah, jadwal
- **P5.2**: Enroll mahasiswa ke kelas (junction table)
- **P5.3**: View kelas info & members
- **P5.4**: Add/remove mahasiswa dari kelas

---

### 4.6 Process 6: Kelola User (Detailed)

```mermaid
graph TB
    subgraph "External Entities"
        Admin
        SupabaseAuth[Supabase Auth Service]
    end

    subgraph "Process 6.0 - Kelola User Detail"
        P6_1[Create New User]
        P6_2[Update User Profile]
        P6_3[Delete User]
        P6_4[View All Users]
        P6_5[Filter & Search Users]
        P6_6[Assign Role]
    end

    subgraph "Data Stores"
        D6_1[(Supabase Auth Users)]
        D6_2[(User Profiles)]
        D6_3[(User Roles Log)]
    end

    %% Create User Flow
    Admin -->|Create User Request| P6_1
    P6_1 -->|Validate Input| P6_1
    P6_1 -->|Create Auth Account| SupabaseAuth
    SupabaseAuth -->|User Created| P6_1
    P6_1 <-->|Create Profile| D6_2
    P6_1 -->|Log Creation| D6_3
    P6_1 -->|User Created Success| Admin

    %% Update User Flow
    Admin -->|Update User Request| P6_2
    P6_2 <-->|Check User Exists| D6_2
    P6_2 <-->|Update Profile| D6_2
    P6_2 -->|Log Update| D6_3
    P6_2 -->|Profile Updated| Admin

    %% Delete User Flow
    Admin -->|Delete User Request| P6_3
    P6_3 <-->|Check User Exists| D6_2
    P6_3 -->|Delete Auth Account| SupabaseAuth
    SupabaseAuth -->|Auth Deleted| P6_3
    P6_3 <-->|Delete Profile| D6_2
    P6_3 -->|Log Deletion| D6_3
    P6_3 -->|User Deleted| Admin

    %% View All Users Flow
    Admin -->|View Users| P6_4
    P6_4 <-->|Query All Profiles| D6_2
    P6_4 -->|Display Users List| Admin

    %% Filter & Search Flow
    Admin -->|Search/Filter Request| P6_5
    P6_5 <-->|Apply Filters| D6_2
    P6_5 -->|Filter Results| Admin

    %% Assign Role Flow
    Admin -->|Assign Role Request| P6_6
    P6_6 <-->|Update Role| D6_2
    P6_6 -->|Log Role Change| D6_3
    P6_6 -->|Role Assigned| Admin
```

**Deskripsi**:
- **P6.1**: Create new user - membuat auth account di Supabase & profile
- **P6.2**: Update user profile - update nama, email, role, dll
- **P6.3**: Delete user - hapus auth account & profile (soft delete recommended)
- **P6.4**: View all users - list semua users dengan pagination
- **P6.5**: Filter & search users - filter berdasarkan role, nama, email, dll
- **P6.6**: Assign role - assign/ubah user role (admin/dosen/mahasiswa/laboran)

**Data Flows**:
| Data Flow | Deskripsi |
|-----------|-----------|
| User Data | Data user baru (email, password, role, nama) |
| Validation Result | Hasil validasi input |
| Auth Account ID | ID dari Supabase Auth |
| Profile Data | Data profile (nama_lengkap, nim_nip, dll) |
| Update Confirmation | Konfirmasi update berhasil |
| Deletion Confirmation | Konfirmasi delete berhasil |
| Users List | List semua users |
| Filtered Users | Hasil filter/search |
| Role Assignment | Role yang diassign ke user |

---

### 4.7 Process 7: Notification System (Detailed)

```mermaid
graph TB
    subgraph "External Entities"
        Mahasiswa
        Dosen
    end

    subgraph "Process 7.0 - Notification Detail"
        P7_1[Event Listener]
        P7_2[Determine Recipients]
        P7_3[Create Notifications]
        P7_4[Push Notification]
        P7_5[Mark as Read]
    end

    subgraph "Data Stores"
        D7_1[(Notifications Table)]
        D7_2[(User Profiles)]
    end

    %% Trigger Events
    P7_1 -->|Kuis Created| P7_2
    P7_1 -->|Nilai Masuk| P7_2
    P7_1 -->|Materi Uploaded| P7_2

    %% Determine Recipients
    P7_2 <-->|Get Class Members| D7_2
    P7_2 -->|List Recipients| P7_3

    %% Create Notifications
    P7_3 <-->|Bulk Insert| D7_1
    P7_3 -->|Notifications Created| P7_4

    %% Push
    P7_4 -->|Push to Browser| Mahasiswa
    P7_4 -->|Push to Browser| Dosen

    %% Mark Read
    Mahasiswa -->|Click Notification| P7_5
    P7_5 <-->|UPDATE Read Status| D7_1
```

**Deskripsi**:
- **P7.1**: Listen untuk events (kuis_created, nilai_input, materi_uploaded)
- **P7.2**: Determine recipients berdasarkan event
- **P7.3**: Bulk create notifications untuk semua recipients
- **P7.4**: Push notification ke browser (PWA)
- **P7.5**: Mark notification as read saat user click

---

### 4.7 Process 8: Offline Sync & Cache (Detailed) ✨

```mermaid
graph TB
    subgraph "External Entities"
        User[All Users]
        Supabase
    end

    subgraph "Process 8.0 - Offline Sync & Cache Detail"
        P8_1[Monitor Network Status]
        P8_2[Read Operation - Cache Strategy]
        P8_3[Write Operation - Queue Strategy]
        P8_4[Sync Manager]
        P8_5[Conflict Detection]
        P8_6[Conflict Resolution]
        P8_7[Cache Invalidation]
    end

    subgraph "Data Stores"
        D8_1[(IndexedDB Cache)]
        D8_2[(Offline Queue)]
        D8_3[(Supabase Database)]
        D8_4[(Conflict Log)]
    end

    %% Network Monitoring
    P8_1 -->|Online Status| P8_2
    P8_1 -->|Offline Status| P8_3
    P8_1 -->|Back Online| P8_4

    %% Read Flow (Stale-While-Revalidate)
    User -->|Request Data| P8_2
    P8_2 <-->|Check Cache| D8_1

    P8_2 -->|Cache HIT| User
    P8_2 -->|Cache MISS| P8_4

    P8_2 -->|Cache STALE| User
    P8_2 -->|Background Revalidate| P8_4

    P8_4 <-->|Fetch from DB| D8_3
    P8_4 -->|Update Cache| D8_1
    P8_4 -->|Fresh Data| User

    %% Write Flow (Queue)
    User -->|Create/Update| P8_3
    P8_3 <-->|Queue Operation| D8_2
    P8_3 -->|Queued for Sync| User

    %% Sync when Online
    P8_4 <-->|Process Queue| D8_2
    P8_4 -->|Update Request| P8_5

    %% Conflict Detection
    P8_5 <-->|Check Server State| D8_3
    P8_5 -->|No Conflict| P8_4
    P8_5 -->|Conflict Detected| P8_6

    P8_5 <-->|Log Conflict| D8_4

    %% Conflict Resolution
    P8_6 -->|Show to User| User
    User -->|Choose Winner| P8_6
    P8_6 <-->|Apply Resolution| D8_3
    P8_6 <-->|Update Log| D8_4

    %% Cache Invalidation
    P8_4 -->|Invalidate Related Cache| P8_7
    P8_7 <-->|Delete Cache| D8_1
```

**Deskripsi**:
- **P8.1**: Monitor `navigator.onLine` status
- **P8.2**: Handle read operations dengan stale-while-revalidate:
  - Cache HIT → Return immediately
  - Cache STALE → Return stale, revalidate di background
  - Cache MISS → Fetch from DB, cache it
- **P8.3**: Handle write operations saat offline:
  - Queue ke IndexedDB
  - Return "Queued for sync"
- **P8.4**: Sync manager yang:
  - Process queue saat online
  - Retry failed operations
  - Handle sync errors
- **P8.5**: Conflict detection:
  - Compare local vs server version
  - Check if record modified since queued
- **P8.6**: Conflict resolution:
  - Show ke user untuk pilih winner (local/remote)
  - Apply resolution
  - Log ke conflict_log table
- **P8.7**: Cache invalidation:
  - Invalidate related cache setelah write
  - Pattern-based invalidation (e.g., invalidate all "kelas_*" keys)

---

## 5. DATA DICTIONARY

### 5.1 Data Flows

| Data Flow ID | Nama | Source | Destination | Deskripsi |
|--------------|------|--------|-------------|-----------|
| DF1 | Login Credentials | User | P1 | Email & password |
| DF2 | Session Token | P1 | User | JWT token |
| DF3 | Jadwal Request | Mahasiswa | P2 | Request jadwal dengan filters |
| DF4 | Jadwal Data | P2 | Mahasiswa | List jadwal praktikum |
| DF5 | Kuis Data | Dosen | P3 | Kuis yang akan dibuat/diedit |
| DF6 | Bank Soal Data | P3 | Dosen | Soal dari bank untuk ditambahkan |
| DF7 | Submission Data | Mahasiswa | P3 | Jawaban kuis |
| DF8 | Nilai Data | P3 | Mahasiswa | Nilai kuis |
| DF9 | Materi File | Dosen | P4 | File materi yang diupload |
| DF10 | Materi URL | P4 | Mahasiswa | URL untuk download materi |
| DF11 | Enrollment Data | Admin | P5 | Data enroll mahasiswa ke kelas |
| DF12 | Kelas List | P5 | Mahasiswa | Kelas yang diikuti mahasiswa |
| DF13 | Notification | P7 | User | Push notification |
| DF14 | Read Status | User | P7 | Notification read ack |
| DF15 | Sync Data | P8 | Supabase | Data untuk sync |
| DF16 | Conflict Data | P8 | User | Conflict yang perlu resolution |

---

### 5.2 Data Elements

| Element | Tipe | Deskripsi | Contoh |
|---------|------|-----------|--------|
| user_id | UUID | Unique identifier user | "550e8400-e29b-41d4-a716-446655440000" |
| email | string | Email user | "mahasiswa@univ.ac.id" |
| role | enum | Role user | "mahasiswa", "dosen", "laboran", "admin" |
| kelas_id | UUID | ID kelas | "..." |
| kuis_id | UUID | ID kuis | "..." |
| jadwal_id | UUID | ID jadwal | "..." |
| tanggal_praktikum | date | Tanggal praktikum | "2025-01-15" |
| jam_mulai | time | Jam mulai | "08:00:00" |
| jam_selesai | time | Jam selesai | "10:00:00" |
| nilai | integer | Nilai kuis | 0-100 |
| status | enum | Status record | "pending", "active", "completed" |
| cache_key | string | Key untuk cache | "query_jadwal_{filters}" |
| ttl | integer | Cache TTL | 300000 (5 minutes) |
| conflict_type | enum | Tipe conflict | "local_vs_remote", "duplicate" |

---

## 6. SUMMARY DFD LEVELS

| Level | Jumlah Process | Jumlah Entity | Jumlah Data Store | Deskripsi | Status |
|-------|----------------|---------------|-------------------|-----------|--------|
| **Level 0** | 1 (sistem) | 5 | 1 | Context diagram - high level view | ✅ 100% |
| **Level 1** | 8 | 5 | 3 | Major processes dalam sistem | ✅ 100% |
| **Level 2** | 36 | 5 | 15+ | Detail setiap proses | ✅ 100% |

**Level 2 Breakdown**:
- P1: Authentication (4 sub-processes)
- P2: Kelola Jadwal (6 sub-processes)
- P3: Kelola Kuis & Bank Soal (5 sub-processes)
- P4: Kelola Materi (4 sub-processes)
- P5: Kelola Kelas (4 sub-processes)
- **P6: Kelola User (6 sub-processes)** ✨ NEW
- P7: Notification System (5 sub-processes)
- P8: Offline Sync & Cache (7 sub-processes)

---

## 7. SPESIAL: OFFLINE FIRST FLOW

### 7.1 Complete Offline First Scenario (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    participant User as Mahasiswa
    participant UI as React UI
    participant Cache as IndexedDB Cache
    participant Queue as Offline Queue
    participant DB as Supabase DB

    Note over User,DB: SCENARIO 1: READ - ONLINE MODE
    User->>UI: Buka Jadwal Page
    UI->>Cache: Check cache
    Cache-->>UI: Cache MISS
    UI->>DB: Fetch jadwal
    DB-->>UI: Return jadwal
    UI->>Cache: Store cache (5 min TTL)
    UI-->>User: Display jadwal

    Note over User,DB: SCENARIO 2: READ - OFFLINE MODE
    User->>UI: Buka Jadwal Page (OFFLINE)
    UI->>Cache: Check cache
    Cache-->>UI: Cache HIT (stale tapi ada)
    UI-->>User: Display jadwal + offline banner
    Note over UI: Background: Queue revalidate saat online

    Note over User,DB: SCENARIO 3: WRITE - ONLINE MODE
    User->>UI: Submit kuis
    UI->>DB: INSERT submission
    DB-->>UI: Success
    UI->>Cache: Invalidate cache
    UI-->>User: Success message

    Note over User,DB: SCENARIO 4: WRITE - OFFLINE MODE
    User->>UI: Submit kuis (OFFLINE)
    UI->>Queue: Queue operation
    Queue->>Cache: Store queue item
    Cache-->>Queue: Queued
    Queue-->>UI: Queued for sync
    UI-->>User: "Tersimpan, akan sinkron saat online"

    Note over User,DB: SCENARIO 5: SYNC WHEN ONLINE
    User->>UI: Online (navigator.onLine = true)
    UI->>Queue: Process queue
    Queue->>DB: Sync queued items
    DB-->>Queue: Success
    Queue->>Cache: Clear processed items
    UI-->>User: Sync complete

    Note over User,DB: SCENARIO 6: CONFLICT DETECTION
    Queue->>DB: Sync item
    DB-->>Queue: Error: Record modified
    Queue->>Cache: Log conflict
    Cache-->>UI: Show conflict to user
    UI->>User: Choose winner (local/remote)
    User->>UI: Select "local"
    UI->>DB: Apply local version
    DB-->>UI: Success
    UI-->>User: Conflict resolved
```

---

## 8. IMPLEMENTATION MAPPING

### 8.1 Process to Code Mapping

| Process | File/Function | Description |
|---------|---------------|-------------|
| P1 | `src/lib/hooks/useAuth.ts` | Authentication hook |
| P2 | `src/lib/api/jadwal.api.ts` | Jadwal API |
| P3 | `src/lib/api/kuis.api.ts`, `bank-soal.api.ts` | Kuis & Bank Soal APIs |
| P4 | `src/lib/api/materi.api.ts` | Materi API |
| P5 | `src/lib/api/kelas.api.ts` | Kelas API |
| P6 | `src/lib/api/auth.api.ts` | User management |
| P7 | `src/lib/api/notification.api.ts` | Notification API |
| P8 | `src/lib/offline/api-cache.ts`, `sync.ts` | Offline sync & cache |

### 8.2 Data Store to Database Mapping

| Data Store | Database | Table/Store |
|------------|----------|-------------|
| D1 | Supabase PostgreSQL | All tables |
| D2 | IndexedDB | `cache`, `offline_queue`, `conflicts` |
| D3 | IndexedDB | `offline_queue` (client) |

---

## 9. ANALISIS

### 9.1 Kelebihan Arsitektur

1. **Offline First**: App tetap bisa digunakan saat offline
2. **Stale-While-Revalidate**: Response cepat dari cache, data tetap fresh
3. **Conflict Resolution**: User control saat ada conflict
4. **Scalable**: DFD menunjukkan sistem siap untuk scale
5. **Modular**: Setiap proses independent, mudah maintain

### 9.2 Kompleksitas

| Aspect | Complexity Level | Catatan |
|--------|------------------|---------|
| Authentication | Low | Standard Supabase Auth |
| CRUD Operations | Low | Straightforward |
| Offline Cache | Medium | Perlu cache management strategy |
| Offline Queue | Medium | Perlu retry mechanism |
| Conflict Resolution | High | Perlu user intervention logic |
| Notification | Medium | Event-driven architecture |

---

## 10. REKOMENDASI

### 10.1 Pengembangan Lanjut

1. **E2E Testing**: Test flow offline → online → sync
2. **Monitoring**: Monitor cache hit rate, queue size
3. **Analytics**: Track user behavior patterns
4. **Performance**: Optimize cache TTL berdasarkan usage

### 10.2 Best Practices Applied

✅ **Separation of Concerns**: Setiap proses fokus ke satu tanggung jawab
✅ **Single Source of Truth**: Supabase sebagai master data
✅ **Cache Strategy**: Stale-while-revalidate untuk UX optimal
✅ **Error Handling**: Graceful degradation saat offline
✅ **Security**: Role-based access control di setiap proses

---

## SUMMARY

Total Diagrams:
- **DFD Level 0**: 1 Context Diagram
- **DFD Level 1**: 1 Diagram (8 processes)
- **DFD Level 2**: 8 Diagrams (detail per process) ✅ 100% COMPLETE

Total Entities: 5 (Mahasiswa, Dosen, Laboran, Admin, Supabase)

Total Processes: 36 (semua level)
- Level 0: 1 process (sistem)
- Level 1: 8 processes
- Level 2: 27 sub-processes

Total Data Stores: 15 (tables) + 3 (IndexedDB)

DFD ini mencakup:
✅ Authentication & Authorization (P1)
✅ Kelola Jadwal (P2)
✅ Kelola Kuis & Bank Soal (P3)
✅ Kelola Materi (P4)
✅ Kelola Kelas (P5)
✅ Kelola User (P6) ✨ NEW
✅ Notification System (P7)
✅ Offline Sync & Cache (P8)

**Status: 100% COMPLETE** - Semua 8 processes memiliki Level 2 diagrams!
