// TrendOS V1932 route adapter.
// Wire trendosV1932TryRoute_(e,payload) at the top of doGet/doPost before older routers.
function trendosV1932TryRoute_(e, payload) {
  e = e || { parameter:{} };
  const p = e.parameter || {};
  const action = String((payload && payload.action) || p.action || '').trim();
  const callback = String(p.callback || '').trim();

  // Meta webhook verification (GET with no TrendOS action).
  if (!action && String(p['hub.mode'] || '') === 'subscribe') {
    return customerManagerWebhookVerifyV1_(e);
  }

  // WhatsApp Cloud API incoming webhook.
  if (payload && String(payload.object || '') === 'whatsapp_business_account') {
    return output_(customerManagerWebhookV1_(payload), callback);
  }

  // Remove demo operations from production.
  if (action === 'ensureDemoCustomer') {
    return output_({ success:false, message:'وضع الديمو متوقف في نسخة الإنتاج.' }, callback);
  }

  if (action === 'attendanceV1') {
    return output_(attendanceV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
  }

  if (action === 'customerManagerV1') {
    return output_(customerManagerV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
  }

  return null;
}
