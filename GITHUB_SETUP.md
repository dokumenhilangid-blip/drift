# GitHub Setup Instructions for Drift MVP

This guide will help you push the Drift MVP project to your GitHub repository.

---

## Prerequisites

1. **GitHub Account**: Create one at [github.com](https://github.com) if you don't have one
2. **Git Installed**: Already available in the sandbox
3. **GitHub CLI** (optional): `gh` is pre-installed in the sandbox

---

## Option 1: Using GitHub Web UI (Easiest)

### Step 1: Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `drift` (or `drift-mvp`)
3. **Description**: "Emotional AI Reflection - Stateless MVP"
4. **Visibility**: Choose `Private` (recommended) or `Public`
5. **Do NOT** initialize with README, .gitignore, or license (we have them)
6. Click **Create repository**

### Step 2: Copy the Repository URL
After creating, GitHub shows you the commands. Copy the HTTPS URL:
```
https://github.com/YOUR_USERNAME/drift.git
```

### Step 3: Push from Sandbox
```bash
cd /home/ubuntu/Drift
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/drift.git
git push -u origin main
```

When prompted for password:
- **Username**: Your GitHub username
- **Password**: Your GitHub personal access token (see below)

---

## Option 2: Using GitHub CLI (Faster)

### Step 1: Authenticate with GitHub
```bash
gh auth login
```

Follow the prompts:
- **What is your preferred protocol?**: HTTPS
- **Authenticate Git with your GitHub credentials?**: Yes
- **How would you like to authenticate GitHub CLI?**: Paste an authentication token

### Step 2: Create Repository
```bash
cd /home/ubuntu/Drift
gh repo create drift --private --source=. --remote=origin --push
```

This will:
- Create a private repository on GitHub
- Set it as the remote origin
- Push all commits automatically

---

## Getting a GitHub Personal Access Token

If you need a personal access token for HTTPS authentication:

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token** → **Generate new token (classic)**
3. **Token name**: `drift-push`
4. **Expiration**: 90 days (or your preference)
5. **Scopes**: Check `repo` (full control of private repositories)
6. Click **Generate token**
7. **Copy the token** (you won't see it again!)
8. Use this token as your "password" when pushing

---

## Verify Push Success

After pushing, verify the repository on GitHub:

```bash
# Check remote URL
cd /home/ubuntu/Drift
git remote -v

# Should show:
# origin  https://github.com/YOUR_USERNAME/drift.git (fetch)
# origin  https://github.com/YOUR_USERNAME/drift.git (push)
```

Then visit `https://github.com/YOUR_USERNAME/drift` to see your repository.

---

## What Gets Pushed

### ✅ Included
- All source code (React components, API routes)
- Configuration files (package.json, tsconfig.json, tailwind.config.js)
- Documentation (README.md, IMPLEMENTATION_SPEC.md, DRIFT_MVP_ARCHITECTURE.md)
- .gitignore (excludes node_modules, .env, .next, etc.)

### ❌ Excluded (by .gitignore)
- `node_modules/` (dependencies)
- `.next/` (build artifacts)
- `.env.local` (secrets - NEVER push!)
- `dist/`, `build/` (build outputs)

---

## After Pushing to GitHub

### For You
1. **Share the repository URL** with your team or collaborators
2. **Add collaborators** in GitHub Settings → Collaborators
3. **Enable branch protection** (optional) for `main` branch
4. **Set up GitHub Actions** (optional) for CI/CD

### For Others (to clone and run)
```bash
git clone https://github.com/YOUR_USERNAME/drift.git
cd drift
npm install
echo "GEMINI_API_KEY=your-key-here" > .env.local
npm run dev
```

---

## Troubleshooting

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/drift.git
git push -u origin main
```

### "Authentication failed"
1. Check your GitHub username and personal access token
2. Make sure token has `repo` scope
3. Try using GitHub CLI instead: `gh auth login`

### ".env.local is being tracked"
If you accidentally pushed `.env.local`:
```bash
git rm --cached .env.local
git commit -m "Remove .env.local from tracking"
git push
```

Then regenerate your Gemini API key (it may have been exposed).

### "Permission denied (publickey)"
You're using SSH instead of HTTPS. Either:
1. Use HTTPS URL instead: `https://github.com/YOUR_USERNAME/drift.git`
2. Or set up SSH keys: [github.com/settings/keys](https://github.com/settings/keys)

---

## Repository Structure on GitHub

After pushing, your GitHub repository will have:

```
drift/
├── app/                          # Next.js app directory
├── components/                   # React components
├── lib/                          # Utility functions
├── public/                       # Static assets
├── package.json                  # Dependencies
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── next.config.js                # Next.js configuration
├── README.md                     # Project overview
├── IMPLEMENTATION_SPEC.md        # Technical specification
├── DRIFT_MVP_ARCHITECTURE.md     # Architecture & design
├── DRIFT_MVP_TODO.md             # Feature tracking
├── GITHUB_SETUP.md               # This file
└── .gitignore                    # Git ignore rules
```

---

## Next Steps

1. **Push to GitHub** (use Option 1 or 2 above)
2. **Share the repository URL** with your team
3. **Continue development** or **deploy to Manus WebDev**
4. **Monitor performance** and collect user feedback

---

## Security Reminders

⚠️ **NEVER commit these files**:
- `.env.local` (contains Gemini API key)
- `node_modules/` (dependencies)
- `.next/` (build artifacts)
- Any files with secrets or credentials

✅ **Always use** `.gitignore` to exclude sensitive files

---

## Questions?

- **GitHub Docs**: [docs.github.com](https://docs.github.com)
- **Git Docs**: [git-scm.com](https://git-scm.com)
- **GitHub CLI**: [cli.github.com](https://cli.github.com)

---

**Status**: Ready to Push  
**Last Updated**: May 15, 2026  
**Next Step**: Follow Option 1 or 2 to push to GitHub
