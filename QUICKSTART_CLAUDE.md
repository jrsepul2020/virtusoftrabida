# 🚀 Quick Start Guide - Claude Code Setup

## ⚡ 5-Minute Setup

### 1. Get Your API Key

Visit [Anthropic Console](https://console.anthropic.com/settings/keys) → Create Key → Copy it

### 2. Set Environment Variable

**macOS/Linux:**
```bash
export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
export VITE_SUPABASE_URL="https://cfpawqoegitgtsjygbqp.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
$env:VITE_SUPABASE_URL="https://cfpawqoegitgtsjygbqp.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Or create `.env.local`:**
```bash
cp .env.local.example .env.local
# Edit and add your keys
```

### 3. Restart Your Editor

Close and reopen VS Code/Cursor/your MCP-compatible editor.

### 4. Test It

Ask Claude Code: "List the files in this project"

If it works, you're done! ✅

---

## 🆘 Troubleshooting

**"Missing API key"** → Set `ANTHROPIC_API_KEY` environment variable  
**"Invalid API key"** → Generate a new key from Anthropic Console  
**"Cannot connect to Supabase"** → Set `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## 📖 Full Documentation

See [CLAUDE_CODE_SETUP.md](./CLAUDE_CODE_SETUP.md) for detailed instructions.

## 🔒 Security Reminder

- ✅ `.env.local` is in `.gitignore` (safe to use)
- ❌ **NEVER** commit API keys to Git
- ❌ **NEVER** hardcode secrets in `.mcp.json`

---

**Need help?** Check the full setup guide or contact the dev team.
