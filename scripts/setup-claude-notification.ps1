<#
.SYNOPSIS
    Claude Code Notification Setup Wizard

.DESCRIPTION
    Walks the user through setting up a permission/wait notification in Claude Code's
    user-level settings.json. Defaults to dry-run (preview only). Pass -Apply to actually
    modify the settings file.

    This script is LOCAL-ONLY. It modifies user-level config, NOT the repo.
    Never commit any settings files or credentials. See docs/dev/notification-setup.md.

.PARAMETER Apply
    Actually modify the settings.json file. Without this flag, the script only previews
    the patch and shows instructions. SAFE DEFAULT IS DRY-RUN.

.PARAMETER ConfigDir
    Override the CLAUDE_CONFIG_DIR path. Defaults to $env:CLAUDE_CONFIG_DIR or ~/.claude/

.EXAMPLE
    .\setup-claude-notification.ps1
    (Dry-run: shows the patch preview and instructions)

.EXAMPLE
    .\setup-claude-notification.ps1 -Apply
    (Applies the patch to settings.json after backup)

.NOTES
    Full setup guide: docs/dev/notification-setup.md
    This script is safe to run multiple times (idempotent in dry-run mode).
    In Apply mode, it backs up settings.json before modifying.
#>

param(
    [switch]$Apply,
    [string]$ConfigDir = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Detect CLAUDE_CONFIG_DIR ---
if ($ConfigDir -eq "") {
    if ($env:CLAUDE_CONFIG_DIR) {
        $ConfigDir = $env:CLAUDE_CONFIG_DIR
    } else {
        $ConfigDir = Join-Path $env:USERPROFILE ".claude"
    }
}

$SettingsFile = Join-Path $ConfigDir "settings.json"

Write-Host ""
Write-Host "=== Claude Code Notification Setup Wizard ==="
Write-Host ""
Write-Host "Mode: $(if ($Apply) { 'APPLY (will modify settings.json)' } else { 'DRY-RUN (preview only)' })"
Write-Host "Config dir: $ConfigDir"
Write-Host "Settings file: $SettingsFile"
Write-Host ""

# --- Check config dir exists ---
if (-not (Test-Path $ConfigDir)) {
    Write-Host "[WARN] Config directory does not exist: $ConfigDir"
    Write-Host "       This may mean Claude Code has not been run yet, or CLAUDE_CONFIG_DIR is wrong."
    Write-Host "       If you use a custom config dir, pass -ConfigDir <path>"
    Write-Host ""
    if (-not $Apply) {
        Write-Host "Dry-run: would create $ConfigDir and settings.json if it does not exist."
        Write-Host ""
    }
}

# --- Read existing settings ---
$existingSettings = $null
$existingJson = $null
if (Test-Path $SettingsFile) {
    Write-Host "Found existing settings.json."
    try {
        $existingJson = Get-Content $SettingsFile -Raw
        $existingSettings = $existingJson | ConvertFrom-Json
        Write-Host "Existing settings.json is valid JSON."
    } catch {
        Write-Host "[WARN] Existing settings.json could not be parsed as JSON: $($_.Exception.Message)"
        Write-Host "       The Apply mode will NOT modify the file to avoid data loss."
        Write-Host "       Please edit manually using the patch shown below."
        $Apply = $false
    }
} else {
    Write-Host "No existing settings.json found. A new one will be created."
}

# --- Define the notification hook patch ---
$hookEntry = @{
    matcher = ".*"
    hooks   = @(
        @{
            type    = "command"
            command = "[System.Console]::Beep(880, 300); [System.Console]::Beep(660, 200)"
        }
    )
}

$patchPreview = @"
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "[System.Console]::Beep(880, 300); [System.Console]::Beep(660, 200)"
          }
        ]
      }
    ]
  }
}
"@

Write-Host ""
Write-Host "--- Patch Preview ---"
Write-Host "The following JSON will be added/merged into your settings.json:"
Write-Host ""
Write-Host $patchPreview
Write-Host "---"
Write-Host ""
Write-Host "This adds a double-beep notification when Claude Code waits for permission."
Write-Host "The beep uses Windows Console.Beep() — no external audio required."
Write-Host ""

# --- Check for existing PermissionRequest hook ---
$alreadyConfigured = $false
if ($existingSettings -and $existingSettings.hooks -and $existingSettings.hooks.PermissionRequest) {
    Write-Host "[INFO] A PermissionRequest hook already exists in settings.json."
    Write-Host "       Apply mode will ADD the new entry (not remove existing hooks)."
    Write-Host "       Review the merged result carefully."
    $alreadyConfigured = $true
}

# --- Apply mode ---
if ($Apply) {
    Write-Host ""
    Write-Host "--- Applying patch ---"

    # Backup first
    $backupFile = $SettingsFile + ".backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    if (Test-Path $SettingsFile) {
        Copy-Item $SettingsFile $backupFile
        Write-Host "Backup created: $backupFile"
    }

    try {
        if ($existingSettings -eq $null) {
            # Create new settings.json
            $newSettings = @{
                hooks = @{
                    PermissionRequest = @($hookEntry)
                }
            }
            $newSettings | ConvertTo-Json -Depth 10 | Out-File $SettingsFile -Encoding utf8
            Write-Host "Created new settings.json with notification hook."
        } elseif ($existingSettings.hooks -eq $null) {
            # Add hooks block to existing settings
            $existingSettings | Add-Member -NotePropertyName "hooks" -NotePropertyValue @{
                PermissionRequest = @($hookEntry)
            } -Force
            $existingSettings | ConvertTo-Json -Depth 10 | Out-File $SettingsFile -Encoding utf8
            Write-Host "Added hooks block to existing settings.json."
        } elseif ($existingSettings.hooks.PermissionRequest -eq $null) {
            # Add PermissionRequest to existing hooks block
            $existingSettings.hooks | Add-Member -NotePropertyName "PermissionRequest" -NotePropertyValue @($hookEntry) -Force
            $existingSettings | ConvertTo-Json -Depth 10 | Out-File $SettingsFile -Encoding utf8
            Write-Host "Added PermissionRequest hook to existing hooks block."
        } else {
            # Append to existing PermissionRequest array
            $existing = @($existingSettings.hooks.PermissionRequest)
            $existing += $hookEntry
            $existingSettings.hooks.PermissionRequest = $existing
            $existingSettings | ConvertTo-Json -Depth 10 | Out-File $SettingsFile -Encoding utf8
            Write-Host "Appended new entry to existing PermissionRequest hooks."
        }

        Write-Host ""
        Write-Host "[SUCCESS] settings.json updated."

    } catch {
        Write-Host "[ERROR] Failed to update settings.json: $($_.Exception.Message)"
        if (Test-Path $backupFile) {
            Write-Host "Restoring backup..."
            Copy-Item $backupFile $SettingsFile -Force
            Write-Host "Backup restored. No changes were saved."
        }
        exit 1
    }
} else {
    Write-Host "--- Dry-run complete ---"
    Write-Host ""
    Write-Host "To apply the patch, run:"
    Write-Host "    .\scripts\setup-claude-notification.ps1 -Apply"
    Write-Host ""
    Write-Host "To apply with a specific config dir:"
    Write-Host "    .\scripts\setup-claude-notification.ps1 -Apply -ConfigDir 'C:\Users\you\.claude-account-icloud\'"
    Write-Host ""
}

# --- Test instructions ---
Write-Host ""
Write-Host "--- How to test ---"
Write-Host "1. Restart Claude Code or start a new session."
Write-Host "2. Run /hooks in the Claude Code session to verify hooks are loaded."
Write-Host "3. Trigger a permission prompt (e.g. run a bash command that requires approval)."
Write-Host "4. You should hear two beeps (880 Hz then 660 Hz)."
Write-Host ""
Write-Host "If audio is muted: check Windows volume mixer for the terminal app."
Write-Host "If the hook does not fire: verify the settings.json path matches your CLAUDE_CONFIG_DIR."
Write-Host "If using multiple config dirs: run this script once per config dir."
Write-Host ""
Write-Host "Full setup guide: docs/dev/notification-setup.md"
Write-Host ""
