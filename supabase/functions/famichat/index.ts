// ============================================================
// FamTalk — 패미(AI 가족) Edge Function
// 주제와 최근 대화를 보고 가족 영어 채팅을 이끄는 짧은 메시지를 생성.
// (영어 한 문장 + 괄호 한국어 번역, 필요시 @이름으로 가족을 지목)
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    if (!GEMINI_API_KEY) return json({ error: 'AI_NOT_CONFIGURED' }, 200)

    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return json({ error: 'UNAUTHORIZED' }, 401)

    const { topic = '', recent = [], members = [] } = await req.json()
    const history = (recent as { name: string; text: string }[])
      .slice(-8)
      .map((m) => `${m.name}: ${m.text}`)
      .join('\n')

    const sys = `You are 패미, a warm, encouraging AI family member in a Korean family's English-practice group chat.
Your job: keep the family talking in English in a friendly, low-pressure way.
- Write ONE short message (1-2 sentences) in SIMPLE English ONLY (no Korean inside the English).
- Usually ask an easy, fun question about the weekly topic, or react to the latest message and ask a follow-up.
- You may address one person with @name (family members: ${(members as string[]).join(', ') || 'mom, dad'}).
- Sometimes refer to a past message or suggest a new fun angle so the conversation keeps going.
- Keep it warm and simple so beginners can answer. No long paragraphs.
Return JSON only:
- "text": the English message (English only).
- "text_ko": the Korean translation of "text".`

    const userContent = `Weekly topic: ${topic || '(none)'}\n\nRecent chat:\n${history || '(empty — please start a friendly conversation about the topic)'}`

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 400,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseSchema: { type: 'OBJECT', properties: { text: { type: 'STRING' }, text_ko: { type: 'STRING' } }, required: ['text'] },
        },
      }),
    })
    if (!res.ok) {
      const code = res.status === 429 ? 'AI_QUOTA_EXCEEDED' : 'GEMINI_ERROR'
      return json({ error: code, detail: await res.text() }, 200)
    }
    const gem = await res.json()
    const raw = gem?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    let parsed: { text?: string; text_ko?: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = { text: raw }
    }
    return json({ text: parsed.text ?? '', text_ko: parsed.text_ko ?? '' })
  } catch (e) {
    return json({ error: 'SERVER_ERROR', detail: String(e) }, 200)
  }
})
