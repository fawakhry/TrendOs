// SOURCE_ONLY / DEFAULT_OFF. An environment flag is not an approval artifact.
// Only use after separate owner approval, Access perimeter verification and least-privilege Service Auth policy.
import {verifyProtectedOwnerConsoleV1} from './owner-console-protected-postdeploy-v1.mjs';

export const OWNER_CONSOLE_PROTECTED_RELEASE_GATE_VERSION = 'AP093_OWNER_CONSOLE_PROTECTED_RELEASE_GATE_V1';
function blocked(code) {
  return {success:false,status:'BLOCKED_SAFE',code,version:OWNER_CONSOLE_PROTECTED_RELEASE_GATE_VERSION};
}
function credentialOk(v) {
  return typeof v === 'string' && v.length > 3 && v.trim() === v && !/[\r\n]/.test(v);
}

// No Cloudflare/GitHub reads or network calls are made unless every required setting exists.
// Caller has to verify owner approval OUTSIDE the process; values alone do not confer authorization.
export async function verifyApprovedProtectedReleaseV1({env = {}, verifier = verifyProtectedOwnerConsoleV1} = {}) {
  if (env.AP_OWNER_CONSOLE_ACCESS_VERIFY_MODE !== 'PROTECTED') return blocked('PROTECTED_VERIFY_DISABLED');
  if (env.AP_OWNER_CONSOLE_RELEASE_APPROVED !== 'YES') return blocked('OWNER_APPROVAL_NOT_CONFIRMED');
  if (!credentialOk(env.CF_ACCESS_CLIENT_ID) || !credentialOk(env.CF_ACCESS_CLIENT_SECRET)) {
    return blocked('SERVICE_AUTH_NOT_CONFIGURED');
  }
  if (typeof verifier !== 'function') return blocked('VERIFIER_UNAVAILABLE');
  try {
    const result = await verifier({
      clientId:env.CF_ACCESS_CLIENT_ID,
      clientSecret:env.CF_ACCESS_CLIENT_SECRET
    });
    if (result?.success === true && result.status === 'PROTECTED_READ_VERIFIED' && result.checked === 9) {
      return {success:true,status:'PROTECTED_RELEASE_VERIFIED',checked:9,
        version:OWNER_CONSOLE_PROTECTED_RELEASE_GATE_VERSION};
    }
    return blocked('PROTECTED_VERIFICATION_FAILED');
  } catch {
    return blocked('VERIFIER_ERROR');
  }
}
