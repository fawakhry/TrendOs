#!/usr/bin/env node
// ACC-185: source-only cross-repository EasyStore UI -> TrendOS Worker contract.
// NEVER calls frontend URLs, Cloudflare, D1, or production finance POST.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const PINNED_EASYSTORE_COMMIT = "373d06381594e3ab32a55009fcc74907b1c37c9c";
export const ACTIONS = Object.freeze([
  "saveEasyStorePurchaseV2",
  "saveEasyStoreSaleV2",
  "saveDeptDailyPurchaseV1917",
  "approveDeptDailyPurchasesV1917",
  "closePurchaseCustodyV1920",
  "reverseApprovedPurchaseV1920",
  "getDailyDepartmentReportV1920",
  "closeDepartmentDayV1920",
  "saveCustomerAccountMovementV1915",
  "runAccountingDayAutomationV1921",
]);

export class ContractStop extends Error {}

function need(ok, tag) {
  if (!ok) throw new ContractStop("ACC185_STOP_" + tag);
}

export function checkContract(frontend, worker, expectedActions=ACTIONS) {
  need(typeof frontend === "string" && typeof worker === "string", "SOURCE_NOT_TEXT");
  need(Array.isArray(expectedActions) && expectedActions.length === ACTIONS.length, "ACTION_COUNT_CHANGED");
  need(new Set(expectedActions).size === ACTIONS.length, "ACTION_DUPLICATE");
  need(expectedActions.every((action,i) => action === ACTIONS[i]), "ACTION_LIST_CHANGED");
  for (const action of expectedActions) {
    need(frontend.includes(action), "FRONTEND_ACTION_MISSING_" + action);
    need(worker.includes("action==='" + action + "'"),
         "BACKEND_DISPATCH_MISSING_" + action);
  }
  need(worker.includes("function approvedAccountingModeV1(env,verifiedUsername,user)"),
       "VERIFIED_ROLE_GUARD_MISSING");
  need(worker.includes("if(mode==='none')"), "DENY_UNKNOWN_FINANCE_ROLE_MISSING");
  return {
    schema: "ACC185_EASYSTORE_TRENDOS_G4_OFFLINE_ACTION_CONTRACT_V1",
    pinned_easystore_git_commit: PINNED_EASYSTORE_COMMIT,
    checked_actions: [...ACTIONS],
    action_count: ACTIONS.length,
    frontend_sha256: crypto.createHash("sha256").update(frontend).digest("hex"),
    worker_sha256: crypto.createHash("sha256").update(worker).digest("hex"),
    original_worker_dispatch_actions_found: true,
    verified_role_source_guard_found: true,
    frontend_tests_run_evidence: "MUST_CONFIRM_SEPARATE_GITHUB_ACTIONS_JOB",
    finance_supplier_purchase_sale_stock_cashbox_debt_custody_day_close:
      "SYNTHETIC_OR_SOURCE_TESTS_ONLY",
    actual_refund_and_customer_return_acceptance: "NOT_TESTED_LIVE",
    owner_authorized_staff_roles: false,
    original_real_custody_close_acceptance: false,
    real_financial_operating_acceptance: false,
    real_production_worker_version_verified: false,
    release_decision: "NO_GO",
    production_changes: 0,
  };
}

function gitSha(root) {
  return execFileSync("git", ["-C", root, "rev-parse", "HEAD"],
                      {encoding:"utf8"}).trim();
}

function main() {
  const [frontendRoot, outputPath, trendRoot=process.cwd()] = process.argv.slice(2);
  need(Boolean(frontendRoot && outputPath), "ARGS_FRONTEND_ROOT_OUTPUT_REQUIRED");
  need(gitSha(frontendRoot) === PINNED_EASYSTORE_COMMIT, "EASYSTORE_SOURCE_COMMIT_DRIFT");
  const frontend = fs.readFileSync(path.join(frontendRoot,"app.js"),"utf8");
  const worker = fs.readFileSync(
    path.join(trendRoot,"cloudflare-d1/src/employee-accounting-native-v1.mjs"),"utf8");
  const receipt=checkContract(frontend,worker);
  receipt.trendos_checkout_git_sha=gitSha(trendRoot);
  need(/^[a-f0-9]{40}$/.test(receipt.trendos_checkout_git_sha), "TRENDOS_INVALID_SHA");
  fs.mkdirSync(path.dirname(outputPath),{recursive:true});
  fs.writeFileSync(outputPath,JSON.stringify(receipt,null,2)+"\n");
  console.log("ACC185_EASYSTORE_PINNED_GIT_SOURCE=PASS");
  console.log("ACC185_TRENDOS_WORKER_FRONTEND_ACTION_CONTRACT_10_OF_10=PASS");
  console.log("ACC185_SOURCE_ROLE_GUARD=PASS");
  console.log("ACC185_G4_REAL_ACCEPTANCE=NOT_TESTED");
  console.log("ACC185_RELEASE_DECISION=NO_GO");
  console.log("ACC185_PRODUCTION_MUTATIONS=ZERO");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(); }
  catch (err) { console.error(String(err)); process.exitCode=1; }
}
