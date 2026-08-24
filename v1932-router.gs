// TrendOS V1932 route adapter.
// Wire trendosV1932TryRoute_(e,payload) at the top of doGet/doPost before older routers.
function trendosV1932TryRoute_(e, payload) {
  e = e || { parameter:{} };
  const p = e.parameter || {};
  const action = String((payload && payload.action) || p.action || '').trim();
  const callback = String(p.callback || '').trim();

  if (!action && String(p['hub.mode'] || '') === 'subscribe') {
    if (typeof customerManagerWebhookVerifyV1_ === 'function') return customerManagerWebhookVerifyV1_(e);
    return ContentService.createTextOutput('customer-manager-not-deployed');
  }

  if (payload && String(payload.object || '') === 'whatsapp_business_account') {
    try { if (typeof customerFeedbackWebhookV1_ === 'function') customerFeedbackWebhookV1_(payload); } catch (feedbackErr) {}
    if (typeof customerManagerWebhookV1_ === 'function') return output_(customerManagerWebhookV1_(payload), callback);
    return output_({ success:false, message:'Customer Manager backend غير منشور.' }, callback);
  }

  if (action === 'ensureDemoCustomer') {
    return output_({ success:false, message:'وضع الديمو متوقف في نسخة الإنتاج.' }, callback);
  }

  if (action === 'attendanceV1') {
    if (typeof attendanceV1_ === 'function') return output_(attendanceV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    return null;
  }

  if (action === 'attendanceClockinV1') {
    if (typeof attendanceClockinV1_ === 'function') return output_(attendanceClockinV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    return output_({ success:false, message:'Clock-in backend غير منشور.' }, callback);
  }

  if (action === 'customerManagerV1') {
    if (typeof customerManagerV1_ === 'function') return output_(customerManagerV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    return output_({ success:false, message:'Customer Manager backend غير منشور.' }, callback);
  }

  if (action === 'customerFeedbackV1') {
    if (typeof customerFeedbackV1_ === 'function') return output_(customerFeedbackV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    return output_({ success:false, message:'Customer Feedback backend غير منشور.' }, callback);
  }

  if (action === 'hrV1') {
    if (typeof hrV1_ === 'function') return output_(hrV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    return output_({ success:false, message:'HR backend غير منشور.' }, callback);
  }

  if (action === 'cleaningV1') {
    if (typeof cleaningV1_ === 'function') return output_(cleaningV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    return output_({ success:false, message:'Cleaning backend غير منشور.' }, callback);
  }

  if (action === 'pressControlV1') {
    if (typeof pressControlV1_ === 'function') return output_(pressControlV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    return output_({ success:false, message:'Press Control backend غير منشور.' }, callback);
  }

  if (action === 'goLiveAutopilotV1') {
    if (typeof goLiveAutopilotV1_ === 'function') return output_(goLiveAutopilotV1_({ parameter:Object.assign({}, p, payload || {}) }), callback);
    return output_({ success:false, message:'Go-Live Autopilot backend غير منشور.' }, callback);
  }

  return null;
}
