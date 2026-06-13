$ErrorActionPreference = 'Stop'

function Escape-XmlText {
    param([string]$Text)
    return [System.Security.SecurityElement]::Escape($Text)
}

function P {
    param(
        [string]$Text,
        [int]$Size = 1800,
        [string]$Color = '1F2937',
        [string]$Align = 'l',
        [bool]$Bold = $false,
        [bool]$Bullet = $false
    )
    $safe = Escape-XmlText $Text
    $b = if ($Bold) { '1' } else { '0' }
    $bu = if ($Bullet) { '<a:buChar char="-"/>' } else { '<a:buNone/>' }
    $mar = if ($Bullet) { '285750' } else { '0' }
    $indent = if ($Bullet) { '-171450' } else { '0' }
@"
<a:p>
  <a:pPr algn="$Align" marL="$mar" indent="$indent">$bu</a:pPr>
  <a:r>
    <a:rPr lang="id-ID" sz="$Size" b="$b">
      <a:solidFill><a:srgbClr val="$Color"/></a:solidFill>
      <a:latin typeface="Aptos"/>
    </a:rPr>
    <a:t>$safe</a:t>
  </a:r>
  <a:endParaRPr lang="id-ID" sz="$Size">
    <a:solidFill><a:srgbClr val="$Color"/></a:solidFill>
    <a:latin typeface="Aptos"/>
  </a:endParaRPr>
</a:p>
"@
}

function TextBox {
    param(
        [int]$Id, [string]$Name,
        [int]$X, [int]$Y, [int]$Cx, [int]$Cy,
        [string[]]$Paragraphs
    )
    $body = $Paragraphs -join "`n"
@"
<p:sp>
  <p:nvSpPr><p:cNvPr id="$Id" name="$Name"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
  <p:spPr>
    <a:xfrm><a:off x="$X" y="$Y"/><a:ext cx="$Cx" cy="$Cy"/></a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    <a:noFill/><a:ln><a:noFill/></a:ln>
  </p:spPr>
  <p:txBody>
    <a:bodyPr wrap="square" rtlCol="0"><a:spAutoFit/></a:bodyPr><a:lstStyle/>
$body
  </p:txBody>
</p:sp>
"@
}

function Shape {
    param(
        [int]$Id, [string]$Name,
        [int]$X, [int]$Y, [int]$Cx, [int]$Cy,
        [string]$Fill = 'FFFFFF',
        [string]$Line = 'E5E7EB',
        [string]$Geom = 'roundRect',
        [int]$LineWidth = 12700
    )
@"
<p:sp>
  <p:nvSpPr><p:cNvPr id="$Id" name="$Name"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr>
    <a:xfrm><a:off x="$X" y="$Y"/><a:ext cx="$Cx" cy="$Cy"/></a:xfrm>
    <a:prstGeom prst="$Geom"><a:avLst/></a:prstGeom>
    <a:solidFill><a:srgbClr val="$Fill"/></a:solidFill>
    <a:ln w="$LineWidth"><a:solidFill><a:srgbClr val="$Line"/></a:solidFill></a:ln>
  </p:spPr>
  <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="id-ID"/></a:p></p:txBody>
</p:sp>
"@
}

function Pic {
    param(
        [int]$Id, [string]$Name,
        [int]$X, [int]$Y, [int]$Cx, [int]$Cy,
        [string]$RelId
    )
@"
<p:pic>
  <p:nvPicPr><p:cNvPr id="$Id" name="$Name"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
  <p:blipFill><a:blip r:embed="$RelId"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
  <p:spPr>
    <a:xfrm><a:off x="$X" y="$Y"/><a:ext cx="$Cx" cy="$Cy"/></a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
  </p:spPr>
</p:pic>
"@
}

function SlideXml {
    param([string]$Body)
@"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="F8FAFC"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
$Body
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>
"@
}

function SlideRels {
    param([string[]]$Images)
    $rels = @('<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout2.xml"/>')
    for ($i = 0; $i -lt $Images.Count; $i++) {
        $rid = $i + 2
        $rels += "<Relationship Id=`"rId$rid`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image`" Target=`"../media/$($Images[$i])`"/>"
    }
@"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  $($rels -join "`n  ")
</Relationships>
"@
}

function TitleBar {
    param([string]$Title, [int]$No)
    $parts = @()
    $parts += Shape -Id 2 -Name 'TopBand' -X 0 -Y 0 -Cx 12192000 -Cy 760000 -Fill '6B1022' -Line '6B1022' -Geom 'rect'
    $parts += TextBox -Id 3 -Name 'SlideTitle' -X 520000 -Y 135000 -Cx 10100000 -Cy 380000 -Paragraphs @((P $Title 2200 'FFFFFF' 'l' $true))
    $parts += TextBox -Id 4 -Name 'SlideNo' -X 11100000 -Y 150000 -Cx 600000 -Cy 300000 -Paragraphs @((P ("{0:00}" -f $No) 1500 'FDE68A' 'r' $true))
    $parts -join "`n"
}

function BulletCard {
    param([int]$Id, [string]$Title, [string[]]$Bullets, [int]$X, [int]$Y, [int]$Cx, [int]$Cy)
    $p = @((P $Title 1650 '6B1022' 'l' $true))
    foreach ($b in $Bullets) { $p += (P $b 1350 '374151' 'l' $false $true) }
    (Shape -Id $Id -Name "Card$Id" -X $X -Y $Y -Cx $Cx -Cy $Cy -Fill 'FFFFFF' -Line 'E5E7EB') +
    (TextBox -Id ($Id + 1) -Name "CardText$Id" -X ($X + 180000) -Y ($Y + 150000) -Cx ($Cx - 360000) -Cy ($Cy - 260000) -Paragraphs $p)
}

function Badge {
    param([int]$Id, [string]$Value, [string]$Label, [int]$X, [int]$Y, [int]$Cx, [string]$Fill = '6B1022')
    $p = @((P $Value 2700 'FFFFFF' 'ctr' $true), (P $Label 1200 'FDE68A' 'ctr' $true))
    (Shape -Id $Id -Name "Badge$Id" -X $X -Y $Y -Cx $Cx -Cy 1350000 -Fill $Fill -Line $Fill) +
    (TextBox -Id ($Id + 1) -Name "BadgeText$Id" -X ($X + 50000) -Y ($Y + 230000) -Cx ($Cx - 100000) -Cy 850000 -Paragraphs $p)
}

function PicturePlaceholder {
    param([int]$Id, [string]$Label, [int]$X, [int]$Y, [int]$Cx, [int]$Cy)
    $p = @((P $Label 1450 '64748B' 'ctr' $true), (P 'Ganti dengan screenshot aplikasi aktual' 1050 '94A3B8' 'ctr' $false))
    (Shape -Id $Id -Name "Placeholder$Id" -X $X -Y $Y -Cx $Cx -Cy $Cy -Fill 'F1F5F9' -Line 'CBD5E1') +
    (TextBox -Id ($Id + 1) -Name "PlaceholderText$Id" -X ($X + 140000) -Y ($Y + ($Cy / 2) - 300000) -Cx ($Cx - 280000) -Cy 600000 -Paragraphs $p)
}

$root = Resolve-Path '.'
$support = Join-Path $root 'docs\_template107_extract'
$output = Join-Path $root 'docs\slide-presentasi\Presentasi-Sidang-Skripsi-Taufiq-Final.pptx'
$work = Join-Path $root 'docs\slide-presentasi\_ppt_final_build'
$refPpt = 'C:\Users\ACER\Downloads\Akbid_Mega_Buana_Lab_PWA_(2).pptx'
$icon512 = Join-Path $root 'public\icons\icon-512x512.png'
$icon192 = Join-Path $root 'public\icons\icon-192x192.png'
$docMedia = Join-Path $root 'docs\_finis_docx_extract\word\media'

if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force }
New-Item -ItemType Directory -Path $work, "$work\_rels", "$work\docProps", "$work\ppt", "$work\ppt\_rels", "$work\ppt\slides", "$work\ppt\slides\_rels", "$work\ppt\media" | Out-Null

Copy-Item -LiteralPath (Join-Path $support 'ppt\slideMasters') -Destination (Join-Path $work 'ppt') -Recurse
Copy-Item -LiteralPath (Join-Path $support 'ppt\slideLayouts') -Destination (Join-Path $work 'ppt') -Recurse
Copy-Item -LiteralPath (Join-Path $support 'ppt\theme') -Destination (Join-Path $work 'ppt') -Recurse
Copy-Item -LiteralPath (Join-Path $support 'ppt\presProps.xml') -Destination (Join-Path $work 'ppt\presProps.xml')
Copy-Item -LiteralPath (Join-Path $support 'ppt\viewProps.xml') -Destination (Join-Path $work 'ppt\viewProps.xml')
Copy-Item -LiteralPath (Join-Path $support 'ppt\tableStyles.xml') -Destination (Join-Path $work 'ppt\tableStyles.xml')

$slides = @(
    @{ title='Halaman Judul'; bullets=@(); visual='title' },
    @{ title='Latar Belakang Masalah'; bullets=@('Pengelolaan praktikum masih memakai kertas, spreadsheet, dan komunikasi terpisah.','Dampaknya adalah miskomunikasi jadwal, pelaporan lambat, dan belum ada logbook digital terpusat.','Solusi diarahkan pada sistem PWA yang adaptif lintas perangkat dan tetap berguna saat jaringan tidak stabil.'); visual='beforeafter' },
    @{ title='Rumusan Masalah dan Tujuan'; bullets=@('Menganalisis kebutuhan sistem informasi praktikum di AKBID Mega Buana.','Merancang dan mengembangkan sistem berbasis PWA dengan metode R&D.','Mengevaluasi sistem dari aspek fungsionalitas, logika internal, dan usability.'); visual='threeflow' },
    @{ title='Batasan dan Manfaat Penelitian'; bullets=@('Fokus pada jadwal, materi, kuis, logbook, penilaian, inventaris, peminjaman, pengumuman, dan PWA/offline.','Pengguna sistem meliputi admin, dosen, mahasiswa, dan laboran.','Manfaat utama adalah efisiensi administrasi dan akses data praktikum yang lebih terpusat.'); visual='twocolumn' },
    @{ title='Kajian Pustaka I'; bullets=@('Nurwanto (2019): PWA pada e-commerce meningkatkan pengalaman pengguna.','Aripin & Somantri (2021): PWA membantu repository e-portofolio mahasiswa.','Sukma et al. (2022): PWA meningkatkan akses pada wilayah koneksi terbatas.'); visual='table' },
    @{ title='Kajian Pustaka II'; bullets=@('Santoso et al. (2022): PWA menyederhanakan monitoring skripsi.','Muddin et al. (2023): PWA meningkatkan akses informasi akademik sekolah.','Muzakki et al. (2025): PWA meningkatkan efisiensi repositori tugas akhir.'); visual='table' },
    @{ title='Keaslian Penelitian'; bullets=@('Konteks penelitian ini spesifik pada praktikum vokasi kebidanan.','Kebaruan ada pada integrasi multi-role, modul akademik-laboratorium, dan offline PWA.','Sistem tidak hanya web biasa, tetapi platform praktikum terintegrasi dengan sinkronisasi.'); visual='matrix' },
    @{ title='Landasan Teori PWA'; bullets=@('PWA dapat dipasang pada perangkat pengguna melalui web app manifest.','Service worker mendukung caching, akses offline, dan sinkronisasi.','IndexedDB dan offline queue menjaga aktivitas tertentu saat koneksi terputus.'); visual='architecture' },
    @{ title='RBAC dan Metode R&D'; bullets=@('RBAC membedakan hak akses Admin, Dosen, Mahasiswa, dan Laboran.','Metode R&D digunakan untuk menghasilkan dan menguji artefak sistem.','Tahapan penelitian mengacu pada Ellis dan Levy.'); visual='rbacrd' },
    @{ title='Alur Penelitian'; bullets=@('Identifikasi masalah.','Penetapan tujuan.','Perancangan dan pengembangan solusi.','Pengujian, evaluasi hasil, dan komunikasi hasil.'); visual='researchflow' },
    @{ title='Objek, Lokasi, dan Sampel'; bullets=@('Lokasi penelitian: Akademi Kebidanan Mega Buana.','Teknik sampel menggunakan total sampling.','Evaluasi usability melibatkan 46 responden.'); visual='respondents' },
    @{ title='Perancangan Proses: DFD Level 1'; bullets=@('Sistem dibagi menjadi empat proses utama.','Proses mencakup akun, akademik praktikum, operasional laboratorium, dan layanan PWA.','DFD menjelaskan aliran data antaraktor, proses, dan data store.'); visual='dfd' },
    @{ title='Perancangan Data: ERD'; bullets=@('ERD mengintegrasikan data pengguna, akademik, praktikum, inventaris, dan sinkronisasi.','Struktur data disajikan per domain agar lebih mudah dibaca.','Relasi data mendukung modul jadwal, materi, kuis, logbook, nilai, peminjaman, dan inventaris.'); visual='erd' },
    @{ title='Implementasi Antarmuka Dashboard'; bullets=@('Sistem memiliki dashboard sesuai peran pengguna.','Admin mengelola konfigurasi dan data utama.','Dosen, mahasiswa, dan laboran memakai modul sesuai kebutuhan praktikum.'); visual='screens' },
    @{ title='Fitur PWA dan Offline Access'; bullets=@('Aplikasi mendukung install prompt melalui manifest.','Status online/offline memberi umpan balik pada pengguna.','Operasi tertentu disimpan sementara lalu disinkronkan saat koneksi tersedia.'); visual='offline' },
    @{ title='Hasil Pengujian Black Box'; bullets=@('Pengujian dilakukan pada autentikasi, fitur peran, modul akademik, laboratorium, dan PWA.','Total 45 skenario diuji.','Semua skenario lulus dengan tingkat keberhasilan 100%.'); visual='blackbox' },
    @{ title='Hasil Pengujian White Box'; bullets=@('Pengujian dilakukan melalui unit test dan integration test.','Cakupan meliputi API, hooks, sinkronisasi, validasi, dan logika modul.','Hasil resmi: 241 file test dan 5.231 test case lulus.'); visual='whitebox' },
    @{ title='Evaluasi Usability SUS'; bullets=@('Evaluasi menggunakan System Usability Scale.','Melibatkan 46 responden dari beberapa peran pengguna.','Skor rata-rata 75,11 dengan interpretasi Grade B, Good, dan Acceptable.'); visual='sus' },
    @{ title='Kesimpulan Penelitian'; bullets=@('Sistem informasi praktikum berbasis PWA berhasil dikembangkan sebagai platform terintegrasi.','Sistem mendukung kebutuhan akademik dan operasional laboratorium lintas peran.','Hasil pengujian menunjukkan sistem layak secara fungsional, teknis, dan usability.'); visual='conclusion' },
    @{ title='Saran dan Penutup'; bullets=@('Optimasi background sync pada lebih banyak browser dan perangkat.','Tambahkan analitik dan pelaporan praktikum.','Integrasikan sistem dengan SIAKAD atau sistem akademik institusi.'); visual='roadmap' }
)

function Build-Visual {
    param([hashtable]$Slide, [int]$No)
    $body = @()
    $images = @()
    $body += TitleBar $Slide.title $No

    if ($No -eq 1) {
        $body += Shape -Id 10 -Name 'Hero' -X 700000 -Y 1250000 -Cx 10800000 -Cy 4300000 -Fill 'FFFFFF' -Line 'E5E7EB'
        $body += TextBox -Id 11 -Name 'HeroTitle' -X 1100000 -Y 1650000 -Cx 7600000 -Cy 1300000 -Paragraphs @(
            (P 'Analisis dan Perancangan Sistem Informasi Praktikum Berbasis PWA Menggunakan Metode R&D' 2400 '6B1022' 'l' $true),
            (P 'di Akademi Kebidanan Mega Buana' 1700 '374151' 'l' $true)
        )
        $body += TextBox -Id 12 -Name 'Identity' -X 1100000 -Y 3400000 -Cx 5700000 -Cy 1200000 -Paragraphs @(
            (P 'Taufiq - IK.22.11.009' 1700 '111827' 'l' $true),
            (P 'Program Studi Sarjana Informatika' 1350 '475569' 'l'),
            (P 'Fakultas Ilmu Komputer - Universitas Mega Buana Palopo' 1350 '475569' 'l')
        )
        if (Test-Path -LiteralPath $icon512) {
            Copy-Item -LiteralPath $icon512 -Destination (Join-Path $work 'ppt\media\pwa-icon.png') -Force
            $images += 'pwa-icon.png'
            $body += Pic -Id 13 -Name 'PWAIcon' -X 8550000 -Y 2350000 -Cx 1800000 -Cy 1800000 -RelId 'rId2'
        }
        return @{ Body=($body -join "`n"); Images=$images }
    }

    $bulletPars = @()
    foreach ($b in $Slide.bullets) { $bulletPars += P $b 1300 '334155' 'l' $false $true }
    $body += TextBox -Id 20 -Name 'Bullets' -X 600000 -Y 1050000 -Cx 4400000 -Cy 4700000 -Paragraphs $bulletPars

    switch ($Slide.visual) {
        'beforeafter' {
            $body += BulletCard 30 'Manual' @('Kertas','Spreadsheet','Chat terpisah') 5600000 1350000 2450000 2700000
            $body += BulletCard 40 'Sistem PWA' @('Jadwal','Materi/Kuis','Logbook/Nilai','Sinkronisasi') 8500000 1350000 2700000 2700000
        }
        'threeflow' {
            $x = 5400000
            foreach ($label in @('Analisis Kebutuhan','Perancangan Sistem','Evaluasi Sistem')) {
                $body += Shape -Id ($x / 100000) -Name $label -X $x -Y 2300000 -Cx 1850000 -Cy 1000000 -Fill 'FFFFFF' -Line 'D9A441'
                $body += TextBox -Id (($x / 100000) + 1) -Name "$label Text" -X ($x+100000) -Y 2550000 -Cx 1650000 -Cy 400000 -Paragraphs @((P $label 1250 '6B1022' 'ctr' $true))
                $x += 2100000
            }
        }
        'twocolumn' {
            $body += BulletCard 50 'Batasan' @('AKBID Mega Buana','4 role pengguna','Modul praktikum dan PWA') 5400000 1250000 2800000 3200000
            $body += BulletCard 60 'Manfaat' @('Efisiensi administrasi','Akses data mahasiswa','Data terpusat') 8500000 1250000 2800000 3200000
        }
        'table' {
            $body += BulletCard 70 'Ringkasan Literatur' $Slide.bullets 5400000 1200000 5900000 3900000
        }
        'matrix' {
            $body += BulletCard 80 'Gap Penelitian' @('Web biasa -> PWA offline','Umum -> praktikum kebidanan','Parsial -> akademik + laboratorium') 5600000 1300000 5400000 3400000
        }
        'architecture' {
            $body += BulletCard 90 'Arsitektur Ringkas' @('Browser/App','Service Worker','Cache + IndexedDB','Supabase') 5600000 1300000 5400000 3400000
        }
        'rbacrd' {
            $body += BulletCard 100 'Role' @('Admin','Dosen','Mahasiswa','Laboran') 5400000 1300000 2500000 3300000
            $body += BulletCard 110 'R&D' @('Problem','Objective','Design','Test','Evaluate','Communicate') 8300000 1300000 3000000 3300000
        }
        'researchflow' {
            $body += BulletCard 120 '6 Tahap Ellis dan Levy' @('Identifikasi masalah','Penetapan tujuan','Perancangan solusi','Pengujian','Evaluasi hasil','Komunikasi hasil') 5600000 1200000 5400000 3900000
        }
        'respondents' {
            $body += Badge 130 '46' 'Responden SUS' 5850000 1450000 2200000 '6B1022'
            $body += BulletCard 140 'Distribusi Peran' @('Mahasiswa 38','Dosen 6','Laboran 1','Admin 1') 8400000 1300000 2700000 3300000
        }
        'dfd' {
            $body += BulletCard 150 'DFD Level 1' @('1.0 Manajemen Akun','2.0 Akademik Praktikum','3.0 Operasional Lab','4.0 Layanan PWA Sync') 5600000 1200000 5400000 3900000
        }
        'erd' {
            $body += BulletCard 160 'Domain ERD' @('Pengguna dan Peran','Akademik dan Kelas','Praktikum dan Pembelajaran','Laboratorium dan Inventaris','PWA Sync') 5600000 1200000 5400000 3900000
        }
        'screens' {
            $screenFiles = @(
                @{ Source=(Join-Path $docMedia 'image25.png'); Target='screen-login.png'; Label='Login' },
                @{ Source=(Join-Path $docMedia 'image28.png'); Target='screen-admin.png'; Label='Dashboard Admin' },
                @{ Source=(Join-Path $docMedia 'image30.png'); Target='screen-dosen.png'; Label='Dashboard Dosen' }
            )
            $x = 5350000; $rid = 2; $id = 170
            foreach ($s in $screenFiles) {
                if (Test-Path -LiteralPath $s.Source) {
                    Copy-Item -LiteralPath $s.Source -Destination (Join-Path $work "ppt\media\$($s.Target)") -Force
                    $images += $s.Target
                    $body += Pic -Id $id -Name $s.Label -X $x -Y 1450000 -Cx 1850000 -Cy 2100000 -RelId "rId$rid"
                    $body += TextBox -Id ($id+1) -Name "$($s.Label) Label" -X $x -Y 3650000 -Cx 1850000 -Cy 300000 -Paragraphs @((P $s.Label 1050 '6B1022' 'ctr' $true))
                    $rid++; $id += 3; $x += 2000000
                }
            }
            if ($images.Count -eq 0) { $body += PicturePlaceholder 170 'Login | Admin | Dosen' 5400000 1400000 5900000 3000000 }
        }
        'offline' {
            if (Test-Path -LiteralPath $icon192) {
                Copy-Item -LiteralPath $icon192 -Destination (Join-Path $work 'ppt\media\pwa-small.png') -Force
                $images += 'pwa-small.png'
                $body += Pic -Id 200 -Name 'PWAIconSmall' -X 5850000 -Y 1550000 -Cx 900000 -Cy 900000 -RelId 'rId2'
            }
            $body += BulletCard 210 'Offline Flow' @('User action','IndexedDB / offline queue','Sync saat online','Supabase') 7000000 1250000 4100000 3400000
        }
        'blackbox' {
            $body += Badge 220 '45' 'Skenario' 5600000 1450000 2200000 '6B1022'
            $body += Badge 230 '100%' 'Pass' 8300000 1450000 2200000 '166534'
            $body += BulletCard 240 'Kategori' @('Autentikasi dan role','Akademik','Laboratorium','PWA/offline') 6000000 3200000 4500000 1900000
        }
        'whitebox' {
            $body += Badge 250 '241' 'File Test' 5350000 1500000 1800000 '6B1022'
            $body += Badge 260 '5.231' 'Test Case' 7350000 1500000 2100000 '7C2D12'
            $body += Badge 270 '100%' 'Passed' 9700000 1500000 1600000 '166534'
        }
        'sus' {
            $body += Badge 280 '75,11' 'Skor SUS' 5600000 1450000 2300000 '6B1022'
            $body += BulletCard 290 'Interpretasi' @('Grade B','Good','Acceptable','46 responden') 8400000 1300000 2700000 3300000
        }
        'conclusion' {
            $body += BulletCard 300 '3 Poin Utama' @('Sistem terintegrasi','Akses PWA/offline','Layak digunakan') 5600000 1300000 5400000 3400000
        }
        'roadmap' {
            $body += BulletCard 310 'Roadmap' @('1. Optimasi background sync','2. Analitik pelaporan','3. Integrasi SIAKAD') 5600000 1300000 5400000 3400000
        }
        default {
            $body += PicturePlaceholder 320 'Visual Utama' 5600000 1400000 5400000 3000000
        }
    }
    @{ Body=($body -join "`n"); Images=$images }
}

Set-Content -LiteralPath (Join-Path $work '_rels\.rels') -Encoding UTF8 -Value @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>
"@

$now = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
Set-Content -LiteralPath (Join-Path $work 'docProps\core.xml') -Encoding UTF8 -Value @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Presentasi Sidang Skripsi Taufiq Final</dc:title>
  <dc:creator>OpenAI Codex</dc:creator>
  <cp:lastModifiedBy>OpenAI Codex</cp:lastModifiedBy>
  <cp:revision>1</cp:revision>
  <dcterms:created xsi:type="dcterms:W3CDTF">$now</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">$now</dcterms:modified>
</cp:coreProperties>
"@

Set-Content -LiteralPath (Join-Path $work 'docProps\app.xml') -Encoding UTF8 -Value @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office PowerPoint</Application>
  <PresentationFormat>On-screen Show (16:9)</PresentationFormat>
  <Slides>$($slides.Count)</Slides>
  <Notes>0</Notes>
  <HiddenSlides>0</HiddenSlides>
  <MMClips>0</MMClips>
  <ScaleCrop>false</ScaleCrop>
  <Company></Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>
"@

$slideRefs = @()
$presRels = @('<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>')
$slideOverrides = @()
for ($i = 0; $i -lt $slides.Count; $i++) {
    $no = $i + 1
    $sid = 256 + $no
    $ridNo = $no + 1
    $built = Build-Visual -Slide $slides[$i] -No $no
    Set-Content -LiteralPath (Join-Path $work "ppt\slides\slide$no.xml") -Encoding UTF8 -Value (SlideXml $built.Body)
    Set-Content -LiteralPath (Join-Path $work "ppt\slides\_rels\slide$no.xml.rels") -Encoding UTF8 -Value (SlideRels $built.Images)
    $slideRefs += "<p:sldId id=`"$sid`" r:id=`"rId$ridNo`"/>"
    $presRels += "<Relationship Id=`"rId$ridNo`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide`" Target=`"slides/slide$no.xml`"/>"
    $slideOverrides += "<Override PartName=`"/ppt/slides/slide$no.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.presentationml.slide+xml`"/>"
}

$presRels += '<Relationship Id="rId100" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>'
$presRels += '<Relationship Id="rId101" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>'
$presRels += '<Relationship Id="rId102" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>'

Set-Content -LiteralPath (Join-Path $work 'ppt\presentation.xml') -Encoding UTF8 -Value @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1" autoCompressPictures="0">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
    $($slideRefs -join "`n    ")
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle/>
</p:presentation>
"@

Set-Content -LiteralPath (Join-Path $work 'ppt\_rels\presentation.xml.rels') -Encoding UTF8 -Value @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  $($presRels -join "`n  ")
</Relationships>
"@

$layoutOverrides = Get-ChildItem -LiteralPath (Join-Path $work 'ppt\slideLayouts') -Filter 'slideLayout*.xml' | Sort-Object Name | ForEach-Object { "<Override PartName=`"/ppt/slideLayouts/$($_.Name)`" ContentType=`"application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml`"/>" }
$masterOverrides = Get-ChildItem -LiteralPath (Join-Path $work 'ppt\slideMasters') -Filter 'slideMaster*.xml' | Sort-Object Name | ForEach-Object { "<Override PartName=`"/ppt/slideMasters/$($_.Name)`" ContentType=`"application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml`"/>" }
$themeOverrides = Get-ChildItem -LiteralPath (Join-Path $work 'ppt\theme') -Filter 'theme*.xml' | Sort-Object Name | ForEach-Object { "<Override PartName=`"/ppt/theme/$($_.Name)`" ContentType=`"application/vnd.openxmlformats-officedocument.theme+xml`"/>" }

Set-Content -LiteralPath (Join-Path $work '[Content_Types].xml') -Encoding UTF8 -Value @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
  <Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
  <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  $($masterOverrides -join "`n  ")
  $($layoutOverrides -join "`n  ")
  $($themeOverrides -join "`n  ")
  $($slideOverrides -join "`n  ")
</Types>
"@

if (Test-Path -LiteralPath $output) { Remove-Item -LiteralPath $output -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($work, $output)

Write-Output "Reference visual PPT: $refPpt"
Write-Output "Created: $output"
