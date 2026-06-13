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
Write-Host "Total Slides: $($slides.Count)"
foreach ($slide in $slides) {
    $stream = $slide.Entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = $reader.ReadToEnd()
    
    # Simple regex to get text inside <a:t> tags
    $textMatches = [regex]::Matches($xml, "<a:t[^>]*>(.*?)</a:t>")
    $lines = $textMatches | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_.Trim() -ne "" }
    $summary = ($lines | Select-Object -First 3) -join " | "
    
    Write-Host "Slide $($slide.SlideNum): $summary"
    
    $reader.Close()
    $stream.Close()
}
$zip.Dispose()
