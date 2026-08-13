# Environment Variables & Integration Caveats

## Required Frontend Environment Variables
To successfully authenticate and connect to the backend, the frontend `.env` must be configured with Clerk and the API URL.

```env
# URL for the deployed backend (or http://127.0.0.1:8000 for local dev)
NEXT_PUBLIC_API_BASE_URL=https://e2e-backend-4t9p.onrender.com/api/v1

# Clerk configuration
# These keys are safe to expose to the client (browser)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cHVtcGVkLXF1YWlsLTg3LmNsZXJrLmFjY291bnRzLmRldiQ
NEXT_PUBLIC_CLERK_FRONTEND_API_URL=https://pumped-quail-87.clerk.accounts.dev

# IMPORTANT: If your frontend uses Server-Side Rendering (like Next.js API routes or SSR),
# you will also need the Secret Key. NEVER prefix this with NEXT_PUBLIC_ or expose it to the client.
CLERK_SECRET_KEY=sk_test_dWxujIgJaDQUn5KnCQMQ4QFegDFpCLzCZt3yJj7Bax
```

## CORS Configuration
The backend currently accepts requests from:
- `https://yourfrontend.com` (Update this in the backend `.env` `CORS_ALLOWED_ORIGINS` when the real frontend domain is known)
- `http://localhost:3000` (or whichever local port the frontend uses)
- `http://127.0.0.1`

## Integration Caveats & Expected Behaviors

1. **Free-Tier "Cold Start" Delays**:
   - The backend is hosted on Render's free tier, and the production database is on Neon's serverless free tier.
   - If the backend is inactive for 15+ minutes, Render spins down the instance. The first subsequent API request will take **up to 30-50 seconds** to wake up.
   - **Frontend Action**: Implement robust loading states and longer timeout configurations (at least 60 seconds) to gracefully handle these cold starts without showing an error to the user immediately.

2. **File Storage Latency (Backblaze B2)**:
   - File attachments are served from a Backblaze B2 bucket (e.g., in `eu-central-003`).
   - For users in Asia or other regions, downloading or viewing images/PDFs may have a 200-300ms latency.
   - **Frontend Action**: Use optimistic UI updates and loading skeletons for images and attachments.

3. **No Direct S3 Presigned URLs for Uploads**:
   - The MVP currently expects file uploads via `multipart/form-data` directly to the backend, which proxies the upload to Backblaze. We are not doing direct client-to-B2 uploads via presigned URLs yet.
