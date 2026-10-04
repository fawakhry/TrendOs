const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string' },
    summary: { type: 'string' },
    recommendation: { type: 'string' },
    confidence: { type: 'string' },
    visual_analysis: { type: 'string' },
    differences: { type: 'string' },
    print_qa: { type: 'string' },
    cut_qa: { type: 'string' }
  },
  required: ['verdict', 'summary', 'recommendation', 'confidence']
};

export class LiveOpenAIProvider {
  constructor({ apiKey, model = 'gpt-5.6-terra', fetchImpl = globalThis.fetch } = {}) {
    if (!apiKey) throw new Error('OPENAI_API_KEY is required');
    if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
    this.apiKey = apiKey;
    this.model = model;
    this.fetchImpl = fetchImpl;
  }

  async respond(packet) {
    const body = {
      model: this.model,
      store: false,
      input: buildPrompt('CHATGPT', packet),
    };

    const data = await postJson(this.fetchImpl, OPENAI_RESPONSES_URL, {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }, body, 'OPENAI');

    const text = extractOpenAIText(data);
    const parsed = parseJsonLike(text);
    return normalizeProviderOutput('CHATGPT', parsed, {
      response_id: data?.id || null,
      model: data?.model || this.model,
    });
  }
}

export class LiveGeminiProvider {
  constructor({ apiKey, model = 'gemini-3.8-flash', fetchImpl = globalThis.fetch } = {}) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is required');
    if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
    this.apiKey = apiKey;
    this.model = model;
    this.fetchImpl = fetchImpl;
  }

  async respond(packet) {
    const body = {
      model: this.model,
      store: false,
      system_instruction: systemInstruction('GEMINI'),
      input: JSON.stringify(packet),
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: OUTPUT_SCHEMA,
      },
    };

    const data = await postJson(this.fetchImpl, GEMINI_INTERACTIONS_URL, {
      'x-goog-api-key': this.apiKey,
      'Content-Type': 'application/json',
    }, body, 'GEMINI');

    const text = extractGeminiText(data);
    const parsed = parseJsonLike(text);
    return normalizeProviderOutput('GEMINI', parsed, {
      response_id: data?.id || null,
      model: data?.model || this.model,
    });
  }
}

export function createLiveProvidersFromEnv(env, { fetchImpl = globalThis.fetch } = {}) {
  return {
    CHATGPT: new LiveOpenAIProvider({
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL || 'gpt-5.6-terra',
      fetchImpl,
    }),
    GEMINI: new LiveGeminiProvider({
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL || 'gemini-3.8-flash',
      fetchImpl,
    }),
  };
}

export function extractOpenAIText(data = {}) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const chunks = [];
  for (const item of Array.isArray(data.output) ? data.output : []) {
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      if ((part?.type === 'output_text' || part?.type === 'text') && typeof part.text === 'string') chunks.push(part.text);
    }
  }
  if (!chunks.length) throw providerError('OPENAI_EMPTY_OUTPUT', 'OpenAI response contained no text output');
  return chunks.join('\n').trim();
}

export function extractGeminiText(data = {}) {
  const chunks = [];
  for (const step of Array.isArray(data.steps) ? data.steps : []) {
    if (step?.type !== 'model_output') continue;
    for (const part of Array.isArray(step?.content) ? step.content : []) {
      if (part?.type === 'text' && typeof part.text === 'string') chunks.push(part.text);
    }
  }
  if (!chunks.length) throw providerError('GEMINI_EMPTY_OUTPUT', 'Gemini interaction contained no text output');
  return chunks.join('\n').trim();
}

function buildPrompt(provider, packet) {
  return `${systemInstruction(provider)}\n\nReturn JSON only using keys verdict, summary, recommendation, confidence, and optional visual_analysis, differences, print_qa, cut_qa.\n\nMATBAGY_CONTEXT_PACKET:\n${JSON.stringify(packet)}`;
}

function systemInstruction(provider) {
  return [
    `You are the ${provider} advisory agent inside Matbagy Runtime Sandbox.`,
    'AI_AUTHORITY is ADVISORY_ONLY.',
    'Never invent customer approval, owner decisions, order IDs, asset links, Drive IDs, or production state.',
    'Respect must_keep and must_avoid exactly.',
    'Do not claim to have visually inspected image bytes unless image bytes were actually supplied in the packet.',
    'If evidence is missing, state that explicitly.',
  ].join(' ');
}

function normalizeProviderOutput(provider, parsed = {}, metadata = {}) {
  const sourceType = provider === 'GEMINI' ? 'GEMINI_OPINION' : 'CHATGPT_OPINION';
  return {
    provider,
    source_type: sourceType,
    verdict: clean(parsed.verdict) || 'ADVISORY',
    summary: clean(parsed.summary) || 'No structured summary returned.',
    recommendation: clean(parsed.recommendation) || 'No recommendation returned.',
    confidence: clean(parsed.confidence) || 'UNKNOWN',
    ...(clean(parsed.visual_analysis) ? { visual_analysis: clean(parsed.visual_analysis) } : {}),
    ...(clean(parsed.differences) ? { differences: clean(parsed.differences) } : {}),
    ...(clean(parsed.print_qa) ? { print_qa: clean(parsed.print_qa) } : {}),
    ...(clean(parsed.cut_qa) ? { cut_qa: clean(parsed.cut_qa) } : {}),
    metadata,
  };
}

async function postJson(fetchImpl, url, headers, body, providerName) {
  let response;
  try {
    response = await fetchImpl(url, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch (error) {
    throw providerError(`${providerName}_NETWORK_ERROR`, error?.message || 'network error');
  }
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    const detail = clean(data?.error?.message || data?.message || data?.raw || response.statusText).slice(0, 500);
    throw providerError(`${providerName}_HTTP_${response.status}`, detail || `${providerName} request failed`);
  }
  return data;
}

function parseJsonLike(text) {
  const value = clean(text);
  if (!value) return {};
  const stripped = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(stripped); } catch {
    return { verdict: 'ADVISORY', summary: stripped, recommendation: 'Review unstructured provider output.', confidence: 'UNKNOWN' };
  }
}

function providerError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function clean(value) {
  return value == null ? '' : String(value).trim();
}
