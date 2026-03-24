
erDiagram
    users {
        uuid id PK
        string name
        string email
        string password
        enum role
        timestamp created_at
    }
    admin {
        uuid id PK
        uuid user_id FK
        string nip
    }
    dosen {
        uuid id PK
        uuid user_id FK
        string nip
        string prodi
    }
    mahasiswa {
        uuid id PK
        uuid user_id FK
        string nim
        string prodi
        int angkatan
    }
    laboran {
        uuid id PK
        uuid user_id FK
        string nip
    }

    users ||--o| admin : berelasi_dengan
    users ||--o| dosen : berelasi_dengan
    users ||--o| mahasiswa : berelasi_dengan
    users ||--o| laboran : berelasi_dengan

