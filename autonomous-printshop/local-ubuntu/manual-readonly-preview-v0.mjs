#!/usr/bin/env node
/**
 * Manual local Linux-only PROCESS METRICS preview; NOT a daemon/agent/bridge.
 * This script is source-only until deliberately installed and explicitly run
 * on an approved host. No commands are spawned, no files/network are opened.
 *
 * node autonomous-printshop/local-ubuntu/manual-readonly-preview-v0.mjs --help
 * node autonomous-printshop/local-ubuntu/manual-readonly-preview-v0.mjs --preview-local
 */
import os from 'node:os';
import {reviewReadOnlyLocalProcessMetricsV0}
 from './read-only-process-preview-v0.mjs';

const args=process.argv.slice(2);
if(args.length===1&&args[0]==='--help'){
 process.stdout.write('LOCAL_PREVIEW_V0: --help or --preview-local (manual opt-in, no network/print/OS commands); NOT DEPLOYED / NO_GO\n');
}else if(args.length===1&&args[0]==='--preview-local'){
 // ONLY these 4 node:os getters are read. No hostname, env, users, addresses,
 // disk, logs, ports, printer queues, auth tokens or process listings.
 const preview=reviewReadOnlyLocalProcessMetricsV0({
  platform:os.platform(),
  uptimeSeconds:os.uptime(),
  totalMemoryBytes:os.totalmem(),
  freeMemoryBytes:os.freemem(),
 });
 process.stdout.write(JSON.stringify(preview)+'\n');
 if(preview.status!=='LOCAL_LINUX_UNSIGNED_PREVIEW_NOT_PRODUCTION_PROOF')
  process.exitCode=2;
}else{
 process.stderr.write('LOCAL_PREVIEW_V0_NO_ACTION: provide --help or manual --preview-local; no host access performed.\n');
 process.exitCode=2;
}
