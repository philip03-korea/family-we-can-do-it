// ============================================================
// FamTalk — AI 회화 Edge Function (Supabase, Deno)
// Google Gemini Flash(무료 티어) 프록시. API 키는 서버 시크릿에만 존재.
// 기능: JWT 인증 → 일일 쿼터 체크 → 캐시 조회 → Gemini 호출 → 캐시 저장
//
// 배포:
//   supabase secrets set GEMINI_API_KEY=발급받은키
//   supabase functions deploy chat
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash'
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '100') // 1인 1일 상한

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LEVEL_GUIDE: Record<string, string> = {
  A: 'CEFR Pre-A1. Use only the simplest words and very short sentences (3-5 words). Speak slowly and warmly.',
  B: 'CEFR A1. Use basic everyday vocabulary and short simple sentences. Be encouraging.',
  C: 'CEFR A2. Use simple sentences about daily life, travel, and work. Keep it practical.',
  D: 'CEFR B1. Natural everyday conversation. You may ask follow-up questions.',
  E: 'CEFR B2. Richer vocabulary and longer responses. Challenge the learner a little.',
  F: 'CEFR C1. Near-native, nuanced English. Discuss abstract topics.',
}

function systemPrompt(level: string) {
  const guide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE['C']
  return `You are FamTalk, a friendly English conversation tutor for a Korean family learner.
Learner level: ${level}. ${guide}
Always reply in English at the learner's level, keep replies concise (1-3 sentences), and end with a light question to keep the conversation going.
If the learner's last message has English mistakes, provide a gentle corrected version; otherwise leave correction empty.
Return JSON only with fields: reply (English), correction (corrected English of the user's message, or empty if none), correction_ko (a one-line Korean explanation of the correction, or empty).`
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    if (!GEMINI_API_KEY) return json({ error: 'AI_NOT_CONFIGURED' }, 503)

    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return json({ error: 'UNAUTHORIZED' }, 401)

    const { level = 'C', message = '', history = [] } = await req.json()
    if (!message.trim()) return json({ error: 'EMPTY_MESSAGE' }, 400)

    // 1) 일일 쿼터
    const { data: usageCount, error: usageErr } = await supabase.rpc('bump_ai_usage')
    if (usageErr) return json({ error: 'USAGE_ERROR', detail: usageErr.message }, 500)
    if (usageCount > DAILY_LIMIT) {
      return json({ error: 'DAILY_LIMIT_REACHED', usageToday: usageCount, limit: DAILY_LIMIT }, 429)
    }

    // 2) 캐시 조회 (동일 맥락 재요청은 0원)
    const lastCtx = history.length ? history[history.length - 1]?.text ?? '' : ''
    const hash = await sha256(`${level}|${message.trim()}|${lastCtx}`)
    const { data: cached } = await supabase.from('ai_cache').select('response').eq('hash', hash).maybeSingle()
    if (cached?.response) {
      await supabase.rpc('bump_ai_cache_hit', { p_hash: hash })
      return json({ ...cached.response, cached: true, usageToday: usageCount, limit: DAILY_LIMIT })
    }

    // 3) Gemini 호출
    const contents = [
      ...history.slice(-8).map((m: { role: string; text: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ]
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt(level) }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                reply: { type: 'STRING' },
                correction: { type: 'STRING' },
                correction_ko: { type: 'STRING' },
              },
              required: ['reply'],
            },
          },
        }),
      },
    )
    if (!geminiRes.ok) {
      const detail = await geminiRes.text()
      return json({ error: 'GEMINI_ERROR', status: geminiRes.status, detail }, 502)
    }
    const gem = await geminiRes.json()
    const raw = gem?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    let parsed: { reply?: string; correction?: string; correction_ko?: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = { reply: raw }
    }
    const result = {
      reply: parsed.reply ?? '...',
      correction: parsed.correction ?? '',
      correction_ko: parsed.correction_ko ?? '',
    }

    // 4) 캐시에 저장
    await supabase.from('ai_cache').insert({ hash, level, prompt: message, response: result }).select()

    return json({ ...result, cached: false, usageToday: usageCount, limit: DAILY_LIMIT })
  } catch (e) {
    return json({ error: 'SERVER_ERROR', detail: String(e) }, 500)
  }
})
