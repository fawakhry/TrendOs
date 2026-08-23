const fs = require('fs');
const assert = require('assert');
function read(p){ return fs.readFileSync(p,'utf8'); }
const root = process.argv[2] || process.cwd();
const config = read(root + '/config.js');
const manager = read(root + '/manager-center-v1932.js');
const customer = read(root + '/customer-manager-v1.js');
const backend = read(root + '/customer-manager-backend-v1932.gs');
const router = read(root + '/v1932-router.gs');
assert(config.includes('manager-center-v1932.js'), 'manager loader missing');
assert(config.includes('customer-manager-v1.js'), 'customer manager loader missing');
assert(manager.includes('getTrendMasterCenterV1931'), 'manager center must use Trend Master source');
assert(customer.includes('action:"customerManagerV1"'), 'customer manager route missing');
assert(backend.includes('https://api.openai.com/v1/responses'), 'Responses API endpoint missing');
assert(backend.includes('PropertiesService.getScriptProperties()'), 'secrets must come from Script Properties');
assert(backend.includes('WHATSAPP_TOKEN') && backend.includes('WHATSAPP_PHONE_NUMBER_ID'), 'WhatsApp settings missing');
assert(router.includes("action === 'ensureDemoCustomer'"), 'demo block missing');
assert(router.includes("action === 'attendanceV1'"), 'attendance native route missing');
assert(router.includes("action === 'customerManagerV1'"), 'customer manager route missing');
for (const [name, text] of Object.entries({config,manager,customer,backend,router})) {
  assert(!/sk-[A-Za-z0-9_-]{20,}/.test(text), name + ': OpenAI key leaked');
  assert(!/EAA[A-Za-z0-9]{30,}/.test(text), name + ': Meta token leaked');
}
console.log('TrendOS V1932 static checks: OK');
