// TrendOS V1940 deployment health check — run manually in Apps Script before deploying.
function trendosV1940DeploymentHealth_() {
  const props = PropertiesService.getScriptProperties();
  const modules = {
    router: typeof trendosV1932TryRoute_ === 'function',
    customerManager: typeof customerManagerV1_ === 'function',
    customerFeedback: typeof customerFeedbackV1_ === 'function',
    attendance: typeof attendanceV1_ === 'function',
    attendanceClockin: typeof attendanceClockinV1_ === 'function',
    hr: typeof hrV1_ === 'function',
    cleaning: typeof cleaningV1_ === 'function',
    pressControl: typeof pressControlV1_ === 'function',
    goLiveAutopilot: typeof goLiveAutopilotV1_ === 'function'
  };
  const requiredProperties = {
    OPENAI_API_KEY: !!String(props.getProperty('OPENAI_API_KEY') || '').trim(),
    WHATSAPP_TOKEN: !!String(props.getProperty('WHATSAPP_TOKEN') || '').trim(),
    WHATSAPP_PHONE_NUMBER_ID: !!String(props.getProperty('WHATSAPP_PHONE_NUMBER_ID') || '').trim()
  };
  const optionalProperties = {
    OPENAI_CUSTOMER_MODEL: !!String(props.getProperty('OPENAI_CUSTOMER_MODEL') || '').trim(),
    WHATSAPP_GRAPH_VERSION: !!String(props.getProperty('WHATSAPP_GRAPH_VERSION') || '').trim(),
    TRENDOS_SPREADSHEET_ID: !!String(props.getProperty('TRENDOS_SPREADSHEET_ID') || '').trim()
  };
  let spreadsheetOk = false, spreadsheetTitle = '';
  try {
    const ss = typeof ss_ === 'function' ? ss_() : SpreadsheetApp.getActiveSpreadsheet();
    spreadsheetOk = !!ss;
    spreadsheetTitle = ss ? ss.getName() : '';
  } catch (e) {}
  const codeReady = Object.keys(modules).every(function(k){ return modules[k]; });
  const integrationsReady = requiredProperties.OPENAI_API_KEY && requiredProperties.WHATSAPP_TOKEN && requiredProperties.WHATSAPP_PHONE_NUMBER_ID;
  const result = {
    version: 'V1940',
    checkedAt: Utilities.formatDate(new Date(), 'Africa/Cairo', "yyyy-MM-dd'T'HH:mm:ssXXX"),
    codeReady: codeReady,
    spreadsheetReady: spreadsheetOk,
    spreadsheetTitle: spreadsheetTitle,
    modules: modules,
    integrationsReady: integrationsReady,
    requiredProperties: requiredProperties,
    optionalProperties: optionalProperties,
    readyForFullGoLive: codeReady && spreadsheetOk && integrationsReady,
    note: integrationsReady ? 'الكود والتكاملات الأساسية جاهزة للاختبار.' : 'الكود يمكن نشره، لكن WhatsApp/OpenAI لن يعملوا Live قبل ضبط Script Properties.'
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
