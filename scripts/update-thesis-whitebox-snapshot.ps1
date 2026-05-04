$ErrorActionPreference = 'Stop'

$docxPath = 'C:\Users\ACER\Downloads\SKRIPSI TAUFIQ - FIX.docx'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = "C:\Users\ACER\Downloads\SKRIPSI TAUFIQ - FIX.backup-whitebox-241-5231-$timestamp.docx"

if (-not (Test-Path -LiteralPath $docxPath)) {
  throw "DOCX not found: $docxPath"
}

Copy-Item -LiteralPath $docxPath -Destination $backupPath -Force

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-NodeText {
  param($Node, $Ns)
  $text = ''
  foreach ($t in $Node.SelectNodes('.//w:t', $Ns)) {
    $text += $t.InnerText
  }
  return $text
}

function Set-NodeText {
  param($Node, [string]$Text, $Ns)
  $texts = $Node.SelectNodes('.//w:t', $Ns)
  if ($texts.Count -eq 0) {
    return
  }

  $texts[0].InnerText = $Text
  $spaceAttr = $texts[0].OwnerDocument.CreateAttribute('xml', 'space', 'http://www.w3.org/XML/1998/namespace')
  $spaceAttr.Value = 'preserve'
  [void]$texts[0].Attributes.SetNamedItem($spaceAttr)

  for ($i = 1; $i -lt $texts.Count; $i++) {
    $texts[$i].InnerText = ''
  }
}

function Set-TableCellText {
  param($Cell, [string]$Text, $Ns)
  Set-NodeText -Node $Cell -Text $Text -Ns $Ns
}

$zip = [System.IO.Compression.ZipFile]::Open($docxPath, [System.IO.Compression.ZipArchiveMode]::Update)
try {
  $entry = $zip.GetEntry('word/document.xml')
  $reader = New-Object System.IO.StreamReader($entry.Open())
  $xmlText = $reader.ReadToEnd()
  $reader.Close()

  [xml]$xml = $xmlText
  $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
  $ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

  $paragraphReplacements = @(
    @{
      Match = 'Hasil pengujian white box melalui unit test menunjukkan 240 file test'
      Text = 'Sistem ini dikembangkan dengan teknologi React, TypeScript, Supabase, dan PWA. Fitur utama yang dihasilkan meliputi pengelolaan jadwal praktikum, peminjaman alat laboratorium, logbook digital, penilaian praktikum, pengumuman, notifikasi, serta dukungan akses offline menggunakan service worker, IndexedDB, dan sinkronisasi data. Hasil pengujian black box menunjukkan 45 skenario berhasil dijalankan dengan persentase kelulusan 100%. Berdasarkan snapshot eksekusi terakhir pengujian white box, unit test mencakup 241 file test dengan 5.231 test case dan seluruhnya lulus tanpa kegagalan. Evaluasi usability menggunakan System Usability Scale (SUS) terhadap 46 responden menghasilkan skor rata-rata 75,11 yang termasuk Grade B, kategori Good, dan acceptable.'
    },
    @{
      Match = 'The white box testing results through unit tests show that 240 test f'
      Text = 'The system was developed using React, TypeScript, Supabase, and PWA technologies. The main features include practicum schedule management, laboratory equipment borrowing, digital logbooks, practicum assessment, announcements, notifications, and offline access support using service workers, IndexedDB, and data synchronization. The black box testing results show that 45 scenarios were successfully executed with a 100% pass rate. Based on the latest white box execution snapshot, the unit tests cover 241 test files containing 5,231 test cases, all of which passed without failure. The usability evaluation using the System Usability Scale (SUS) involving 46 respondents produced an average score of 75.11, categorized as Grade B, Good, and acceptable.'
    },
    @{
      Match = 'Penyajian hasil white box pada bab ini tetap mempertahankan ruang lingkup proposal penelitian'
      Text = 'Pengujian white box pada sistem ini dilaksanakan menggunakan pendekatan unit test dan integration test yang bersifat otomatis dan dapat dieksekusi ulang kapan saja. Seluruh pengujian dijalankan sekaligus melalui perintah npm run test:run tanpa memerlukan intervensi manual pada setiap skenario. Penyajian hasil white box pada bab ini tetap mempertahankan ruang lingkup proposal penelitian, yaitu membuktikan bahwa logika internal sistem yang mendukung pengelolaan praktikum telah diverifikasi secara teknis. Untuk menjaga konsistensi pelaporan skripsi, angka yang digunakan pada bab ini dikunci berdasarkan snapshot eksekusi terakhir pengujian white box, bukan mengikuti seluruh perubahan test aktif di repo setelah snapshot tersebut ditetapkan.'
    },
    @{
      Match = 'Total terdapat 240 file test aktif dengan 5.227 test case pada eksekusi penuh terbaru'
      Text = 'Pengujian mencakup seluruh lapisan arsitektur sistem, mulai dari core logic seperti API layer, hooks, offline/PWA, utils dan helpers, validasi/schema, Supabase, config/context, hingga presentation layer seperti halaman, komponen fitur, komponen bersama, provider, layout, dan services. Selain itu, tersedia integration test, legacy test, serta test umum dan utilitas dasar yang tetap dijalankan sebagai pengaman regresi. Berdasarkan snapshot eksekusi terakhir yang dijadikan acuan skripsi, total terdapat 241 file test dengan 5.231 test case.'
    },
    @{
      Match = 'Seluruh 5.227 test case pada 240 file test berhasil dieksekusi'
      Text = 'Seluruh 5.231 test case pada 241 file test dalam snapshot tersebut berhasil dieksekusi dan memberikan hasil lulus tanpa ada satu pun kegagalan. Dalam keluaran test runner, kondisi ini tercatat sebagai 5.231 passed dan 0 failed. Hasil ini menunjukkan bahwa logika internal sistem telah terverifikasi dengan baik pada modul-modul yang diuji, meliputi API layer, hooks, validasi schema, modul offline dan PWA, utilitas, komponen antarmuka, provider, layout, services, integration test, serta legacy test yang masih dipertahankan sebagai pengaman regresi. Dengan persentase kelulusan 100%, pengujian white box menunjukkan bahwa implementasi sistem berada dalam kondisi stabil pada ruang lingkup pengujian otomatis yang tersedia. Test baru yang ditambahkan setelah snapshot tetap dapat digunakan untuk regresi internal, tetapi tidak mengubah angka resmi yang dipakai pada pelaporan skripsi ini. Namun, hasil ini tetap perlu dipahami secara proporsional, yaitu sebagai bukti kestabilan pada modul yang telah diuji, bukan sebagai klaim bahwa seluruh kemungkinan jalur program di semua kondisi telah sepenuhnya habis diuji.'
    },
    @{
      Match = 'Kelima, dari sisi keandalan hasil akhir, seluruh 5.227 test case'
      Text = 'Kelima, dari sisi keandalan hasil akhir, seluruh 5.231 test case pada snapshot eksekusi terakhir lulus tanpa satu pun kegagalan. Kondisi ini menunjukkan bahwa pada saat snapshot pelaporan skripsi ditetapkan, implementasi sistem berada dalam kondisi stabil pada ruang lingkup modul yang telah diuji secara otomatis.'
    },
    @{
      Match = 'Eksekusi akhir menghasilkan 240 file test dan 5.227 test case'
      Text = 'Pengujian white box menunjukkan hasil yang sangat baik dari sisi kestabilan logika internal. Berdasarkan snapshot eksekusi terakhir yang dikunci untuk pelaporan skripsi, hasil pengujian mencakup 241 file test dan 5.231 test case dengan seluruh status passed. Makna utama dari hasil ini adalah bahwa kualitas sistem tidak hanya dibuktikan melalui tampilan fungsi dari luar, tetapi juga melalui verifikasi otomatis pada bagian-bagian internal yang menopang perilaku sistem. Dengan demikian, hasil white box memperluas pembacaan kualitas dari sekadar "fitur berjalan" menjadi "logika program yang diuji juga stabil".'
    },
    @{
      Match = 'Namun justru di situlah nilai tambahnya'
      Text = 'Jika dikaitkan dengan proposal, posisi white box memang bukan inti evaluasi yang direncanakan sejak awal, karena proposal lebih menekankan fungsionalitas dan usability. Namun, hasil white box dapat dimaknai sebagai penguatan kualitas implementasi yang melengkapi target evaluasi pada proposal. Dengan kata lain, penelitian tidak hanya memenuhi arah evaluasi yang direncanakan, tetapi juga menambahkan verifikasi teknis yang membuat pembahasan kualitas sistem menjadi lebih lengkap dan meyakinkan.'
    }
  )

  foreach ($p in $xml.SelectNodes('//w:p', $ns)) {
    $text = Get-NodeText -Node $p -Ns $ns
    foreach ($replacement in $paragraphReplacements) {
      if ($text.Contains($replacement.Match)) {
        Set-NodeText -Node $p -Text $replacement.Text -Ns $ns
        break
      }
    }
  }

  $tables = $xml.SelectNodes('//w:tbl', $ns)

  $table33 = $tables[33]
  $table33Data = @(
    @('No', 'Kelompok Modul', 'Lapisan', 'Jumlah File', 'Jumlah Test Case'),
    @('1', 'API Layer', 'Core Logic', '33', '1.415'),
    @('2', 'Hooks', 'Core Logic', '21', '566'),
    @('3', 'Offline dan PWA', 'Core Logic', '15', '738'),
    @('4', 'Utils dan Helpers', 'Core Logic', '22', '781'),
    @('5', 'Validasi / Schema', 'Core Logic', '8', '405'),
    @('6', 'Supabase', 'Core Logic', '5', '103'),
    @('7', 'Config dan Context', 'Core Logic', '11', '183'),
    @('8', 'Halaman (Pages)', 'Presentation', '33', '184'),
    @('9', 'Komponen Fitur', 'Presentation', '33', '245'),
    @('10', 'Komponen Bersama', 'Presentation', '24', '287'),
    @('11', 'Provider', 'Presentation', '6', '87'),
    @('12', 'Layout', 'Presentation', '9', '30'),
    @('13', 'Services dan Lainnya', 'Presentation', '5', '63'),
    @('14', 'Integration Test', 'Cross-layer', '8', '90'),
    @('15', 'Legacy', 'Legacy', '6', '45'),
    @('16', 'Test Umum dan Utilitas Dasar', 'Miscellaneous', '2', '9'),
    @('Total', '', '', '241', '5.231')
  )

  $rows = $table33.SelectNodes('.//w:tr', $ns)
  for ($r = 0; $r -lt $table33Data.Count; $r++) {
    $cells = $rows[$r].SelectNodes('./w:tc', $ns)
    for ($c = 0; $c -lt $table33Data[$r].Count; $c++) {
      Set-TableCellText -Cell $cells[$c] -Text $table33Data[$r][$c] -Ns $ns
    }
  }

  $table48 = $null
  foreach ($tbl in $tables) {
    $tblText = Get-NodeText -Node $tbl -Ns $ns
    if ($tblText.Contains('Total File Test') -and $tblText.Contains('Persentase Kelulusan')) {
      $table48 = $tbl
      break
    }
  }

  if ($null -eq $table48) {
    throw 'Could not find Tabel 48 summary table.'
  }

  $table48Data = @(
    @('Metrik', 'Hasil'),
    @('Total File Test', '241'),
    @('Total Test Case', '5.231'),
    @('Test Case Lulus (Pass)', '5.231'),
    @('Test Case Gagal (Fail)', '0'),
    @('Persentase Kelulusan', '100%'),
    @('Durasi Eksekusi', 'Tidak dikunci pada snapshot')
  )

  $rows48 = $table48.SelectNodes('.//w:tr', $ns)
  for ($r = 0; $r -lt $table48Data.Count; $r++) {
    $cells = $rows48[$r].SelectNodes('./w:tc', $ns)
    for ($c = 0; $c -lt $table48Data[$r].Count; $c++) {
      Set-TableCellText -Cell $cells[$c] -Text $table48Data[$r][$c] -Ns $ns
    }
  }

  $newXml = $xml.OuterXml
  $entry.Delete()
  $newEntry = $zip.CreateEntry('word/document.xml')
  $writer = New-Object System.IO.StreamWriter($newEntry.Open())
  $writer.Write($newXml)
  $writer.Close()
}
finally {
  $zip.Dispose()
}

Write-Output "Updated: $docxPath"
Write-Output "Backup: $backupPath"
