$files = Get-ChildItem -Path "f:\sistem-praktikum\sistem-praktikum-pwa\docs" -Filter "*.drawio"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Menghapus waypoints <Array as="points">...</Array>
    $content = $content -replace '(?s)<Array as="points">.*?</Array>', ''
    
    # Menghapus exitX, exitY, entryX, entryY di style edge
    $content = $content -replace 'exitX=[0-9.]+;?', ''
    $content = $content -replace 'exitY=[0-9.]+;?', ''
    $content = $content -replace 'entryX=[0-9.]+;?', ''
    $content = $content -replace 'entryY=[0-9.]+;?', ''

    # Menghapus jumpStyle jika sudah ada, agar tidak duplikat
    $content = $content -replace 'jumpStyle=arc;jumpSize=15;rounded=1;', ''

    # Menambahkan jumpStyle=arc;jumpSize=15;
    $content = $content -replace '(edgeStyle=orthogonalEdgeStyle[^"]*)', '$1;jumpStyle=arc;jumpSize=15;rounded=1;'

    Set-Content -Path $file.FullName -Value $content
    Write-Host "Fixed visual layout markers in $($file.Name)"
}
