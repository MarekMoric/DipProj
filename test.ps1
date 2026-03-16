$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBjHKrIbSjYnz4d4niI-nXGy8dEWzoYRRE"
$body = @{
    contents = @(
        @{
            parts = @(
                @{ text = "hello" }
            )
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body
    Write-Host "Success!"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error!"
    $errorMsg = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorMsg)
    $reader.ReadToEnd()
}
