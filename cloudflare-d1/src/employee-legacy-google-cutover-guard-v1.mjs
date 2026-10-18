/* Zero Google employee legacy upstream cutover (source-only).
 * Native auth issuance continues to use its own strict 'true' toggle.
 * This guard only prevents accidental Google fallback if an operator sets
 * a malformed nonempty cutover flag. It does NOT authorize Native sign-in.
 */
export function employeeLegacyGoogleUpstreamDisabled(env={}){
  const raw=String(env?.TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1??'').trim().toLowerCase();
  // Only absent/explicitly-off flags retain the old Google transport.
  // A typo like "tru" must not silently re-enable employee credentials to
  // the legacy upstream; customers have a separate migration boundary.
  return !!raw&&!['0','false','no','off'].includes(raw);
}
