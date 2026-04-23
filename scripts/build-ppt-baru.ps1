$ErrorActionPreference = 'Stop'

function Escape-XmlText {
    param([string]$Text)
    return [System.Security.SecurityElement]::Escape($Text)
}

function New-ParagraphXml {
    param(
        [string]$Text,
        [int]$FontSize = 2400,
        [string]$Color = '1F2937',
        [string]$Align = 'l',
        [bool]$Bullet = $false,
        [bool]$Bold = $false
    )

    $safeText = Escape-XmlText $Text
    $bulletXml = if ($Bullet) {
        '<a:buChar char="•"/>'
    } else {
        '<a:buNone/>'
    }
    $boldValue = if ($Bold) { '1' } else { '0' }

    return @"
<a:p>
  <a:pPr algn="$Align" marL="342900" indent="-171450">$bulletXml</a:pPr>
  <a:r>
    <a:rPr lang="id-ID" sz="$FontSize" b="$boldValue">
      <a:solidFill><a:srgbClr val="$Color"/></a:solidFill>
      <a:latin typeface="Aptos"/>
    </a:rPr>
    <a:t>$safeText</a:t>
  </a:r>
  <a:endParaRPr lang="id-ID" sz="$FontSize">
    <a:solidFill><a:srgbClr val="$Color"/></a:solidFill>
    <a:latin typeface="Aptos"/>
  </a:endParaRPr>
</a:p>
"@
}

function New-TextBoxXml {
    param(
        [int]$Id,
        [string]$Name,
        [int]$X,
        [int]$Y,
        [int]$Cx,
        [int]$Cy,
        [string[]]$ParagraphsXml
    )

    $paragraphBlock = ($ParagraphsXml -join "`n")

    return @"
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="$Id" name="$Name"/>
    <p:cNvSpPr txBox="1"/>
    <p:nvPr/>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm>
      <a:off x="$X" y="$Y"/>
      <a:ext cx="$Cx" cy="$Cy"/>
    </a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    <a:noFill/>
    <a:ln><a:noFill/></a:ln>
  </p:spPr>
  <p:txBody>
    <a:bodyPr wrap="square" rtlCol="0"><a:spAutoFit/></a:bodyPr>
    <a:lstStyle/>
$paragraphBlock
  </p:txBody>
</p:sp>
"@
}

function New-RectXml {
    param(
        [int]$Id,
        [string]$Name,
        [int]$X,
        [int]$Y,
        [int]$Cx,
        [int]$Cy,
        [string]$FillColor
    )

    return @"
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="$Id" name="$Name"/>
    <p:cNvSpPr/>
    <p:nvPr/>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm>
      <a:off x="$X" y="$Y"/>
      <a:ext cx="$Cx" cy="$Cy"/>
    </a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    <a:solidFill><a:srgbClr val="$FillColor"/></a:solidFill>
    <a:ln><a:noFill/></a:ln>
  </p:spPr>
  <p:txBody>
    <a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="id-ID"/></a:p>
  </p:txBody>
</p:sp>
"@
}

function New-PictureXml {
    param(
        [int]$Id,
        [string]$Name,
        [int]$X,
        [int]$Y,
        [int]$Cx,
        [int]$Cy,
        [string]$RelId
    )

    return @"
<p:pic>
  <p:nvPicPr>
    <p:cNvPr id="$Id" name="$Name"/>
    <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
    <p:nvPr/>
  </p:nvPicPr>
  <p:blipFill>
    <a:blip r:embed="$RelId"/>
    <a:stretch><a:fillRect/></a:stretch>
  </p:blipFill>
  <p:spPr>
    <a:xfrm>
      <a:off x="$X" y="$Y"/>
      <a:ext cx="$Cx" cy="$Cy"/>
    </a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
  </p:spPr>
</p:pic>
"@
}

function New-SlideXml {
    param(
        [string]$BodyXml
    )

    return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="FAF7F2"/></a:solidFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
$BodyXml
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>
"@
}

function New-SlideRelsXml {
    param(
        [string]$LayoutTarget,
        [string]$ImageTarget = ''
    )

    $imageRel = if ($ImageTarget) {
        "<Relationship Id=`"rId2`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image`" Target=`"../media/$ImageTarget`"/>"
    } else {
        ''
    }

    return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/$LayoutTarget"/>
  $imageRel
</Relationships>
"@
}

$slides = @(
    @{
        kind = 'title'
        title = 'Analisis dan Perancangan Sistem Informasi Praktikum Berbasis Progressive Web Application (PWA)'
        subtitle = @(
            'Taufiq',
            'IK.22.11.009',
            'Program Studi Sarjana Informatika',
            'Fakultas Ilmu Komputer',
            'Universitas Mega Buana Palopo',
            'Fokus presentasi: hasil dan pembahasan'
        )
    },
    @{
        kind = 'bullets'
        title = 'Alur Presentasi'
        bullets = @(
            'Masalah utama dan urgensi digitalisasi praktikum.',
            'Tujuan penelitian, metode R&D, dan arsitektur sistem.',
            'Implementasi fitur inti berbasis peran dan PWA.',
            'Hasil pengujian black box, white box, dan usability.',
            'Pembahasan hasil dari perspektif informatika.',
            'Kesimpulan dan arah pengembangan berikutnya.'
        )
    },
    @{
        kind = 'bullets'
        title = 'Masalah dan Urgensi'
        bullets = @(
            'Pengelolaan praktikum di Akademi Kebidanan Mega Buana masih dominan manual melalui kertas, spreadsheet, dan komunikasi yang tidak terintegrasi.',
            'Ditemukan miskomunikasi jadwal, keterlambatan pelaporan, serta belum ada media terpusat untuk logbook dan penilaian digital.',
            'Kondisi tersebut menurunkan efisiensi dosen, menghambat keterlibatan mahasiswa, dan mempengaruhi akurasi data praktikum.',
            'Solusi yang dibutuhkan adalah sistem terintegrasi yang tetap adaptif pada berbagai perangkat dan kondisi jaringan.'
        )
    },
    @{
        kind = 'bullets'
        title = 'Tujuan dan Kontribusi'
        bullets = @(
            'Menganalisis kebutuhan pengguna sebagai dasar perancangan sistem informasi praktikum.',
            'Merancang dan mengembangkan sistem praktikum berbasis PWA dengan metode Research and Development (R&D).',
            'Mengevaluasi kualitas solusi dari sisi fungsionalitas, kualitas teknis implementasi, dan usability.',
            'Kontribusi utama penelitian adalah integrasi PWA, R&D, RBAC, dan pendekatan offline-first pada konteks praktikum vokasi.'
        )
    },
    @{
        kind = 'bullets'
        title = 'Metode Pengembangan'
        bullets = @(
            'Metode utama menggunakan Research and Development model Ellis dan Levy.',
            'Tahapan penelitian meliputi identifikasi masalah, penetapan tujuan, perancangan artefak, implementasi, pengujian, evaluasi hasil, dan komunikasi hasil.',
            'Pengembangan sistem dilakukan secara iteratif agar umpan balik pengguna dapat dimasukkan selama proses pembangunan.',
            'Role-Based Access Control diterapkan untuk memisahkan hak akses admin, dosen, mahasiswa, dan laboran.'
        )
    },
    @{
        kind = 'bullets'
        title = 'Arsitektur Sistem'
        bullets = @(
            'Frontend dibangun menggunakan React, Vite, TypeScript, dan Tailwind CSS.',
            'Backend menggunakan Supabase untuk autentikasi, database PostgreSQL, storage, dan realtime.',
            'Karakteristik PWA diterapkan melalui service worker, web app manifest, cache lokal, dan sinkronisasi ulang.',
            'Arsitektur ini dipilih agar sistem dapat berjalan lintas perangkat dan tetap fungsional saat koneksi internet tidak stabil.'
        )
    },
    @{
        kind = 'image'
        title = 'Implementasi Admin'
        bullets = @(
            'Admin menangani manajemen pengguna dan pengaturan data inti sistem.',
            'Dashboard menampilkan kontrol operasional secara terpusat.',
            'Fitur ini mendukung integrasi proses administrasi praktikum.'
        )
        imageSource = 'image28.png'
        imageName = 'admin-dashboard.png'
    },
    @{
        kind = 'image'
        title = 'Implementasi Mahasiswa dan PWA'
        bullets = @(
            'Mahasiswa mengakses jadwal, materi, tugas, logbook, dan nilai melalui satu aplikasi.',
            'Fitur offline sync menunjukkan nilai tambah utama dari sisi PWA.',
            'Pendekatan ini menjawab kebutuhan penggunaan pada jaringan yang tidak selalu stabil.'
        )
        imageSource = 'image34.png'
        imageName = 'offline-sync.png'
    },
    @{
        kind = 'image'
        title = 'Implementasi Dosen dan Laboran'
        bullets = @(
            'Dosen mengelola materi, tugas, evaluasi, dan aktivitas pembelajaran praktikum.',
            'Laboran menangani inventaris dan peminjaman alat laboratorium.',
            'Implementasi multi-peran membentuk satu ekosistem layanan praktikum yang saling terhubung.'
        )
        imageSource = 'image35.png'
        imageName = 'laboran-dashboard.png'
    },
    @{
        kind = 'bullets'
        title = 'Hasil Pengujian Black Box'
        bullets = @(
            'Sebanyak 45 skenario uji black box dijalankan pada modul autentikasi, admin, dosen, mahasiswa, laboran, dan fitur PWA.',
            'Seluruh skenario memperoleh status pass dengan tingkat keberhasilan 100%.',
            'Temuan ini menunjukkan perilaku fungsional sistem telah sesuai dengan kebutuhan yang dirancang.',
            'Dari perspektif pengguna, alur utama sistem telah berjalan tanpa penyimpangan pada skenario yang diuji.'
        )
    },
    @{
        kind = 'bullets'
        title = 'Hasil Pengujian White Box'
        bullets = @(
            'Pengujian white box dieksekusi melalui 238 file test dan 5.317 test case.',
            'Seluruh test case berstatus pass pada evaluasi akhir.',
            'Cakupan pengujian meliputi API layer, hooks, validasi, komponen UI, provider, modul offline, dan integration test.',
            'Hasil ini penting karena mendukung klaim bahwa logika internal sistem, termasuk area offline dan sinkronisasi, berada pada kondisi stabil.'
        )
    },
    @{
        kind = 'bullets'
        title = 'Hasil Usability (SUS)'
        bullets = @(
            'Evaluasi usability melibatkan 46 responden dari peran mahasiswa, dosen, laboran, dan admin.',
            'Skor rata-rata System Usability Scale adalah 75,11.',
            'Interpretasi SUS menempatkan sistem pada kategori B dengan adjective rating Good dan acceptability Acceptable.',
            'Mayoritas pengguna menilai sistem mudah digunakan, meskipun masih ada ruang penyederhanaan pada beberapa alur.'
        )
    },
    @{
        kind = 'bullets'
        title = 'Pembahasan Hasil'
        bullets = @(
            'Dari sisi perancangan, kebutuhan lapangan berhasil diterjemahkan ke model proses, model data, dan arsitektur teknis yang sistematis.',
            'Dari sisi implementasi, sistem berkembang dari sekadar rancangan menjadi aplikasi operasional lintas peran.',
            'Dari sisi pengujian, kualitas solusi didukung oleh tiga bukti: fungsionalitas berjalan, logika internal stabil, dan usability baik.',
            'Secara informatika, nilai penting penelitian ini ada pada integrasi arsitektur PWA, RBAC, dan strategi offline-first dalam domain praktikum.'
        )
    },
    @{
        kind = 'bullets'
        title = 'Kesimpulan dan Saran'
        bullets = @(
            'Penelitian menghasilkan sistem informasi praktikum berbasis PWA yang terintegrasi untuk mendukung kebutuhan akademik dan operasional laboratorium.',
            'Keunggulan solusi terletak pada dukungan lintas perangkat, akses adaptif, dan pendekatan sinkronisasi saat jaringan berubah.',
            'Hasil black box, white box, dan SUS menunjukkan sistem layak secara fungsi, kuat secara teknis, dan diterima dengan baik oleh pengguna.',
            'Pengembangan berikutnya dapat difokuskan pada optimasi background sync lintas browser, perluasan pengujian otomatis, dan penyederhanaan alur pengguna.'
        )
    }
)

$root = Resolve-Path '.'
$support = Join-Path $root 'docs\_template107_extract'
$docMedia = Join-Path $root 'docs\_finis_docx_extract\word\media'
$work = Join-Path $root 'docs\_ppt_baru_build'
$output = Join-Path $root 'docs\presentasi skripsi taufiq baru.pptx'

if (Test-Path -LiteralPath $work) {
    Remove-Item -LiteralPath $work -Recurse -Force
}

New-Item -ItemType Directory -Path $work | Out-Null
New-Item -ItemType Directory -Path (Join-Path $work '_rels') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $work 'docProps') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $work 'ppt') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $work 'ppt\_rels') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $work 'ppt\slides') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $work 'ppt\slides\_rels') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $work 'ppt\media') | Out-Null

Copy-Item -LiteralPath (Join-Path $support 'ppt\slideMasters') -Destination (Join-Path $work 'ppt') -Recurse
Copy-Item -LiteralPath (Join-Path $support 'ppt\slideLayouts') -Destination (Join-Path $work 'ppt') -Recurse
Copy-Item -LiteralPath (Join-Path $support 'ppt\theme') -Destination (Join-Path $work 'ppt') -Recurse
Copy-Item -LiteralPath (Join-Path $support 'ppt\presProps.xml') -Destination (Join-Path $work 'ppt\presProps.xml')
Copy-Item -LiteralPath (Join-Path $support 'ppt\viewProps.xml') -Destination (Join-Path $work 'ppt\viewProps.xml')
Copy-Item -LiteralPath (Join-Path $support 'ppt\tableStyles.xml') -Destination (Join-Path $work 'ppt\tableStyles.xml')

$utcNow = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$slideCount = $slides.Count
$slideTitles = $slides | ForEach-Object { $_.title }

$rootRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>
"@
Set-Content -LiteralPath (Join-Path $work '_rels\.rels') -Value $rootRels -Encoding UTF8

$titlesXml = ($slideTitles | ForEach-Object { "<vt:lpstr>$(Escape-XmlText $_)</vt:lpstr>" }) -join ''
$appXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office PowerPoint</Application>
  <PresentationFormat>Custom</PresentationFormat>
  <Slides>$slideCount</Slides>
  <Notes>0</Notes>
  <HiddenSlides>0</HiddenSlides>
  <MMClips>0</MMClips>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Slide Titles</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>$slideCount</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="$slideCount" baseType="lpstr">$titlesXml</vt:vector>
  </TitlesOfParts>
  <Company></Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>
"@
Set-Content -LiteralPath (Join-Path $work 'docProps\app.xml') -Value $appXml -Encoding UTF8

$coreXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Presentasi Skripsi Taufiq</dc:title>
  <dc:creator>OpenAI Codex</dc:creator>
  <cp:lastModifiedBy>OpenAI Codex</cp:lastModifiedBy>
  <cp:revision>1</cp:revision>
  <dcterms:created xsi:type="dcterms:W3CDTF">$utcNow</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">$utcNow</dcterms:modified>
</cp:coreProperties>
"@
Set-Content -LiteralPath (Join-Path $work 'docProps\core.xml') -Value $coreXml -Encoding UTF8

$presentationSlideRefs = New-Object System.Collections.Generic.List[string]
$presentationRels = New-Object System.Collections.Generic.List[string]
$presentationRels.Add('<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>')

$contentTypeSlides = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $slides.Count; $i++) {
    $slideNo = $i + 1
    $relId = "rId$($slideNo + 1)"
    $presentationSlideRefs.Add("<p:sldId id=`"$($256 + $slideNo)`" r:id=`"$relId`"/>")
    $presentationRels.Add("<Relationship Id=`"$relId`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide`" Target=`"slides/slide$slideNo.xml`"/>")
    $contentTypeSlides.Add("<Override PartName=`"/ppt/slides/slide$slideNo.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.presentationml.slide+xml`"/>")

    $slide = $slides[$i]
    $parts = New-Object System.Collections.Generic.List[string]

    if ($slide.kind -eq 'title') {
        $parts.Add((New-RectXml -Id 2 -Name 'Header' -X 0 -Y 0 -Cx 12192000 -Cy 900000 -FillColor '6F0F1A'))
        $titlePars = @(
            (New-ParagraphXml -Text $slide.title -FontSize 2600 -Color '6F0F1A' -Align 'ctr' -Bold $true)
        )
        $subtitlePars = @()
        foreach ($line in $slide.subtitle) {
            $subtitlePars += (New-ParagraphXml -Text $line -FontSize 1800 -Color '374151' -Align 'ctr' -Bold $true)
        }
        $parts.Add((New-TextBoxXml -Id 3 -Name 'Title' -X 900000 -Y 1400000 -Cx 10392000 -Cy 1600000 -ParagraphsXml $titlePars))
        $parts.Add((New-TextBoxXml -Id 4 -Name 'Subtitle' -X 1900000 -Y 3400000 -Cx 8400000 -Cy 2200000 -ParagraphsXml $subtitlePars))
        $slideXml = New-SlideXml -BodyXml ($parts -join "`n")
        Set-Content -LiteralPath (Join-Path $work "ppt\slides\slide$slideNo.xml") -Value $slideXml -Encoding UTF8
        Set-Content -LiteralPath (Join-Path $work "ppt\slides\_rels\slide$slideNo.xml.rels") -Value (New-SlideRelsXml -LayoutTarget 'slideLayout1.xml') -Encoding UTF8
    }
    elseif ($slide.kind -eq 'image') {
        $parts.Add((New-RectXml -Id 2 -Name 'Header' -X 0 -Y 0 -Cx 12192000 -Cy 700000 -FillColor '6F0F1A'))
        $titlePars = @(
            (New-ParagraphXml -Text $slide.title -FontSize 2200 -Color 'FAF7F2' -Align 'ctr' -Bold $true)
        )
        $bulletPars = @()
        foreach ($bullet in $slide.bullets) {
            $bulletPars += (New-ParagraphXml -Text $bullet -FontSize 1600 -Color '1F2937' -Align 'l' -Bullet $true)
        }
        $parts.Add((New-TextBoxXml -Id 3 -Name 'Title' -X 600000 -Y 120000 -Cx 10992000 -Cy 350000 -ParagraphsXml $titlePars))
        $parts.Add((New-TextBoxXml -Id 4 -Name 'Bullets' -X 500000 -Y 1200000 -Cx 3300000 -Cy 4200000 -ParagraphsXml $bulletPars))

        $imageTarget = $slide.imageName
        Copy-Item -LiteralPath (Join-Path $docMedia $slide.imageSource) -Destination (Join-Path $work "ppt\media\$imageTarget") -Force
        $parts.Add((New-PictureXml -Id 5 -Name 'Screenshot' -X 4300000 -Y 1200000 -Cx 7000000 -Cy 4200000 -RelId 'rId2'))

        $slideXml = New-SlideXml -BodyXml ($parts -join "`n")
        Set-Content -LiteralPath (Join-Path $work "ppt\slides\slide$slideNo.xml") -Value $slideXml -Encoding UTF8
        Set-Content -LiteralPath (Join-Path $work "ppt\slides\_rels\slide$slideNo.xml.rels") -Value (New-SlideRelsXml -LayoutTarget 'slideLayout2.xml' -ImageTarget $imageTarget) -Encoding UTF8
    }
    else {
        $parts.Add((New-RectXml -Id 2 -Name 'Header' -X 0 -Y 0 -Cx 12192000 -Cy 700000 -FillColor '6F0F1A'))
        $titlePars = @(
            (New-ParagraphXml -Text $slide.title -FontSize 2200 -Color 'FAF7F2' -Align 'ctr' -Bold $true)
        )
        $bulletPars = @()
        foreach ($bullet in $slide.bullets) {
            $bulletPars += (New-ParagraphXml -Text $bullet -FontSize 1700 -Color '1F2937' -Align 'l' -Bullet $true)
        }
        $parts.Add((New-TextBoxXml -Id 3 -Name 'Title' -X 600000 -Y 120000 -Cx 10992000 -Cy 350000 -ParagraphsXml $titlePars))
        $parts.Add((New-TextBoxXml -Id 4 -Name 'Bullets' -X 900000 -Y 1200000 -Cx 10300000 -Cy 4700000 -ParagraphsXml $bulletPars))
        $slideXml = New-SlideXml -BodyXml ($parts -join "`n")
        Set-Content -LiteralPath (Join-Path $work "ppt\slides\slide$slideNo.xml") -Value $slideXml -Encoding UTF8
        Set-Content -LiteralPath (Join-Path $work "ppt\slides\_rels\slide$slideNo.xml.rels") -Value (New-SlideRelsXml -LayoutTarget 'slideLayout2.xml') -Encoding UTF8
    }
}

$presentationRels.Add('<Relationship Id="rId100" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>')
$presentationRels.Add('<Relationship Id="rId101" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>')
$presentationRels.Add('<Relationship Id="rId102" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>')

$presentationXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1" autoCompressPictures="0">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    $($presentationSlideRefs -join "`n    ")
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle/>
</p:presentation>
"@
Set-Content -LiteralPath (Join-Path $work 'ppt\presentation.xml') -Value $presentationXml -Encoding UTF8

$presentationRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  $($presentationRels -join "`n  ")
</Relationships>
"@
Set-Content -LiteralPath (Join-Path $work 'ppt\_rels\presentation.xml.rels') -Value $presentationRelsXml -Encoding UTF8

$layoutOverrides = Get-ChildItem -LiteralPath (Join-Path $work 'ppt\slideLayouts') -Filter 'slideLayout*.xml' | Sort-Object Name | ForEach-Object {
    "<Override PartName=`"/ppt/slideLayouts/$($_.Name)`" ContentType=`"application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml`"/>"
}
$masterOverrides = Get-ChildItem -LiteralPath (Join-Path $work 'ppt\slideMasters') -Filter 'slideMaster*.xml' | Sort-Object Name | ForEach-Object {
    "<Override PartName=`"/ppt/slideMasters/$($_.Name)`" ContentType=`"application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml`"/>"
}
$themeOverrides = Get-ChildItem -LiteralPath (Join-Path $work 'ppt\theme') -Filter 'theme*.xml' | Sort-Object Name | ForEach-Object {
    "<Override PartName=`"/ppt/theme/$($_.Name)`" ContentType=`"application/vnd.openxmlformats-officedocument.theme+xml`"/>"
}

$contentTypesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
  <Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
  <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  $($masterOverrides -join "`n  ")
  $($layoutOverrides -join "`n  ")
  $($themeOverrides -join "`n  ")
  $($contentTypeSlides -join "`n  ")
</Types>
"@
Set-Content -LiteralPath (Join-Path $work '[Content_Types].xml') -Value $contentTypesXml -Encoding UTF8

if (Test-Path -LiteralPath $output) {
    Remove-Item -LiteralPath $output -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($work, $output)

Write-Output "Created: $output"
