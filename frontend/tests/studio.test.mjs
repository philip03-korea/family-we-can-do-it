import test from 'node:test'
import assert from 'node:assert/strict'
import { ALL_FEATURE_KEYS, resolveFeatures, resolveGroups } from '../src/data/features.js'
import { UNIVERSITIES, ADMISSION, tutorContext as careerContext } from '../src/data/career.js'
import { SCHOOLS, PORTFOLIO, tutorContext as webtoonContext } from '../src/data/webtoon.js'
import { RECIPES } from '../src/data/recipes.js'
import { VERIFIED_SCHOOLS, SOURCES } from '../src/data/admissions2027.js'

test('부모는 전체, 자녀는 저장한 허용 목록만 노출한다', () => {
  assert.deepEqual(resolveFeatures('dad', []), ALL_FEATURE_KEYS)
  assert.deepEqual(resolveFeatures('mom', ['cooking']), ALL_FEATURE_KEYS)
  assert.deepEqual(resolveFeatures('haram', ['cooking']), ['cooking'])
  assert.deepEqual(resolveGroups([]), [])
  assert.ok(!resolveFeatures('haram', null).includes('career'))
  assert.ok(resolveFeatures('haul', null).includes('career'))
  assert.ok(resolveFeatures('haeum', null).includes('webtoon'))
})
test('기존 학교·레시피 수와 음식 일러스트 ID를 보존한다', () => {
  assert.equal(UNIVERSITIES.length, 10)
  assert.equal(SCHOOLS.length, 10)
  assert.deepEqual(RECIPES.map(r => r.id), Array.from({ length: 16 }, (_, i) => `r${i + 1}`))
  for (const r of RECIPES) assert.ok(r.steps.length && r.ingredients.length && r.safety)
})
test('입시 AI에 확인된 요강·불확실성만 전달하고 점수선 추측을 재사용하지 않는다', () => {
  const haul = JSON.parse(careerContext())
  const haeum = JSON.parse(webtoonContext())
  assert.deepEqual(haul.schools.map(s => s.name), ['연세대학교 UIC', '고려대학교 국제학부'])
  assert.equal(haeum.schools.length, 3)
  assert.match(haul.rule, /미확정/)
  assert.doesNotMatch(careerContext(), /100 안팎|상대적으로 유리/)
  assert.equal(PORTFOLIO.items.filter(i => i.must).length, 0)
  for (const u of UNIVERSITIES) assert.ok(ADMISSION[u.key])
  for (const s of Object.values(VERIFIED_SCHOOLS)) assert.ok(new URL(SOURCES[s.source].url).hostname)
  assert.match(SOURCES.ck.status, /재확인/)
})
