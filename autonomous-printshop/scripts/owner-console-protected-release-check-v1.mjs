// Opt-in, GET-only CLI. NOT WIRED TO PRODUCTION DEPLOY OR GITHUB WORKFLOWS.
import {verifyApprovedProtectedReleaseV1} from '../core/owner-console-protected-release-gate-v1.mjs';

const result = await verifyApprovedProtectedReleaseV1({env:process.env});
// Fixed status only: never log environment variables, credentials, request URLs, or response bodies.
console.log('OWNER_CONSOLE_PROTECTED_RELEASE='+(result.success?'PASS':'BLOCKED_SAFE'));
console.log('OWNER_CONSOLE_PROTECTED_RELEASE_REASON='+(result.success?'PROTECTED_READ_VERIFIED':result.code));
if (!result.success) process.exitCode=1;
