import { buildSharedContextPacket, routeMessage, validateCase } from './orchestrator-core.mjs';
import { persistCaseWithAdapters } from './storage-adapters.mjs';
import { validateProviderResponse } from './providers.mjs';

export async function runOrchestrationTurn({
  userRequest,
  caseData,
  providers,
  caseStore,
  assetStore,
  providerExecutor = null,
  auditStore = null,
  actor = null,
} = {}) {
  const validation = validateCase(caseData);
  if (!validation.valid) return { ok: false, stage: 'VALIDATION', validation };

  const routing = routeMessage(userRequest);
  const outputs = [];
  const errors = [];

  for (const recipient of routing.recipients) {
    const provider = providers?.[recipient];
    if (!provider || typeof provider.respond !== 'function') {
      errors.push(`missing provider: ${recipient}`);
      continue;
    }

    const packet = buildSharedContextPacket({ caseData, userRequest, target: recipient });
    try {
      const response = providerExecutor
        ? await providerExecutor.execute({ providerName: recipient, provider, packet })
        : await provider.respond(packet);
      const providerValidation = validateProviderResponse(response, recipient);
      if (!providerValidation.valid) {
        errors.push(...providerValidation.errors);
        continue;
      }
      outputs.push(response);
    } catch (error) {
      errors.push(`${recipient}: ${error?.code || 'PROVIDER_ERROR'}: ${error?.message || 'unknown error'}`);
    }
  }

  const persistence = await persistCaseWithAdapters({ caseData, caseStore, assetStore });
  if (!persistence.ok) return { ok: false, stage: 'PERSISTENCE', routing, outputs, errors, persistence };

  const auditEntry = {
    action: 'ORCHESTRATION_TURN',
    tenant_id: persistence.case.tenant_id,
    branch_id: persistence.case.branch_id,
    case_id: persistence.case.case_id,
    mode: routing.mode,
    providers: outputs.map((x) => x.provider),
    provider_errors: errors,
    actor: actor || null,
  };
  await caseStore.appendAudit(auditEntry);
  if (auditStore && typeof auditStore.append === 'function') await auditStore.append(auditEntry);

  return {
    ok: errors.length === 0,
    stage: errors.length ? 'PARTIAL_PROVIDER_RESULT' : 'COMPLETED',
    routing,
    outputs,
    errors,
    persistence,
    authority: 'ADVISORY_ONLY',
  };
}
