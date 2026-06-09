// ============================================================
// FamTalk — TOEFL AI 채점 Edge Function (Gemini Flash, 무료)
// Speaking/Writing 응답을 TOEFL iBT 기준으로 채점하고 피드백 제공.
// 배포: supabase functions deploy toefl  (GEMINI_API_KEY 시크릿 공유)
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash'
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '100')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function systemPrompt(section: string) {
  return `You are an experienced TOEFL iBT rater. You are scoring a learner's ${section} response.
Score the response on the official TOEFL scale of 0 to 30 for this section.
Be fair but rigorous. Consider development, organization, language use, and (for speaking) coherence of ideas.
Note: speaking responses are provided as a speech-to-text transcript, so ignore minor transcription artifacts and do NOT penalize pronunciation.
Return JSON only: score (integer 0-30), score_reason (one sentence), strengths (array of short strings), improvements (array of short actionable strings), corrected_sample (a brief improved version or key sentence rewrite).`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    if (!GEMINI_API_KEY) return json({ error: 'AI_NOT_CONFIGURED' }, 503)
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return json({ error: 'UNAUTHORIZED' }, 401)

    const { section = 'writing', prompt = '', response = '' } = await req.json()
    if (!response.trim()) return json({ error: 'EMPTY_RESPONSE' }, 400)

    const { data: usageCount, error: usageErr } = await supabase.rpc('bump_ai_usage')
    if (usageErr) return json({ error: 'USAGE_ERROR', detail: usageErr.message }, 500)
    if (usageCount > DAILY_LIMIT) return json({ error: 'DAILY_LIMIT_REACHED', usageToday: usageCount, limit: DAILY_LIMIT }, 429)

    const userContent = `TASK PROMPT:\n${prompt}\n\nLEARNER RESPONSE:\n${response}`
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt(section) }] },
          contents: [{ role: 'user', parts: [{ text: userContent }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                score_reason: { type: 'STRING' },
                strengths: { type: 'ARRAY', items: { type: 'STRING' } },
                improvements: { type: 'ARRAY', items: { type: 'STRING' } },
                corrected_sample: { type: 'STRING' },
              },
              required: ['score', 'score_reason'],
            },
          },
        }),
      },
    )
    if (!geminiRes.ok) return json({ error: 'GEMINI_ERROR', status: geminiRes.status, detail: await geminiRes.text() }, 502)
    const gem = await geminiRes.json()
    const raw = gem?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = { score: 0, score_reason: raw }
    }
    return json({ ...parsed, usageToday: usageCount, limit: DAILY_LIMIT })
  } catch (e) {
    return json({ error: 'SERVER_ERROR', detail: String(e) }, 500)
  }
})
