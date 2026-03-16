$url = "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBjHKrIbSjYnz4d4niI-nXGy8dEWzoYRRE"
try {
    $response = Invoke-RestMethod -Uri $url
    $response.models.name | Out-File "c:\Users\I533235\Projects\DipProj\models.txt"
} catch {
    Write-Host "Error"
}
