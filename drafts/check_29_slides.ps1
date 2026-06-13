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
Write-Host "--- TOTAL SLIDES: $($slides.Count) ---"
foreach ($slide in $slides) {
    $stream = $slide.Entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = $reader.ReadToEnd()
    $textMatches = [regex]::Matches($xml, "<a:t[^>]*>(.*?)</a:t>")
    $foundText = $textMatches | Select-Object -First 5 | ForEach-Object { $_.Groups[1].Value }
    $title = $foundText -join " "
    Write-Host "Slide $($slide.SlideNum): $title"
    $reader.Close()
    $stream.Close()
}
$zip.Dispose()
