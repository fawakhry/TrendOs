TrendOS Orders Refresh Recovery - Frontend-only Version Package

QUALIFIED SOURCE
98cc788f0f1cbde9e2404feb1a0c7ca6ad9f2051

TARGET
Worker: trendos-ui

WHAT IT DOES
- Validates config.js contains 20261001-post-refresh-recovery.
- Validates trendos-edge-orders-read-v1.js contains recoverPostWriteBarrier and postWriteBarrierRecoveries.
- Uploads static frontend assets to the existing trendos-ui Worker Assets store.
- Creates a NEW Worker VERSION only.
- Does NOT create a deployment.
- Does NOT promote traffic.

WHAT IT NEVER TOUCHES
- trendos-d1-api
- D1 data or migrations
- Apps Script
- Secrets, Variables, Routes, Custom Domains
- Order IDs, statuses, customers, production business data

WINDOWS
1. Extract the artifact ZIP.
2. Double-click RUN_ENTRY546_UPLOAD.cmd.
3. Enter Cloudflare Account ID.
4. Enter API Token with Workers Scripts Write permission. Input is hidden and is not written to disk.
5. Type CREATE.
6. Wait for:
   ENTRY546_VERSION_CREATED=YES
   VERSION_ID=...
   TRAFFIC_CHANGED=NO
   DEPLOYMENT_CREATED=NO
7. STOP and send the VERSION_ID for review. Do not promote it yet.
