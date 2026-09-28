/* TrendOS T12 — Cloud-native Orders read overlay.
 * Read-only: SELECTs from t12_prod_* and merges those rows with the existing
 * qualified Sheets mirror. No D1 mutation, no Sheets write, no CREATE authority.
 */

function text(value) { return String(value == null ? '' : value).trim(); }

function isHeatPress(value) {
  const v = text(value).toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'نعم' || v === 'مكبس';
}


function normalizeArabic(value) {
  return text(value).toLowerCase()
    .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي').replace(/[ةه]/g, 'ه').replace(/\s+/g, ' ').trim();
}

function searchKey(value) {
  return normalizeArabic(value).replace(/[^0-9a-z\u0600-\u06ff ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function hiddenStatus(status) {
  return ['جاهز للاستلام','تم التسليم','مكرر','تم التنفيذ','جاهز للطباعة','ملغى','ملغي'].includes(text(status));
}

export function filterT12OverlayRows(rows, params = {}) {
  const q = searchKey(params.query || params.q || '');
  const status = text(params.statusFilter || params.status || '');
  const priority = text(params.priorityFilter || params.priority || '');
  const heat = text(params.heatPressFilter || '');

  return (rows || []).filter((row) => {
    if (q) {
      const blob = searchKey([
        row.orderId,row.lineId,row.customer,row.customerPhone,row.department,row.itemName,row.notes
      ].join(' '));
      if (!blob.includes(q)) return false;
    }
    if (heat === 'only' && !isHeatPress(row.heatPress)) return false;
    if (heat === 'without' && isHeatPress(row.heatPress)) return false;
    if (status === '__ACTIVE__' && hiddenStatus(row.status)) return false;
    if (status === '__READY_PICKUP__' && !['جاهز للاستلام','في قسم التسليمات','تم التنفيذ'].includes(text(row.status))) return false;
    if (status === '__CANCELLED__' && !['ملغي','ملغى'].includes(text(row.status))) return false;
    if (status === '__OVERDUE__' && text(row.overdue) !== 'نعم') return false;
    if (status === '__DEBT__') return false;
    if (status && !status.startsWith('__') && text(row.status) !== status) return false;
    if (priority === '__ACTIVE__' && !['عاجل','عادي','VIP',''].includes(text(row.priority))) return false;
    if (priority && priority !== '__ACTIVE__' && text(row.priority) !== priority) return false;
    return true;
  });
}

function screenMatches(screen, department, heatPress) {
  const lane = text(screen) || 'service';
  const dept = text(department);
  if (lane === 'print') return dept === 'طباعة' || dept.includes('طباعة');
  if (lane === 'laser') return dept === 'ليزر' || dept.includes('ليزر');
  if (lane === 'press') return !!heatPress;
  return true;
}

export function mapT12CloudNativeRows(rows, screen) {
  const out = [];
  for (const source of rows || []) {
    const orderId = text(source && source.orderId);
    const lineId = text(source && source.lineId);
    const department = text(source && source.department);
    const heat = isHeatPress(source && source.heatPress);
    if (!orderId || !lineId || !screenMatches(screen, department, heat)) continue;

    const sourceName = text(source.source);
    const createdAt = text(source.orderCreatedAt || source.lineCreatedAt);
    const updatedAt = text(source.runtimeUpdatedAt || source.lineUpdatedAt || source.orderUpdatedAt || createdAt);

    out.push({
      rowNumber: 0,
      orderId,
      orderCode: orderId,
      lineId,
      customer: text(source.customerName),
      customerPhone: text(source.customerPhone),
      customerSource: sourceName,
      source: sourceName,
      externalCustomerId: text(source.externalCustomerId),
      customerMode: text(source.customerMode),
      department,
      itemName: text(source.itemName),
      qty: Number(source.qty || 0) || 1,
      assignedTo: text(source.assignedTo),
      priority: text(source.priority) || 'عادي',
      status: text(source.status) || 'طلب جديد',
      ready: '',
      heatPress: heat ? 'نعم' : 'لا',
      flyPrint: Number(source.flyPrint || 0) === 1 ? 'نعم' : 'لا',
      quickPrint: Number(source.flyPrint || 0) === 1 ? 'نعم' : 'لا',
      debtAmount: 0,
      debtHold: 'لا',
      deliveryDebtRestricted: false,
      debtRestrictionReason: '',
      debtNotes: '',
      updatedAt,
      notes: text(source.notes),
      customerNotified: text(source.customerNotified),
      notifiedAt: text(source.notifiedAt),
      notifiedBy: text(source.notifiedBy),
      lastWhatsAppMessage: text(source.lastWhatsAppMessage),
      lastWhatsAppAt: text(source.lastWhatsAppAt),
      lastWhatsAppBy: text(source.lastWhatsAppBy),
      receivedAt: createdAt,
      expectedDeliveryAt: '',
      expectedDeliveryText: '',
      overdue: 'لا',
      registrationSent: '',
      cloudNative: true,
      readOnly: true,
      writeAuthority: 'cloudflare-t12',
      dataSource: 't12-prod-native'
    });
  }
  return out;
}

function identity(row) {
  const lineId = text(row && row.lineId);
  if (lineId) return 'line:' + lineId;
  const orderId = text(row && row.orderId);
  const ordinal = text(row && row.ordinal);
  return orderId ? 'order:' + orderId + ':' + ordinal : '';
}

export function mergeT12ReadOverlayRows(mirrorRows, cloudRows) {
  const merged = [];
  const seen = new Set();

  // Cloud-native is authoritative for Cloud-native identities if a future mirror
  // happens to contain the same line.
  for (const row of [...(cloudRows || []), ...(mirrorRows || [])]) {
    const key = identity(row);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    merged.push(row);
  }
  return merged;
}

export async function readT12CloudNativeOverlay(env, screen) {
  if (!env || !env.DB || typeof env.DB.prepare !== 'function') {
    throw new Error('t12-read-overlay-db-unavailable');
  }

  const control = await env.DB.prepare(`
    SELECT marker,
           next_order_number AS nextOrderNumber,
           canary_remaining AS canaryRemaining,
           policy_epoch AS policyEpoch,
           updated_at AS updatedAt
      FROM t12_prod_create_control
     WHERE singleton = 1
     LIMIT 1
  `).first();

  if (!control || text(control.marker) !== 'T12_PROD_CREATE_CANARY_V1') {
    throw new Error('t12-read-overlay-control-invalid');
  }

  const query = await env.DB.prepare(`
    SELECT l.line_id AS lineId,
           l.order_id AS orderId,
           l.ordinal,
           l.department,
           l.assigned_to AS assignedTo,
           l.item_name AS itemName,
           l.qty,
           l.priority,
           COALESCE(r.status,l.status) AS status,
           l.heat_press AS heatPress,
           l.fly_print AS flyPrint,
           l.created_at AS lineCreatedAt,
           l.updated_at AS lineUpdatedAt,
           o.customer_mode AS customerMode,
           o.customer_name AS customerName,
           o.customer_phone AS customerPhone,
           o.external_customer_id AS externalCustomerId,
           o.source,
           COALESCE(r.notes,o.notes) AS notes,
           COALESCE(r.customer_notified,'') AS customerNotified,
           COALESCE(r.notified_at,'') AS notifiedAt,
           COALESCE(r.notified_by,'') AS notifiedBy,
           COALESCE(r.last_whatsapp_message,'') AS lastWhatsAppMessage,
           COALESCE(r.last_whatsapp_at,'') AS lastWhatsAppAt,
           COALESCE(r.last_whatsapp_by,'') AS lastWhatsAppBy,
           r.updated_at AS runtimeUpdatedAt,
           o.created_at AS orderCreatedAt,
           o.updated_at AS orderUpdatedAt
      FROM t12_prod_lines l
      JOIN t12_prod_orders o ON o.order_id = l.order_id
      LEFT JOIN t12_prod_line_runtime r ON r.line_id = l.line_id
     ORDER BY o.created_at DESC, l.ordinal ASC
  `).all();

  const rows = mapT12CloudNativeRows((query && query.results) || [], screen);
  return {
    rows,
    control: {
      nextOrderNumber: Number(control.nextOrderNumber || 0),
      canaryRemaining: Number(control.canaryRemaining || 0),
      policyEpoch: text(control.policyEpoch),
      updatedAt: text(control.updatedAt)
    }
  };
}
