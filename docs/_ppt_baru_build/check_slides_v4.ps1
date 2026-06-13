Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("f:\sistem-praktikum\sistem-praktikum-pwa\docs\TEMPLATE 107.pptx")
$slides = @()
foreach ($entry in $zip.Entries) {
    if ($entry.FullName -match "ppt/slides/slide(\d+)\.xml") {
        $slides += [PSCustomObject]@{
            SlideNum = [int]$matches[1]
            Entry = $entry
        }
    }
}
$slides = $slides | Sort-Object SlideNum
Write-Host "Total Slides: $(.Count)"
foreach ($slide in $slides) {
    $stream = $slide.Entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = $reader.ReadToEnd()
    $textMatches = [regex]::Matches($xml, "<a:t[^>]*>(.*?)</a:t>")
    $text = ($textMatches.Groups | ForEach-Object { $_.Value } | Where-Object { $_ -notmatch "<" } | Where-Object { $_.Trim() -ne "" }) -join " "
    $text = $text.Trim() -replace "\s+", " "
    if ($text.Length -gt 150) { $text = $text.Substring(0, 150) + "..." }
    Write-Host "Slide $(.SlideNum): $text"
    $reader.Close()
    $stream.Close()
}
$zip.Dispose()
