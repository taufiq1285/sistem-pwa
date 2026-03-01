param(
  [Parameter(Mandatory = $true)]
  [string]$AccessToken,

  [Parameter(Mandatory = $true)]
  [string]$ProjectRef,

  [string]$OutDir = "backups/supabase/management-api",

  [switch]$IncludeData
)

$ErrorActionPreference = "Stop"

function Invoke-SupabaseQuery {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Token,
    [Parameter(Mandatory = $true)]
    [string]$Ref,
    [Parameter(Mandatory = $true)]
    [string]$Sql
  )

  $headers = @{
    Authorization = "Bearer $Token"
    apikey        = $Token
    "Content-Type" = "application/json"
  }

  $payload = @{ query = $Sql } | ConvertTo-Json -Compress
  $url = "https://api.supabase.com/v1/projects/$Ref/database/query"

  return Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $payload
}

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$target = Join-Path $OutDir $ts
New-Item -ItemType Directory -Force -Path $target | Out-Null

Write-Host "[INFO] Backup directory: $target"

# 1) Daftar tabel user
$sqlTables = @"
select table_schema, table_name
from information_schema.tables
where table_type = 'BASE TABLE'
  and table_schema not in ('pg_catalog', 'information_schema')
order by table_schema, table_name;
"@
$tables = Invoke-SupabaseQuery -Token $AccessToken -Ref $ProjectRef -Sql $sqlTables
$tables | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 (Join-Path $target "tables.json")

# 2) Kolom tabel
$sqlColumns = @"
select table_schema, table_name, ordinal_position, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema not in ('pg_catalog', 'information_schema')
order by table_schema, table_name, ordinal_position;
"@
$columns = Invoke-SupabaseQuery -Token $AccessToken -Ref $ProjectRef -Sql $sqlColumns
$columns | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 (Join-Path $target "columns.json")

# 3) RLS enabled/forced status
$sqlRlsStatus = @"
select n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname not in ('pg_catalog', 'information_schema')
order by n.nspname, c.relname;
"@
$rlsStatus = Invoke-SupabaseQuery -Token $AccessToken -Ref $ProjectRef -Sql $sqlRlsStatus
$rlsStatus | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 (Join-Path $target "rls_status.json")

# 4) Policy RLS
$sqlPolicies = @"
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
order by schemaname, tablename, policyname;
"@
$policies = Invoke-SupabaseQuery -Token $AccessToken -Ref $ProjectRef -Sql $sqlPolicies
$policies | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 (Join-Path $target "policies.json")

# 5) Trigger
$sqlTriggers = @"
select event_object_schema,
       event_object_table,
       trigger_name,
       action_timing,
       event_manipulation,
       action_statement
from information_schema.triggers
order by event_object_schema, event_object_table, trigger_name;
"@
$triggers = Invoke-SupabaseQuery -Token $AccessToken -Ref $ProjectRef -Sql $sqlTriggers
$triggers | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 (Join-Path $target "triggers.json")

# 6) Function definitions
$sqlFunctions = @"
select n.nspname as schema_name,
       p.proname as function_name,
       pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname not in ('pg_catalog', 'information_schema')
order by n.nspname, p.proname;
"@
$functions = Invoke-SupabaseQuery -Token $AccessToken -Ref $ProjectRef -Sql $sqlFunctions
$functions | ConvertTo-Json -Depth 20 | Set-Content -Encoding UTF8 (Join-Path $target "functions.json")

# 7) View definitions
$sqlViews = @"
select schemaname, viewname, definition
from pg_views
where schemaname not in ('pg_catalog', 'information_schema')
order by schemaname, viewname;
"@
$views = Invoke-SupabaseQuery -Token $AccessToken -Ref $ProjectRef -Sql $sqlViews
$views | ConvertTo-Json -Depth 20 | Set-Content -Encoding UTF8 (Join-Path $target "views.json")

# 8) SQL snapshot ringkas utk restore manual RLS/Trigger/Function
$sqlBundlePath = Join-Path $target "ddl_bundle.sql"
"-- Generated at $(Get-Date -Format s)`n" | Set-Content -Encoding UTF8 $sqlBundlePath

Add-Content -Encoding UTF8 $sqlBundlePath "-- ===== FUNCTIONS =====`n"
foreach ($fn in $functions) {
  if ($fn.definition) {
    Add-Content -Encoding UTF8 $sqlBundlePath ($fn.definition + "`n")
  }
}

Add-Content -Encoding UTF8 $sqlBundlePath "`n-- ===== RLS POLICIES (reconstruct) =====`n"
foreach ($p in $policies) {
  $schema = $p.schemaname
  $table = $p.tablename
  $policy = ($p.policyname -replace '"', '""')
  $cmd = if ($p.cmd) { $p.cmd } else { 'ALL' }
  $perm = if ($p.permissive -eq 'PERMISSIVE') { 'PERMISSIVE' } else { 'RESTRICTIVE' }

  $rolesPart = "PUBLIC"
  if ($p.roles -and $p.roles.Count -gt 0) {
    $rolesPart = ($p.roles -join ", ")
  }

  $qual = if ($p.qual) { $p.qual } else { 'true' }
  $withCheck = if ($p.with_check) { $p.with_check } else { 'true' }

  $stmt = @"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = '$schema' AND tablename = '$table' AND policyname = '$policy'
  ) THEN
    EXECUTE 'DROP POLICY ""$policy"" ON "$schema"."$table"';
  END IF;
END$$;

CREATE POLICY "$policy"
ON "$schema"."$table"
AS $perm
FOR $cmd
TO $rolesPart
USING ($qual)
WITH CHECK ($withCheck);
"@
  Add-Content -Encoding UTF8 $sqlBundlePath ($stmt + "`n")
}

Add-Content -Encoding UTF8 $sqlBundlePath "`n-- ===== TRIGGERS =====`n"
foreach ($t in $triggers) {
  $schema = $t.event_object_schema
  $table = $t.event_object_table
  $trg = ($t.trigger_name -replace '"', '""')
  $timing = $t.action_timing
  $eventManipulation = $t.event_manipulation
  $action = $t.action_statement

  $stmt = @"
DROP TRIGGER IF EXISTS "$trg" ON "$schema"."$table";
CREATE TRIGGER "$trg" $timing $eventManipulation ON "$schema"."$table"
FOR EACH ROW $action;
"@
  Add-Content -Encoding UTF8 $sqlBundlePath ($stmt + "`n")
}

# 9) Optional data snapshot per table (JSON)
if ($IncludeData) {
  $dataDir = Join-Path $target "data"
  New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

  foreach ($t in $tables) {
    $schema = $t.table_schema
    $name = $t.table_name
    $safeFile = "$schema.$name.json"

    $sqlData = "select * from `"$schema`".`"$name`";"
    try {
      $rows = Invoke-SupabaseQuery -Token $AccessToken -Ref $ProjectRef -Sql $sqlData
      $rows | ConvertTo-Json -Depth 50 | Set-Content -Encoding UTF8 (Join-Path $dataDir $safeFile)
      Write-Host "[OK] Data exported: $schema.$name"
    } catch {
      Write-Warning "[WARN] Gagal export data $schema.$name : $($_.Exception.Message)"
    }
  }
}

Write-Host "[SUCCESS] Backup via Management API selesai"
Write-Host "[OUTPUT] $target/tables.json"
Write-Host "[OUTPUT] $target/policies.json"
Write-Host "[OUTPUT] $target/triggers.json"
Write-Host "[OUTPUT] $target/functions.json"
Write-Host "[OUTPUT] $target/ddl_bundle.sql"
