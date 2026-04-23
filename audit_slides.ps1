Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("f:\sistem-praktikum\sistem-praktikum-pwa\docs\TEMPLATE 107.pptx")
$slideEntries = $zip.Entries | Where-Object { $_.FullName -match "ppt/slides/slide(\d+)\.xml" } | ForEach-Object {
    if ($_.FullName -match "ppt/slides/slide(\d+)\.xml") {
        [PSCustomObject]@{
            Id = [int]$matches[1]
            Entry = $_
        }
    }
} | Sort-Object Id

Write-Host "Total Slides: $(.Count)"
foreach ($s in $slideEntries) {
    $stream = $s.Entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = $reader.ReadToEnd()
    $textMatches = [regex]::Matches($xml, "<a:t[^>]*>(.*?)</a:t>")
    $text = ($textMatches | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_.Trim() -ne "" }) -join " "
    $text = $text.Trim() -replace "\s+", " "
    $preview = if ($text.Length -gt 100) { $text.Substring(0, 100) + "..." } else { $text }
    Write-Host "Slide ID $(.Id): $preview"
    $reader.Close()
    $stream.Close()
}
$zip.Dispose()
