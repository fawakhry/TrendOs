#!/usr/bin/env node
// BOOK24: local manifest-only, zero network, no secrets. Exit 2 means BLOCKED.
import fs from 'node:fs';
import {qualifyBook24TaskWriterHandoffV1} from '../autonomous-printshop/core/book24-task-writer-cutover-preflight-v1.mjs';
if(process.argv.length!==3){
  process.stderr.write('Usage: node scripts/book24-task-writer-cutover-check-v1.mjs <sanitized-offline-manifest.json>\\n');
  process.exitCode=64;
}else{
  try{
    const manifest=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
    const report=qualifyBook24TaskWriterHandoffV1(manifest);
    process.stdout.write(JSON.stringify(report,null,2)+'\\n');
    process.exitCode=report.configurationConsistent?0:2;
  }catch(e){
    process.stdout.write(JSON.stringify({
      version:'BOOK24_TASK_WRITER_CUTOVER_PREFLIGHT_V1',
      currentDisposition:'BLOCKED',
      activationCertified:false,activationPerformed:false,productionVerified:false,
      blockers:['MANIFEST_READ_OR_PARSE_FAILED']
    })+'\\n');
    process.exitCode=2;
  }
}
