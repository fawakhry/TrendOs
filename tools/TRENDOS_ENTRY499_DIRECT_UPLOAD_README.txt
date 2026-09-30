TrendOS T12 Entry499 - No-Wrangler Direct Upload

WHAT THIS PACKAGE DOES
- Validates the qualified Entry499 frontend locally.
- Uploads the static assets to Cloudflare using the official Workers Assets API.
- Creates a NEW VERSION of Worker: trendos-ui.
- Preserves the ASSETS binding.
- DOES NOT create a deployment.
- DOES NOT promote traffic.
- DOES NOT use Wrangler.
- DOES NOT change Secrets, Variables, D1, Orders, Customers, or the API Worker.

WHAT YOU NEED
1) Node.js 22 or newer installed.
2) Your Cloudflare Account ID.
3) A Cloudflare API Token with Workers Scripts Write permission.
   Do not paste the token into chat, GitHub, or any repo file.

HOW TO RUN ON WINDOWS
1) Extract this ZIP to a normal folder.
2) Double-click: RUN_ENTRY499_UPLOAD.cmd
3) The tool first performs a local dry-run.
4) Enter your Cloudflare Account ID.
5) Enter the API Token. The token input is hidden.
6) Type exactly: CREATE
7) Wait until you see:
   ENTRY499_VERSION_CREATED=YES
   VERSION_ID=...
   TRAFFIC_CHANGED=NO
   DEPLOYMENT_CREATED=NO

THEN STOP.
Do not deploy from the script.
Open Cloudflare Dashboard > trendos-ui > Deployments.
Confirm the new Version ID, then manually promote that version to 100%.

TARGET
Worker: trendos-ui
Frontend source: Entry499 qualified
API Worker trendos-d1-api: DO NOT TOUCH in this step.

SAFETY
The launcher removes the token/account environment variables when it exits.
The token is never written to a file by this package.
