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
foreach ($slide in $slides) {
    $stream = $slide.Entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = $reader.ReadToEnd()
    $textMatches = [regex]::Matches($xml, "<a:t[^>]*>(.*?)</a:t>")
    Write-Host "
--- Slide $($slide.SlideNum) ---"
    foreach ($match in $textMatches) {
        Write-Host $match.Groups[1].Value
    }
    $reader.Close()
    $stream.Close()
}
$zip.Dispose()
