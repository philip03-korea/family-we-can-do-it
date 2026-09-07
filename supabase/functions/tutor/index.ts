// ============================================================
// FamTalk — 입시박사 Edge Function (Supabase, Deno)
//
// 앱 안에서 떠다니는 「입시박사」 대화창의 서버. API 키는 서버 시크릿에만 있고
// 브라우저에는 절대 내려가지 않는다 (chat 함수와 같은 원칙).
//
// 제공자는 TUTOR_PROVIDER 로 **명시적으로** 고른다. 기본값은 gemini(무료 등급)다.
//   TUTOR_PROVIDER=gemini  (기본) → GEMINI_API_KEY. 무료 등급 안에서 쓰면 추가 비용이 없다
//   TUTOR_PROVIDER=openai        → OPENAI_API_KEY. 종량제로 과금된다
//
// ⚠️ 유료 제공자로 **자동 전환하지 않는다.** 다른 용도로 OPENAI_API_KEY 를 넣어 두더라도
//    TUTOR_PROVIDER 를 바꾸지 않는 한 여기서 돈이 나가지 않는다.
//
// 같은 질문은 캐시에서 꺼내 쓴다 → 두 번째부터는 호출 자체가 없다(무료 등급도 아낀다).
//
// 배포:
//   supabase functions deploy tutor
//   (OpenAI 로 바꿀 때만)
//   supabase secrets set TUTOR_PROVIDER=openai
//   supabase secrets set OPENAI_API_KEY=sk-...
//   supabase secrets set OPENAI_MODEL=<계정에서 확인한 모델명>
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PROVIDER = (Deno.env.get('TUTOR_PROVIDER') ?? 'gemini').toLowerCase()
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-5.1'
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash'
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '100')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 입시박사의 성격. 두 가지가 핵심이다.
//   ① 앱이 넘겨준 가이드 내용을 근거로 답한다 (없는 사실을 만들지 않는다)
//   ② 해마다 바뀌는 숫자는 단정하지 않고 "요강 확인"으로 넘긴다
function systemPrompt(who: string, topic: string, context: string) {
  return `너는 「입시박사」다. 한국 가족용 학습 앱 FamTalk 안에서 ${who}의 입시를 돕는다.
지금 보고 있는 화면: ${topic}

말투
- 한국어로, 중고등학생이 바로 알아들을 만큼 쉽게. 존댓말은 쓰되 딱딱하지 않게.
- 3~6문장으로 짧게. 목록이 도움이 되면 짧은 항목 3~4개까지.
- 학생을 다그치지 않는다. 막막해하면 "다음 한 걸음"을 하나만 짚어준다.

지켜야 할 것
- 아래 「가이드 자료」에 있는 내용을 근거로 답한다. 자료에 없는 대학·학과·전형을 지어내지 않는다.
- 모집인원·경쟁률·커트라인처럼 해마다 바뀌는 숫자는 단정하지 않는다.
  꼭 필요하면 "대략 이 정도 범위"라고만 하고, 반드시 "그해 모집요강과 입학처 확인"을 덧붙인다.
- 자료에 없어서 모르면 솔직히 모른다고 하고, 어디에 물어보면 되는지(입학처·학교)를 알려준다.
- 합격을 장담하거나 "무조건", "확실히" 같은 말을 쓰지 않는다.
- 진학은 본인과 가족이 정하는 일이다. 대신 결정해 주지 말고 판단할 재료를 준다.

가이드 자료 (앱 화면에 실제로 실려 있는 내용)
${context}`
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
    // 고른 제공자의 키가 없으면 여기서 멈춘다. 유료 쪽으로 몰래 넘어가지 않는다.
    const useOpenAI = PROVIDER === 'openai'
    if (useOpenAI && !OPENAI_API_KEY) return json({ error: 'AI_NOT_CONFIGURED', provider: 'openai' }, 503)
    if (!useOpenAI && !GEMINI_API_KEY) return json({ error: 'AI_NOT_CONFIGURED', provider: 'gemini' }, 503)

    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return json({ error: 'UNAUTHORIZED' }, 401)

    const { message = '', history = [], who = '학생', topic = '진학', context = '' } = await req.json()
    if (!message.trim()) return json({ error: 'EMPTY_MESSAGE' }, 400)

    const recent = history.slice(-8) as { role: string; text: string }[]
    const lastCtx = recent.length ? recent[recent.length - 1]?.text ?? '' : ''

    // 1) 캐시 먼저 — 같은 화면에서 같은 질문이면 호출 자체를 안 한다.
    //    호출이 없으니 일일 쿼터도 쓰지 않는다 (무료 등급을 아끼는 쪽이 맞다).
    const hash = await sha256(`tutor|${PROVIDER}|${topic}|${message.trim()}|${lastCtx}`)
    const { data: cached } = await supabase
      .from('ai_cache')
      .select('response')
      .eq('hash', hash)
      .maybeSingle()
    if (cached?.response?.reply) {
      await supabase.rpc('bump_ai_cache_hit', { p_hash: hash })
      return json({ reply: cached.response.reply, provider: 'cache', cached: true })
    }

    // 2) 일일 쿼터 — AI 회화와 같은 카운터 (가족 전체 폭주 방지)
    const { data: usageCount, error: usageErr } = await supabase.rpc('bump_ai_usage')
    if (usageErr) return json({ error: 'USAGE_ERROR', detail: usageErr.message }, 500)
    if (usageCount > DAILY_LIMIT) {
      return json({ error: 'DAILY_LIMIT_REACHED', usageToday: usageCount, limit: DAILY_LIMIT }, 429)
    }

    const sys = systemPrompt(who, topic, context.slice(0, 12000))
    let reply = ''
    let provider = ''

    if (useOpenAI) {
      provider = `openai:${OPENAI_MODEL}`
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: sys },
            ...recent.map((m) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.text,
            })),
            { role: 'user', content: message },
          ],
          max_completion_tokens: 700,
        }),
      })
      if (!res.ok) {
        const detail = await res.text()
        const code = res.status === 429 ? 'AI_QUOTA_EXCEEDED' : 'PROVIDER_ERROR'
        return json({ error: code, status: res.status, provider, detail }, 200)
      }
      const out = await res.json()
      reply = out?.choices?.[0]?.message?.content ?? ''
    } else {
      provider = `gemini:${GEMINI_MODEL}`
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sys }] },
            contents: [
              ...recent.map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.text }],
              })),
              { role: 'user', parts: [{ text: message }] },
            ],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 700,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        },
      )
      if (!res.ok) {
        const detail = await res.text()
        const code = res.status === 429 ? 'AI_QUOTA_EXCEEDED' : 'PROVIDER_ERROR'
        return json({ error: code, status: res.status, provider, detail }, 200)
      }
      const out = await res.json()
      reply = out?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    }

    reply = (reply || '').trim()
    if (!reply) return json({ error: 'PROVIDER_ERROR', provider, detail: 'empty reply' }, 200)

    // 3) 캐시에 저장 — 같은 질문이 다시 오면 공짜로 답한다
    await supabase.from('ai_cache').insert({ hash, level: 'tutor', prompt: message, response: { reply } })

    return json({ reply, provider, cached: false, usageToday: usageCount, limit: DAILY_LIMIT })
  } catch (e) {
    return json({ error: 'SERVER_ERROR', detail: String(e) }, 500)
  }
})
