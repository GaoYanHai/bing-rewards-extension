# Publish a zip to Microsoft Edge Add-ons using local .edge-publish.env
# Usage: pwsh -File store/publish.ps1 [path-to-zip]
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".edge-publish.env"
if (-not (Test-Path $envFile)) {
  throw "Missing $envFile. Create it locally; do not commit API keys."
}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $eq = $line.IndexOf("=")
  if ($eq -lt 1) { return }
  $name = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1)
  Set-Item -Path "Env:$name" -Value $value
}
$zip = if ($args[0]) { $args[0] } else {
  Get-ChildItem (Join-Path $root "bing-rewards-extension-*.zip") | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $zip -or -not (Test-Path $zip)) { throw "Zip not found" }
$env:EDGE_ZIP_PATH = (Resolve-Path $zip).Path
python -u (Join-Path $PSScriptRoot "publish.py")
