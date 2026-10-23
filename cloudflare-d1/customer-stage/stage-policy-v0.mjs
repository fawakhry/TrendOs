/* Source-only Stage metadata, NOT exported by the Cloudflare Worker entrypoint.
 * The workerd module entry export namespace may contain only handler/DO class
 * exports, never arbitrary string or frozen-object constants.
 */
export const CUSTOMER_STAGE_WORKER_SOURCE_VERSION_V0='CUSTOMER_STAGE_WORKER_OFF_V0_20261024';
export const CUSTOMER_STAGE_POLICY_V0=Object.freeze({
  sourceOnly:true,defaultEnabled:false,independentWorker:true,
  productionEntrypointChanged:false,productionDbBinding:false,
  stagedIdentityProvisioned:false,customerLoginRateGateBound:false,
  deployed:false,googleFallback:false,customerMasterMigration:false,
  customerOrderWriterCreated:false,liveGoogleRetiredCount:0
});
