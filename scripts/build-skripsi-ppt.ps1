$ErrorActionPreference = 'Stop'

function Set-SlideText {
    param(
        [string]$SlidePath,
        [hashtable]$Map
    )

    [xml]$xml = Get-Content -LiteralPath $SlidePath
    $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main')

    foreach ($node in $xml.SelectNodes('//a:t', $ns)) {
        $value = [string]$node.InnerText
        if ($Map.ContainsKey($value)) {
            $node.InnerText = [string]$Map[$value]
        }
    }

    $xml.Save($SlidePath)
}

function Replace-MediaFile {
    param(
        [string]$TargetPath,
        [string]$SourcePath
    )

    Copy-Item -LiteralPath $SourcePath -Destination $TargetPath -Force
}

$root = Resolve-Path '.'
$template = Join-Path $root 'docs\ppt sempro Teknik Informatika.pptx'
$output = Join-Path $root 'docs\presentasi skripsi taufiq hasil dan pembahasan.pptx'
$work = Join-Path $root 'docs\_ppt_skripsi_build'
$docMedia = Join-Path $root 'docs\_finis_docx_extract\word\media'

if (Test-Path -LiteralPath $work) {
    Remove-Item -LiteralPath $work -Recurse -Force
}

Copy-Item -LiteralPath $template -Destination $output -Force

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($output, $work)

$slideDir = Join-Path $work 'ppt\slides'
$mediaDir = Join-Path $work 'ppt\media'

Set-SlideText -SlidePath (Join-Path $slideDir 'slide1.xml') -Map @{
    'JUDUL SKRIPSI' = 'ANALISIS DAN PERANCANGAN SISTEM INFORMASI PRAKTIKUM BERBASIS PWA'
    'UJIAN PROPOSAL' = 'UJIAN SKRIPSI'
    'Pembimbing I : Nama Pembimbing I' = 'Pembimbing I : Abdul Malik, S.Kom., M.Cs'
    'Pembimbing II : Nama Pembimbing II' = 'Pembimbing II : Fahmi Kurniawan, S.Kom., M.M'
    'Pillow Creative Student' = 'TAUFIQ'
    'NIM: 123456789' = 'NIM: IK.22.11.009'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide2.xml') -Map @{
    'BAB 1' = 'UJIAN SKRIPSI'
    'PENDAHULUAN' = 'RINGKASAN PENELITIAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide3.xml') -Map @{
    'AGENDA PRESENTASI' = 'ALUR PRESENTASI SKRIPSI'
    'Pendahuluan' = 'Masalah'
    'Latar' = 'Solusi'
    'Belakang' = 'PWA'
    'Rumusan' = 'Metode'
    'Masalah' = 'R&D'
    'Tujuan & Manfaat' = 'Perancangan'
    'Penelitian' = 'sistem'
    'Ruang' = 'Implementasi'
    'Lingkup' = 'fitur'
    'Keaslian' = 'Pengujian'
    'Tinjauan' = 'Hasil'
    'Pustaka &' = 'dan'
    'Landasan' = 'pembahasan'
    'Teori' = ''
    'Metodologi' = 'Kesimpulan'
    'Desain' = ''
    'Sistem &' = ''
    'Antarmuka' = ''
    'Jadwal' = ''
    'Kesimpulan Awal & Hasil yang' = ''
    'Diharapkan' = ''
    'Tanya Jawab' = 'Tanya jawab'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide4.xml') -Map @{
    'LATAR BELAKANG' = 'MASALAH UTAMA DI LAPANGAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide5.xml') -Map @{
    'LATAR BELAKANG' = 'AKAR MASALAH PRAKTIKUM'
    'RUMUSAN MASALAH' = 'DAMPAK PERMASALAHAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide6.xml') -Map @{
    'LATAR BELAKANG' = 'SOLUSI YANG DIUSULKAN'
    'SOLUSI PWA & URGENSI' = 'PWA SEBAGAI SOLUSI INFORMATIKA'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide7.xml') -Map @{
    'RUMUSAN MASALAH' = 'RUMUSAN MASALAH DAN TUJUAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide8.xml') -Map @{
    'RUMUSAN MASALAH' = 'PERTANYAAN PENELITIAN'
    'TUJUAN PENELITIAN' = 'TUJUAN PENELITIAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide9.xml') -Map @{
    'BATASAN PENELITIAN' = 'TARGET PENELITIAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide10.xml') -Map @{
    'BATASAN PENELITIAN' = 'RUANG LINGKUP'
    'MANFAAT PENELITIAN' = 'OUTPUT PENELITIAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide11.xml') -Map @{
    'MANFAAT PENELITIAN' = 'KONTRIBUSI PENELITIAN'
    'LANDASAN TEORI' = 'KEUNGGULAN PENELITIAN'
    'ADD YOUR TITLE' = 'PWA + R&D + RBAC + offline-first'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide12.xml') -Map @{
    'BAB II' = 'BAB III'
    'TINJAUAN PUSTAKA' = 'LANDASAN TEORI DAN METODE'
    'LANDASAN TEORI' = 'KONSEP UTAMA'
    'ADD YOUR TITLE' = 'PWA, R&D, UCD, dan RBAC'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide13.xml') -Map @{
    'Penelitian Terdahulu' = 'KEASLIAN DAN GAP PENELITIAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide14.xml') -Map @{
    'BAB 3' = 'BAB IV'
    'LANDASAN TEORI' = 'METODOLOGI PENELITIAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide15.xml') -Map @{
    'LANDASAN TEORI' = 'LANDASAN INFORMATIKA'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide16.xml') -Map @{
    'BAB 4' = 'BAB IV'
    'METODOLOGI PENELITIAN' = 'METODE PENGEMBANGAN'
    'HIPOTESIS PENELITIAN' = 'METODE DAN EVALUASI'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide17.xml') -Map @{
    'KERANGKA PENELITIAN' = 'ALUR RESEARCH AND DEVELOPMENT'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide18.xml') -Map @{
    'Diagram Alir Penelitian' = 'TAHAPAN PENELITIAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide19.xml') -Map @{
    'Metodologi' = 'Arsitektur'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide20.xml') -Map @{
    'POPULASI DAN SAMPEL' = 'ARSITEKTUR SISTEM PWA'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide21.xml') -Map @{
    'Rancangan Antarmuka Pengguna' = 'IMPLEMENTASI ANTARMUKA'
    'Landing Page' = 'Login, register, dan dashboard admin'
    'TEKNIK PENGUMPULAN DATA' = 'BUKTI IMPLEMENTASI'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide22.xml') -Map @{
    'Halaman Mahasiswa' = 'Dashboard mahasiswa dan offline sync'
    'KERANGKA PENELITIAN' = 'IMPLEMENTASI PENGGUNA'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide23.xml') -Map @{
    'HALAMAN DOSEN' = 'Dashboard dosen dan fitur tugas'
    'TEKNIK ANALISIS DATA' = 'IMPLEMENTASI DOSEN'
    'POPULASI DAN SAMPEL' = 'MODUL PEMBELAJARAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide24.xml') -Map @{
    'BAB 4' = 'BAB V'
    'HASIL PENELITIAN' = 'HASIL IMPLEMENTASI'
    'HALAMAN ADMIN' = 'Dashboard laboran dan inventaris'
    'TERIMA' = 'HASIL'
    'KASIH' = 'SISTEM'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide25.xml') -Map @{
    'JADWAL PENELITIAN' = 'HASIL PENGUJIAN SISTEM'
    'No' = 'Aspek'
    'Kegiatan' = 'Hasil'
    'Minggu' = 'Nilai'
    'Studi Literatur' = 'Black Box'
    'Identifikasi Masalah' = '45/45 pass'
    'Penetapan Tujuan' = 'White Box'
    'Perancangan dan Pengembangan' = '238 file test'
    'Pengujian dan Evaluasi' = '5.317 test case pass'
    'Komunikasi Hasil dan Penyusunan Laporan' = 'SUS 75,11 (Good)'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide26.xml') -Map @{
    'Kesimpulan Awal & Hasil yang' = 'PEMBAHASAN DAN'
    'Diharapkan' = 'KESIMPULAN'
}

Set-SlideText -SlidePath (Join-Path $slideDir 'slide27.xml') -Map @{
    'TERIMA' = 'TERIMA'
    'KASIH' = 'KASIH'
    'SARAN' = 'SARAN PENGEMBANGAN'
}

Replace-MediaFile -TargetPath (Join-Path $mediaDir 'image74.png') -SourcePath (Join-Path $docMedia 'image25.png')
Replace-MediaFile -TargetPath (Join-Path $mediaDir 'image75.png') -SourcePath (Join-Path $docMedia 'image28.png')
Replace-MediaFile -TargetPath (Join-Path $mediaDir 'image67.png') -SourcePath (Join-Path $docMedia 'image34.png')
Replace-MediaFile -TargetPath (Join-Path $mediaDir 'image76.png') -SourcePath (Join-Path $docMedia 'image32.png')
Replace-MediaFile -TargetPath (Join-Path $mediaDir 'image78.png') -SourcePath (Join-Path $docMedia 'image30.png')
Replace-MediaFile -TargetPath (Join-Path $mediaDir 'image79.png') -SourcePath (Join-Path $docMedia 'image31.png')
Replace-MediaFile -TargetPath (Join-Path $mediaDir 'image80.png') -SourcePath (Join-Path $docMedia 'image35.png')
Replace-MediaFile -TargetPath (Join-Path $mediaDir 'image81.png') -SourcePath (Join-Path $docMedia 'image36.png')

if (Test-Path -LiteralPath $output) {
    Remove-Item -LiteralPath $output -Force
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($work, $output)

Write-Output "Created: $output"
