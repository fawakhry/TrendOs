// TrendOS V1932 route adapter.
// Wire trendosV1932TryRoute_(e,payload) at the top of doGet/doPost before older routers.
function trendosV1932TryRoute_(e, payload) {
  e = e || { parameter:{} };
  const p = e.parameter || {};
  const action = String((payload && payload.action) || p.action || '').trim();
  const callback = String(p.callback || '').trim();

  // Meta webhook verification (GET with no TrendOS action).
  if (!action && String(p['hub.mode'] || '') === 'subscribe') {
    if (typeof customerManagerWebhookVerifyV1_ === 'function') return customerManagerWebhookVerifyV1_(e);
    return ContentService.createTextOutput('customer-manager-not-deployed');
  }

  // WhatsApp Cloud API incoming webhook. Feedback capture runs in parallel with Customer Manager logging.
  if (payload && String(payload.object || '') === 'whatsapp_business_account') {
    try { if (typeof customerFeedbackWebhookV1_ === 'function') customerFeedbackWebhookV1_(payload); } catch (feedbackErr) {}
    if (typeof customerManagerWebhookV1_ === 'function') return output_(customerManagerWebhookV1_(payload), callback);
    return output_({ success:false, message:'Customer Manager backend غير منشور.' }, callback);
  }

  // Remove demo operations from production.
  if (action === 'ensureDemoCustomer') {
    return output_({ success:false, message:'وضع الديمو متوقف في نسخة الإنتاج.' }, callback);
  }

  // Attendance remains on the existing Hybrid fallback until the native module is present.
  if (action === 'attendanceV1') {
    if (typeof attendanceV1_ === 'function') {
      return output_(attendanceV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    }
    return null;
  }

  if (action === 'customerManagerV1') {
    if (typeof customerManagerV1_ === 'function') {
      return output_(customerManagerV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    }
    return output_({ success:false, message:'Customer Manager backend غير منشور.' }, callback);
  }

  if (action === 'customerFeedbackV1') {
    if (typeof customerFeedbackV1_ === 'function') {
      return output_(customerFeedbackV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    }
    return output_({ success:false, message:'Customer Feedback backend غير منشور.' }, callback);
  }

  // Go-Live bridge: production readiness creates invoice drafts only; final accounting remains permission-gated.
  if (action === 'goLiveAutopilotV1') {
    if (typeof goLiveAutopilotV1_ === 'function') {
      return output_(goLiveAutopilotV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    }
    return output_({ success:false, message:'Go-Live Autopilot backend غير منشور.' }, callback);
  }

  return null;
}
