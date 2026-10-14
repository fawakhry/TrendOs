/* Local/offline only. No secrets, credentials, API requests, files or notifications.
 * Example: TRENDOS_ORDER_WATCH_OFFLINE=YES node tools/order-watch/run-offline.mjs < private-snapshot.json
 * Never commit or share input snapshots: they may contain customer data.
 */
import { analyzeOrderWatchSnapshot } from '../../cloudflare-d1/src/order-watch-agent-v0.mjs';
if (process.env.TRENDOS_ORDER_WATCH_OFFLINE !== 'YES') {
  process.stderr.write('OFF_SOURCE_ONLY: set TRENDOS_ORDER_WATCH_OFFLINE=YES for an offline synthetic/private authorized input.\n');
  process.exitCode = 2;
} else {
  try {
    let raw = '';
    for await (const chunk of process.stdin) {
      raw += chunk;
      if (raw.length > 2_000_000) throw new Error('INPUT_TOO_LARGE');
    }
    const payload = JSON.parse(raw);
    const report = analyzeOrderWatchSnapshot(payload);
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } catch (error) {
    process.stderr.write('Order Watch failed closed: ' + (error.code || 'INVALID_INPUT') + '\n');
    process.exitCode = 1;
  }
}
