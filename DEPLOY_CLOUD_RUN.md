# Deploy Drift to Google Cloud Run (Zero Terminal)

Deploy directly from GitHub via Cloud Run UI. No CLI, no `gcloud`, no Docker on your machine. Cloud Run builds the container from your repo's Dockerfile.

---

## Prerequisites (one-time, all browser-based)

1. Google Cloud account with billing enabled
   ([console.cloud.google.com/billing](https://console.cloud.google.com/billing))
2. A GCP project — create one at [console.cloud.google.com/projectcreate](https://console.cloud.google.com/projectcreate)
3. Gemini API key — get free tier key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
4. Branch `redesign/behavioral-mirror` (or whichever has the Dockerfile) already pushed to GitHub

---

## Step 1 — Enable required APIs

In the GCP console, enable these APIs (one click each):

- **Cloud Run Admin API** — [console.cloud.google.com/apis/library/run.googleapis.com](https://console.cloud.google.com/apis/library/run.googleapis.com)
- **Cloud Build API** — [console.cloud.google.com/apis/library/cloudbuild.googleapis.com](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com)
- **Artifact Registry API** — [console.cloud.google.com/apis/library/artifactregistry.googleapis.com](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com)
- **Secret Manager API** — [console.cloud.google.com/apis/library/secretmanager.googleapis.com](https://console.cloud.google.com/apis/library/secretmanager.googleapis.com)

---

## Step 2 — Store Gemini API key in Secret Manager

1. Open [Secret Manager](https://console.cloud.google.com/security/secret-manager)
2. Click **+ CREATE SECRET**
3. Settings:
   - **Name:** `GEMINI_API_KEY`
   - **Secret value:** *paste your Gemini API key*
   - **Replication policy:** Automatic
4. Click **CREATE SECRET**

---

## Step 3 — Create Cloud Run service from GitHub

1. Open [Cloud Run](https://console.cloud.google.com/run)
2. Click **CREATE SERVICE**
3. Choose **Continuously deploy from a repository (source or function)**
4. Click **SET UP WITH CLOUD BUILD**
5. **Repository provider:** GitHub → authorize → select `dokumenhilangid-blip/drift`
6. **Branch:** `redesign/behavioral-mirror` (or `main` after merge)
7. **Build type:** **Dockerfile** (auto-detected from repo root)
8. Click **SAVE**

---

## Step 4 — Cloud Run UI Settings (exact values)

### Service name & region
| Field | Value |
|---|---|
| Service name | `drift` |
| Region | `asia-southeast2` (Jakarta) — closest to ID users |

### Authentication
| Field | Value |
|---|---|
| Authentication | **Allow unauthenticated invocations** (public webapp) |
| Ingress control | **All** |

### Container — General
| Field | Value |
|---|---|
| Container port | **8080** |
| CPU allocation | **CPU is only allocated during request processing** (cheaper, scale-to-zero) |
| Startup CPU boost | **Enabled** (faster cold starts) |

### Container — Resources
| Field | Value |
|---|---|
| Memory | **512 MiB** |
| CPU | **1** |
| Request timeout | **60 seconds** |
| Maximum concurrent requests per instance | **80** |
| Execution environment | **Second generation** |

### Scaling
| Field | Value |
|---|---|
| Minimum instances | **0** (scale to zero — free tier friendly) |
| Maximum instances | **3** |

### Health checks (liveness probe)
Click **+ ADD HEALTH CHECK**:

| Field | Value |
|---|---|
| Probe type | **HTTP** |
| Path | `/api/health` |
| Port | `8080` |
| Initial delay | `5` seconds |
| Period | `30` seconds |
| Timeout | `5` seconds |
| Failure threshold | `3` |

(Startup probe is auto-handled by Cloud Run via container port readiness.)

### Variables & Secrets
Add the following:

**Environment variables (plain):**
| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `NEXT_TELEMETRY_DISABLED` | `1` |

**Reference a Secret:**
| Variable name | Secret | Version |
|---|---|---|
| `GEMINI_API_KEY` | `GEMINI_API_KEY` | `latest` |

> Cloud Run will prompt you to grant the Cloud Run service account access to the secret — click **GRANT** when asked.

---

## Step 5 — Deploy

Click **CREATE**. Cloud Build will:
1. Pull source from GitHub
2. Build the Dockerfile (3 stages, ~3–5 min first time)
3. Push the image to Artifact Registry
4. Deploy to Cloud Run

When done, you'll get a URL like:
```
https://drift-xxxxxxxxxx-et.a.run.app
```

---

## Step 6 — Verify

In your browser, hit:

```
https://YOUR_URL/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "drift",
  "timestamp": "2026-05-16T...",
  "gemini_configured": true
}
```

If `gemini_configured: false` — the secret reference didn't bind. Edit the service, re-add the secret reference, redeploy.

Then visit the root URL to use the app.

---

## Quick reference — answers to your questions

| Question | Answer |
|---|---|
| **1. Cloud Run UI settings** | See Step 4 above |
| **2. Environment variables** | `GEMINI_API_KEY` (from Secret Manager), `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1` |
| **3. Build settings** | Build type: **Dockerfile**. Source: GitHub repo, branch `redesign/behavioral-mirror`. Cloud Build does it automatically |
| **4. Runtime settings** | 2nd gen runtime, 512 MiB / 1 CPU, request-only billing, 60s timeout, min 0 / max 3 instances |
| **5. Startup command** | None needed — `Dockerfile`'s `CMD ["node", "server.js"]` handles it |
| **6. Port** | **8080** (Cloud Run default; `Dockerfile` exposes it; `server.js` reads `$PORT`) |

---

## Continuous deployment

Once configured, every push to `redesign/behavioral-mirror` (or whichever branch you selected) auto-triggers a Cloud Build → new Cloud Run revision. Zero terminal involvement. Manage from the Cloud Run UI.

---

## Cost on free tier (HTTP triggers)

Cloud Run free tier (per month):
- 2 million requests
- 360,000 vCPU-seconds
- 180,000 GiB-seconds memory
- 1 GiB egress (North America-only free; outside has cost)

For Drift (low traffic, scale-to-zero, 512MB/1CPU), expect **$0/month** unless you blow past 2M requests.

Gemini 2.5 Flash free tier: 1500 requests/day, 1M tokens/min. Plenty for hackathon demo.

---

## Troubleshooting

**Build fails with "no Dockerfile found"**
→ Verify `Dockerfile` exists at repo root in the branch you selected.

**Service starts but `/api/health` returns 503 / "service unavailable"**
→ Check Cloud Run logs (the **LOGS** tab). If you see EADDRINUSE or no listener — verify container port is `8080` in service settings.

**`gemini_configured: false` in health response**
→ Secret reference not attached. Edit service → Variables & Secrets → Re-add `GEMINI_API_KEY` from Secret Manager → Save.

**Cold start > 5 seconds**
→ Enable **Startup CPU boost** (Step 4). If still slow, set min instances to 1 (costs ~$5/month).

**`/api/perceive` returns 500**
→ Either Gemini API key invalid, or you've hit free tier daily quota (1500/day). Check logs.
