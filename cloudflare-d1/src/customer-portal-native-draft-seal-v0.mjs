/* Entry682 — source-only internal D1 draft seal, NOT a public route.
 * One INSERT...SELECT statement takes a coherent SQL snapshot and installs
 * the immutable seal. Database triggers block all later staging mutations.
 * This is NOT a T12 official writer, file-body verification, or authorization
 * for a customer to submit an order. No production/staging activation.
 */
export const CUSTOMER_DRAFT_SEAL_VERSION_V0='ENTRY682_CUSTOMER_DRAFT_SEAL_SOURCE_ONLY_OFF_V0';
export const CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0=`
INSERT OR IGNORE INTO customer_portal_native_draft_seals_v1
 (draft_id,customer_id,t12_request_key,snapshot_json,sealed_at_ms,stage)
SELECT d.draft_id,a.customer_id,
  ('cld1_' || CAST(d.created_at_ms AS TEXT) || '_' || substr(d.draft_id,5)),
  json_array(
    'ENTRY682_CUSTOMER_DRAFT_SEAL_V1',
    d.draft_id,a.customer_id,c.customer_name,c.phone,d.created_at_ms,
    json((SELECT COALESCE(json_group_array(json_array(
      item_id,ordinal,department,item_name,qty,notes,heat_press,fly_print
    )),'[]') FROM (SELECT item_id,ordinal,department,item_name,qty,notes,
      heat_press,fly_print FROM customer_portal_native_draft_items_v1
      WHERE draft_id=d.draft_id ORDER BY ordinal ASC))),
    json((SELECT COALESCE(json_group_array(json_array(
      file_id,item_id,content_type,byte_size,sha256_hex,r2_object_key,
      created_at_ms,updated_at_ms
    )),'[]') FROM (SELECT file_id,item_id,content_type,byte_size,
      sha256_hex,r2_object_key,created_at_ms,updated_at_ms
      FROM customer_portal_native_draft_files_v1
      WHERE draft_id=d.draft_id ORDER BY item_id,file_id)))
  ),?,
  'SEALED'
  FROM customer_portal_native_drafts_v1 d
  JOIN customer_portal_native_accounts_v1 a ON a.customer_id=d.customer_id
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_sessions_v1 s ON s.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE d.draft_id=? AND d.state='DRAFT'
   AND s.token_fingerprint_hex=? AND s.source='d1-customer-native'
   AND s.revoked_at_ms IS NULL
   AND s.issued_at_ms>0 AND s.issued_at_ms<=?
   AND s.expires_at_ms>? AND s.expires_at_ms>s.issued_at_ms
   AND s.expires_at_ms-s.issued_at_ms<=28800000
   AND s.session_version=a.session_version
   AND a.state='ACTIVE' AND a.must_change=0
   AND a.password_scheme='pbkdf2-sha256-v1'
   AND a.password_iterations=100000
   AND length(trim(a.verified_enrollment_ref))>0
   AND c.active='نعم' AND c.source='cloud-native'
   AND trim(coalesce(c.legacy_chat_code,''))=a.portal_code
   AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
   AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
   AND NOT EXISTS(SELECT 1 FROM t12_customers other
     WHERE other.customer_id<>a.customer_id AND other.active='نعم'
       AND trim(coalesce(other.legacy_chat_code,''))=a.portal_code)
   AND NOT EXISTS(SELECT 1 FROM t12_prod_request_ledger l
     WHERE l.request_key=('cld1_' || CAST(d.created_at_ms AS TEXT) || '_' || substr(d.draft_id,5)))
   AND (SELECT COUNT(*) FROM customer_portal_native_draft_items_v1 i
        WHERE i.draft_id=d.draft_id) BETWEEN 1 AND 50
   AND (SELECT MIN(i.ordinal) FROM customer_portal_native_draft_items_v1 i
        WHERE i.draft_id=d.draft_id)=1
   AND (SELECT MAX(i.ordinal) FROM customer_portal_native_draft_items_v1 i
        WHERE i.draft_id=d.draft_id)=
       (SELECT COUNT(*) FROM customer_portal_native_draft_items_v1 i WHERE i.draft_id=d.draft_id)
   AND (SELECT COUNT(*) FROM customer_portal_native_draft_files_v1 f
        WHERE f.draft_id=d.draft_id)<=250
   AND NOT EXISTS(
      SELECT 1 FROM customer_portal_native_draft_files_v1 f
      LEFT JOIN customer_portal_native_draft_items_v1 i ON i.item_id=f.item_id
      WHERE f.draft_id=d.draft_id AND
        (f.state<>'READY' OR f.customer_id<>d.customer_id OR i.item_id IS NULL
         OR i.draft_id<>d.draft_id OR
         f.r2_object_key<>'customer-drafts/' || f.file_id))
   AND NOT EXISTS(
     SELECT 1 FROM customer_portal_native_draft_files_v1 f
      WHERE f.draft_id=d.draft_id GROUP BY f.item_id HAVING COUNT(*)>5)
`;
export const CUSTOMER_DRAFT_SEAL_SCOPED_READBACK_SQL_V0=`
SELECT seal.draft_id AS draftId,seal.customer_id AS customerId,
       seal.t12_request_key AS t12RequestKey,
       seal.snapshot_json AS snapshotJson,seal.stage AS sealStage
 FROM customer_portal_native_draft_seals_v1 seal
 JOIN customer_portal_native_drafts_v1 d ON d.draft_id=seal.draft_id
 JOIN customer_portal_native_accounts_v1 a ON a.customer_id=seal.customer_id
 JOIN customer_portal_native_sessions_v1 s ON s.customer_id=a.customer_id
 WHERE seal.draft_id=? AND d.customer_id=seal.customer_id
   AND s.token_fingerprint_hex=? AND s.source='d1-customer-native'
   AND s.revoked_at_ms IS NULL AND s.issued_at_ms>0 AND s.issued_at_ms<=?
   AND s.expires_at_ms>? AND s.expires_at_ms>s.issued_at_ms
   AND s.expires_at_ms-s.issued_at_ms<=28800000
   AND s.session_version=a.session_version AND a.state='ACTIVE'
 LIMIT 1
`;
// Do not export an HTTP handler or a signer. This SQL can ONLY be wired after
// separate owner-approved delegation, staged auth/OTP and rollback evidence.
export const CUSTOMER_DRAFT_SEAL_POLICY_V0=Object.freeze({
 sourceOnly:true,workerEntryWired:false,httpRouteAvailable:false,
 internalAuthorizerAvailable:false,productionSealInsertAuthorized:false,
 sealUsesSingleSqlInsertSelect:true,d1TriggersBlockDraftMutation:true,
 t12OfficialOrderWriterCalled:false,r2BodyHashVerified:false,
 immutableDraftSnapshotAfterSealing:true,productionRelease:'NO_GO'
});
