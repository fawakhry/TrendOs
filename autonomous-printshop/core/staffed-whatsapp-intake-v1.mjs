/* AP-127 — Staffed WhatsApp printshop intake classification, pure SOURCE_ONLY.
 * Neither reads WhatsApp messages/local Windows folders nor sends approvals,
 * dispatches printers, updates TrendOS, or authenticates external receipts.
 * All state assertions are caller supplied. Protected host must verify them.
 */
import {qualifyDesignApprovalReceiptV1} from './design-approval-receipt-v1.mjs';

export const STAFFED_WHATSAPP_INTAKE_VERSION='AP127_STAFFED_WHATSAPP_INTAKE_V1';
const TYPES=new Set(['CUSTOM_DESIGN','PHOTO_ASSEMBLY','PRINT_READY']);
const AREAS=new Set(['ديجتال','فوتو']);
const HEX64=/^[a-f0-9]{64}$/;
const txt=v=>typeof v==='string'?v.trim():'';
const hasHash=v=>HEX64.test(txt(v).toLowerCase());

function dateFolder(raw){
  const iso=txt(raw);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
  const date=new Date(iso+'T00:00:00.000Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==iso)return '';
  const [y,m,d]=iso.split('-');
  return String(Number(d))+'-'+String(Number(m))+'-'+y;
}
function response(status,context){
  return {
    version:STAFFED_WHATSAPP_INTAKE_VERSION,
    status,
    approvalGate:context.approvalGate,
    explicitStaffClassificationRequired:true,
    approvalSourceIndependentlyVerified:false,
    customerApprovalGrantedByThisModule:false,
    humanPrintHandoffCandidate:status==='MANUAL_PRINT_REVIEW_CANDIDATE',
    // Distinct from any verified production authority.
    productionReady:false,
    assignmentAllowed:false,
    operatorTaskActivationAllowed:false,
    productionWriteAllowed:false,
    readinessWriteAllowed:false,
    whatsappSendAllowed:false,
    automaticWhatsappDownloadAllowed:false,
    localFilesWritten:false,
    // Only public, non-client folder components. Customer subfolder remains private.
    dayFolder:context.dayFolder,
    areaFolder:context.areaFolder,
    customerFolderExposed:false,
    localPathExposed:false,
    orderOrLineIdExposed:false
  };
}

export function classifyStaffedWhatsappIntakeV1(input={}){
  const data=input && typeof input==='object'?input:{};
  try {
    const type=txt(data.workType);
    const areaFolder=txt(data.workArea);
    const dayFolder=dateFolder(data.workDay);
    // An explicit customer's request to see a proof ALWAYS overrides an
    // ordinary assembly or ready-print shortcut. Missing classification
    // is never auto-inferred from an order title or photo content.
    const approvalGate=type==='CUSTOM_DESIGN'||data.customerProofRequested===true
      ?'CUSTOMER_APPROVAL_REQUIRED':'NO_CUSTOMER_APPROVAL_BY_STAFF_POLICY';
    const ctx={approvalGate,dayFolder,areaFolder};
    const block=reason=>response(reason,ctx);

    if(data.staffClassified!==true||!TYPES.has(type))
      return block('STAFF_WORK_TYPE_CLASSIFICATION_REQUIRED');
    if(!dayFolder)return block('WORKDAY_DATE_UNVERIFIED');
    if(!AREAS.has(areaFolder))return block('WORK_AREA_FOLDER_UNVERIFIED');
    if(data.whatsappMediaSavedLocally!==true)
      return block('WHATSAPP_MEDIA_LOCAL_DOWNLOAD_REQUIRED');
    if(data.orderInstructionsReviewed!==true)
      return block('STAFF_ORDER_INSTRUCTIONS_REVIEW_REQUIRED');
    if(data.finalFileSavedLocally!==true||!hasHash(data.finalFileSha256))
      return block('FINAL_PRINT_FILE_VERSION_REQUIRED');
    if(data.printPreflightResult!=='PASS')
      return block('PRINT_PREFLIGHT_NOT_PASS');

    const finalSha=txt(data.finalFileSha256).toLowerCase();
    if(approvalGate==='CUSTOMER_APPROVAL_REQUIRED'){
      if(data.designOrProofPrepared!==true)
        return block('CUSTOM_PROOF_NOT_PREPARED');
      if(data.proofSentToCustomer!==true)
        return block('CUSTOMER_PROOF_NOT_SENT');
      // The WhatsApp proof may be compressed, watermarked or exported as
      // different bytes. Match the immutable ARTWORK REVISION instead of
      // demanding that preview and print-file binary hashes are identical.
      // This is still a STAFF/HOST assertion until trusted source validation.
      if(!hasHash(data.proofSha256))
        return block('PROOF_FILE_HASH_REQUIRED');
      if(!hasHash(data.designRevisionSha256)||
         !hasHash(data.proofRevisionSha256)||
         txt(data.designRevisionSha256).toLowerCase()!==
           txt(data.proofRevisionSha256).toLowerCase()||
         data.proofFinalArtworkMatchConfirmed!==true)
        return block('PROOF_FINAL_ARTWORK_REVISION_UNVERIFIED');

      // WhatsApp emoji/text, a checkbox or a staff statement is not an
      // independently authenticated receipt for exactly this revision.
      const receipt=data.customerApprovalReceipt;
      if(!receipt)return block('AWAITING_CUSTOMER_APPROVAL_RECEIPT');
      if(txt(receipt.lineId)!==txt(data.privateLineId)||!txt(data.privateLineId))
        return block('CUSTOMER_APPROVAL_SAME_LINE_UNVERIFIED');
      if(txt(receipt.subjectSha256).toLowerCase()!==finalSha)
        return block('CUSTOMER_APPROVAL_REVISION_MISMATCH');
      const qualified=qualifyDesignApprovalReceiptV1({
        ...receipt,
        artifactExists:receipt.artifactExists===true,
        artifactLineMatches:receipt.artifactLineMatches===true,
        artifactHashMatches:receipt.artifactHashMatches===true
      });
      if(!qualified.qualified||qualified.approvalState!=='CUSTOMER_APPROVED'||
         qualified.actorKind!=='CUSTOMER')
        return block('CUSTOMER_APPROVAL_RECEIPT_NOT_QUALIFIED');
      // Positive here is a conditional policy candidate only. Never
      // authenticate caller-provided receipts within this module.
      return block('MANUAL_PRINT_REVIEW_CANDIDATE');
    }

    // PHOTO_ASSEMBLY and PRINT_READY require explicit staff verification of
    // the final file; no customer consent is invented or needed by default.
    if(data.staffFinalFileReviewed!==true)
      return block('STAFF_FINAL_FILE_REVIEW_REQUIRED');
    return block('MANUAL_PRINT_REVIEW_CANDIDATE');
  }catch{
    const defaultCtx={approvalGate:'UNVERIFIED',dayFolder:'',areaFolder:''};
    return response('INTAKE_INPUT_UNVERIFIED',defaultCtx);
  }
}
