# Print assembled crm_user object by signing into local Supabase and querying public.users + role permissions
# Usage (pwsh):
#   $env:SUPABASE_URL = 'http://localhost:54321'
#   $env:SUPABASE_ANON_KEY = '<your-anon-key>'
#   pwsh ./scripts/print_crm_user.ps1 -Email 'admin@acme.com' -Password 'password123'

param(
  [string]$Email = 'admin@acme.com',
  [string]$Password = 'password123'
)

$supabaseUrl = $env:SUPABASE_URL
if (-not $supabaseUrl) { $supabaseUrl = 'http://localhost:54321' }
$anonKey = $env:SUPABASE_ANON_KEY
if (-not $anonKey) {
  Write-Error "SUPABASE_ANON_KEY environment variable is not set. Set it and re-run the script."
  exit 2
}

# Sign in
$signinUri = "$supabaseUrl/auth/v1/token?grant_type=password"
$body = @{ email = $Email; password = $Password } | ConvertTo-Json
try {
  $signin = Invoke-RestMethod -Method Post -Uri $signinUri -ContentType 'application/json' -Body $body -Headers @{ apikey = $anonKey }
} catch {
  Write-Error "Sign-in failed: $($_.Exception.Message)"
  exit 3
}

if (-not $signin) { Write-Error "Empty sign-in response"; exit 4 }

$accessToken = $signin.access_token
if (-not $accessToken) { Write-Error "No access token returned from sign-in"; exit 5 }

$userId = $signin.user.id
if (-not $userId) { Write-Error "No user id in sign-in response"; exit 6 }

$headers = @{ apikey = $anonKey; Authorization = "Bearer $accessToken" }

# Fetch app user row including user_roles -> roles(id,name)
$encId = [System.Uri]::EscapeDataString("id=eq.$userId")
$usersUrl = "$supabaseUrl/rest/v1/users?$encId&select=*,user_roles(role:roles(id,name))"
try {
  $usersResp = Invoke-RestMethod -Uri $usersUrl -Headers $headers -Method Get
} catch {
  Write-Error "Error fetching user row: $($_.Exception.Message)"
  exit 7
}

$appUser = $null
if ($usersResp -is [System.Array]) { $appUser = $usersResp[0] } else { $appUser = $usersResp }
if (-not $appUser) { Write-Error "App user not found in public.users"; exit 8 }

# Resolve role name and id
$roleName = $null
$roleId = $null
if ($appUser.user_roles -and $appUser.user_roles.Count -gt 0) {
  $roleName = $appUser.user_roles[0].role.name
  $roleId = $appUser.user_roles[0].role.id
}

$roleMap = @{
  'super_admin' = 'super_admin';
  'Administrator' = 'admin';
  'Manager' = 'manager';
  'User' = 'agent';
  'Engineer' = 'engineer';
  'Customer' = 'customer'
}

$resolvedRole = 'agent'
if ($roleName -and $roleMap.ContainsKey($roleName)) { $resolvedRole = $roleMap[$roleName] }
if ($appUser.is_super_admin -and -not $resolvedRole) { $resolvedRole = 'super_admin' }

# Fetch permissions for role if roleId present
$perms = @()
if ($roleId) {
  $rpUrl = "$supabaseUrl/rest/v1/role_permissions?role_id=eq.$roleId&select=permissions(id)"
  try {
    $rpResp = Invoke-RestMethod -Uri $rpUrl -Headers $headers -Method Get
    if ($rpResp) {
      if ($rpResp -is [System.Array]) {
        $perms = $rpResp | ForEach-Object { $_.permissions.id } | Where-Object { $_ }
      } else {
        if ($rpResp.permissions) { $perms = @($rpResp.permissions.id) }
      }
    }
  } catch {
    Write-Warning "Failed to fetch role_permissions: $($_.Exception.Message)"
  }
}

# Assemble crm_user object (matching createAuthResponse mapping)
$crm_user = [ordered]@{
  id = $appUser.id
  email = $appUser.email
  name = if ($appUser.name) { $appUser.name } else { ($appUser.first_name + ' ' + $appUser.last_name).Trim() }
  firstName = $appUser.first_name
  lastName = $appUser.last_name
  role = $resolvedRole
  status = if ($appUser.status) { $appUser.status } else { 'active' }
  tenantId = $appUser.tenant_id
  createdAt = $appUser.created_at
  lastLogin = $appUser.last_login
  isSuperAdmin = ($appUser.is_super_admin -eq $true) -or ($resolvedRole -eq 'super_admin' -and -not $appUser.tenant_id)
  isSuperAdminMode = $false
  impersonatedAsUserId = $null
  impersonationLogId = $null
  permissions = $perms
}

# Print pretty JSON
$crm_user | ConvertTo-Json -Depth 5 | Write-Output

# Exit success
exit 0
