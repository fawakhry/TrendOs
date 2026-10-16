/**
 * SERVER-67 — Cloudflare Durable Object replay ledger for HMAC mirror reads.
 * No binding/migration provisioned in repository or production. Fail closed
 * unless an owner-reviewed Durable Object binding and migration are deployed.
 * Atomic transaction prevents reuse of the same signed nonce during its TTL.
 */
export class MirrorServiceNonceGuardV1 {
  constructor(state) { this.state = state; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/consume') {
      return new Response(null,{status:404});
    }
    let body;
    try { body = await request.json(); } catch { return new Response(null,{status:400}); }
    const scope = body && body.scope;
    const nonce = body && body.nonce;
    const validUntil = body && Number(body.validUntil);
    if (!['trendos_mirror_metadata','trendos_mirror_parity'].includes(scope) ||
        !/^[A-Za-z0-9_-]{22,64}$/.test(nonce || '') ||
        !Number.isSafeInteger(validUntil) ||
        validUntil < Date.now() ||
        validUntil > Date.now() + 60000) {
      return new Response(null,{status:400});
    }
    const id = 'nonce:' + scope + ':' + nonce;
    const result = await this.state.storage.transaction(async tx => {
      if (await tx.get(id) !== undefined) return 409;
      await tx.put(id, validUntil);
      return 200;
    });
    if (result === 200) {
      const previous = await this.state.storage.getAlarm();
      if (previous === null || previous > Date.now() + 60000) {
        await this.state.storage.setAlarm(Date.now() + 60000);
      }
    }
    return new Response(null,{status:result});
  }
  async alarm() {
    const now = Date.now();
    const entries = await this.state.storage.list({prefix:'nonce:'});
    for (const [key, expires] of entries) {
      if (!Number.isSafeInteger(expires) || expires <= now) await this.state.storage.delete(key);
    }
    const rest = await this.state.storage.list({prefix:'nonce:', limit:1});
    if (rest.size) await this.state.storage.setAlarm(now + 60000);
  }
}
