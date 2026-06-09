-- ============================================================
-- FamTalk — 관심사 단어 (아이별 흥미 기반, 비용 0원)
-- 카테고리: general(일반) / webtoon(웹툰·배우) / football(축구) /
--           kpop_rap(랩·힙합) / games(게임)
-- 여러 번 실행해도 중복 안 됨.
-- ============================================================

-- 1) words 테이블에 category 컬럼 추가 (없으면)
alter table public.words add column if not exists category text not null default 'general';
create index if not exists words_category_idx on public.words(category);

-- (level, term) 중복 방지 제약 보장
do $$
begin
  alter table public.words add constraint words_level_term_uniq unique (level, term);
exception when duplicate_table or duplicate_object then null;
end $$;

-- 2) 웹툰·배우 (하음 — 고3, 웹툰 입시 / 서인국·최현욱 팬)  level D
insert into public.words (level, term, meaning_ko, example_en, example_ko, pos, category) values
('D','webtoon','웹툰','I read a new webtoon every morning.','나는 매일 아침 새 웹툰을 읽는다.','noun','webtoon'),
('D','episode','회차, 에피소드','A new episode comes out every Friday.','새 회차가 매주 금요일에 나온다.','noun','webtoon'),
('D','panel','(만화의) 칸','Each panel shows a different moment.','각 칸이 서로 다른 순간을 보여준다.','noun','webtoon'),
('D','plot','줄거리, 구성','The plot of this webtoon is really exciting.','이 웹툰의 줄거리는 정말 흥미진진하다.','noun','webtoon'),
('D','character','등장인물','My favorite character is brave and kind.','내가 가장 좋아하는 인물은 용감하고 친절하다.','noun','webtoon'),
('D','villain','악당','The villain finally appears in this episode.','악당이 이번 회차에 드디어 등장한다.','noun','webtoon'),
('D','cliffhanger','손에 땀을 쥐게 하는 결말','The episode ended on a cliffhanger.','그 회차는 긴장감 넘치는 결말로 끝났다.','noun','webtoon'),
('D','adaptation','각색, 원작 각색','The drama is an adaptation of a popular webtoon.','그 드라마는 인기 웹툰을 각색한 것이다.','noun','webtoon'),
('D','cast','출연진','The cast of this drama is amazing.','이 드라마의 출연진이 굉장하다.','noun','webtoon'),
('D','actor','배우','Seo In-guk is a talented Korean actor and singer.','서인국은 재능 있는 한국 배우이자 가수이다.','noun','webtoon'),
('D','role','역할, 배역','He played the main role in the series.','그는 그 시리즈에서 주연을 맡았다.','noun','webtoon'),
('D','drama','드라마','Weak Hero is a popular Korean drama.','약한영웅은 인기 있는 한국 드라마이다.','noun','webtoon'),
('D','scene','장면','My favorite scene made me cry.','내가 가장 좋아하는 장면은 나를 울게 했다.','noun','webtoon'),
('D','fan','팬','I am a big fan of Choi Hyun-wook.','나는 최현욱의 열성 팬이다.','noun','webtoon'),
('D','debut','데뷔','Seo In-guk made his debut on a singing show.','서인국은 노래 프로그램에서 데뷔했다.','noun','webtoon'),
('D','emotion','감정','The actor expressed deep emotion in that scene.','그 배우는 그 장면에서 깊은 감정을 표현했다.','noun','webtoon'),
('D','storyline','이야기 전개','I love the storyline of this webtoon.','나는 이 웹툰의 전개가 정말 좋다.','noun','webtoon'),
('D','illustrator','웹툰 작가, 삽화가','The illustrator draws beautiful art.','그 작가는 아름다운 그림을 그린다.','noun','webtoon'),
('D','binge-watch','정주행하다','I want to binge-watch the whole season tonight.','오늘 밤 시즌 전체를 정주행하고 싶다.','verb','webtoon'),
('D','genre','장르','Romance is my favorite genre.','로맨스가 내가 가장 좋아하는 장르이다.','noun','webtoon'),
('D','release','공개하다, 발매하다','A new chapter will be released tonight.','새 화가 오늘 밤 공개될 것이다.','verb','webtoon'),
('D','expression','표정, 표현','His facial expression was perfect for the scene.','그의 표정은 그 장면에 완벽했다.','noun','webtoon')
on conflict (level, term) do nothing;

-- 3) 축구 (하울 — EPL·라리가, 바르셀로나 팬)  level E
insert into public.words (level, term, meaning_ko, example_en, example_ko, pos, category) values
('E','striker','공격수, 스트라이커','The striker scored a beautiful goal.','그 공격수가 아름다운 골을 넣었다.','noun','football'),
('E','midfielder','미드필더','A good midfielder controls the game.','좋은 미드필더는 경기를 지배한다.','noun','football'),
('E','defender','수비수','The defender blocked the shot.','수비수가 슛을 막아냈다.','noun','football'),
('E','goalkeeper','골키퍼','The goalkeeper made an amazing save.','골키퍼가 멋진 선방을 했다.','noun','football'),
('E','possession','점유율, 볼 소유','Barcelona is famous for keeping possession.','바르셀로나는 점유율 유지로 유명하다.','noun','football'),
('E','dribble','드리블하다','Messi can dribble past many defenders.','메시는 많은 수비수를 제치고 드리블할 수 있다.','verb','football'),
('E','assist','도움, 어시스트','He gave a perfect assist to his teammate.','그는 동료에게 완벽한 도움을 줬다.','noun','football'),
('E','hat-trick','해트트릭(한 경기 3골)','The striker scored a hat-trick tonight.','그 공격수는 오늘 밤 해트트릭을 기록했다.','noun','football'),
('E','legend','전설, 전설적인 선수','Lionel Messi is a football legend.','리오넬 메시는 축구의 전설이다.','noun','football'),
('E','transfer','이적','The transfer of the star player shocked fans.','그 스타 선수의 이적은 팬들을 놀라게 했다.','noun','football'),
('E','formation','포메이션, 전형','The coach changed the formation at halftime.','감독은 하프타임에 포메이션을 바꿨다.','noun','football'),
('E','squad','선수단','Barcelona has a strong squad this season.','바르셀로나는 이번 시즌 강한 선수단을 보유했다.','noun','football'),
('E','rivalry','라이벌전','El Clasico is a famous rivalry in football.','엘 클라시코는 축구의 유명한 라이벌전이다.','noun','football'),
('E','comeback','역전, 반등','Barcelona made an incredible comeback.','바르셀로나는 놀라운 역전을 해냈다.','noun','football'),
('E','captain','주장','The captain leads the team on the field.','주장은 경기장에서 팀을 이끈다.','noun','football'),
('E','trophy','우승 트로피','They lifted the trophy after the final.','그들은 결승 후 트로피를 들어올렸다.','noun','football'),
('E','winger','윙어, 측면 공격수','The winger crossed the ball into the box.','윙어가 박스 안으로 공을 올렸다.','noun','football'),
('E','penalty','페널티킥','He scored from the penalty spot.','그는 페널티 지점에서 득점했다.','noun','football'),
('E','stadium','경기장','Camp Nou is the home stadium of Barcelona.','캄 노우는 바르셀로나의 홈 경기장이다.','noun','football'),
('E','tackle','태클(하다)','He made a clean tackle to stop the attack.','그는 공격을 막으려 깔끔한 태클을 했다.','noun','football')
on conflict (level, term) do nothing;

-- 4) 랩·힙합 (하울 — 한국 래퍼 팬)  level E
insert into public.words (level, term, meaning_ko, example_en, example_ko, pos, category) values
('E','rapper','래퍼','My favorite Korean rapper has great energy.','내가 좋아하는 한국 래퍼는 에너지가 넘친다.','noun','kpop_rap'),
('E','verse','벌스, (랩의) 절','His verse was full of clever rhymes.','그의 벌스는 영리한 라임으로 가득했다.','noun','kpop_rap'),
('E','flow','플로우, 랩의 리듬감','The rapper has a really smooth flow.','그 래퍼는 정말 부드러운 플로우를 가졌다.','noun','kpop_rap'),
('E','beat','비트','The beat makes me want to move.','그 비트는 나를 움직이고 싶게 만든다.','noun','kpop_rap'),
('E','lyrics','가사','The lyrics tell a powerful story.','그 가사는 강렬한 이야기를 담고 있다.','noun','kpop_rap'),
('E','rhyme','운율, 라임','He uses creative rhymes in every line.','그는 모든 줄에 창의적인 라임을 쓴다.','noun','kpop_rap'),
('E','freestyle','프리스타일(즉흥 랩)','She can freestyle about almost anything.','그녀는 거의 무엇에 대해서든 프리스타일을 할 수 있다.','noun','kpop_rap'),
('E','punchline','펀치라인(임팩트 있는 구절)','That punchline was so clever.','그 펀치라인은 정말 영리했다.','noun','kpop_rap'),
('E','hook','후렴구, 훅','The hook of this song is very catchy.','이 노래의 후렴구는 정말 중독성 있다.','noun','kpop_rap'),
('E','mixtape','믹스테이프','He dropped a new mixtape today.','그는 오늘 새 믹스테이프를 냈다.','noun','kpop_rap'),
('E','crew','크루, 팀','Their hip-hop crew is famous in Korea.','그들의 힙합 크루는 한국에서 유명하다.','noun','kpop_rap'),
('E','collaboration','협업, 피처링','The collaboration became a huge hit.','그 협업은 큰 인기를 끌었다.','noun','kpop_rap'),
('E','confidence','자신감','He raps with so much confidence.','그는 엄청난 자신감으로 랩을 한다.','noun','kpop_rap'),
('E','underground','언더그라운드','She started in the underground scene.','그녀는 언더그라운드 씬에서 시작했다.','noun','kpop_rap'),
('E','chart','차트','The song reached number one on the chart.','그 노래는 차트 1위에 올랐다.','noun','kpop_rap'),
('E','performance','공연, 무대','His live performance was unforgettable.','그의 라이브 공연은 잊을 수 없었다.','noun','kpop_rap'),
('E','stage','무대','The rapper owned the stage tonight.','그 래퍼는 오늘 밤 무대를 장악했다.','noun','kpop_rap'),
('E','album','앨범','They will release a new album next week.','그들은 다음 주 새 앨범을 발매할 것이다.','noun','kpop_rap')
on conflict (level, term) do nothing;

-- 5) 게임 (하람 — 로블록스/발로란트/ARK/브롤스타즈/포켓몬)  level B
insert into public.words (level, term, meaning_ko, example_en, example_ko, pos, category) values
('B','game','게임','I play this game with my friends.','나는 이 게임을 친구들과 한다.','noun','games'),
('B','character','캐릭터','I made a cool character in Roblox.','나는 로블록스에서 멋진 캐릭터를 만들었다.','noun','games'),
('B','weapon','무기','He found a new weapon in the game.','그는 게임에서 새 무기를 찾았다.','noun','games'),
('B','shield','방패','Use a shield to block the attack.','공격을 막으려면 방패를 사용해라.','noun','games'),
('B','survive','살아남다','You must survive on the island in ARK.','ARK에서는 섬에서 살아남아야 한다.','verb','games'),
('B','dinosaur','공룡','I tamed a dinosaur in ARK.','나는 ARK에서 공룡을 길들였다.','noun','games'),
('B','tame','길들이다','You can tame wild animals in the game.','게임에서 야생 동물을 길들일 수 있다.','verb','games'),
('B','item','아이템','I collected many items today.','나는 오늘 많은 아이템을 모았다.','noun','games'),
('B','inventory','가방, 인벤토리','My inventory is full of items.','내 인벤토리가 아이템으로 가득 찼다.','noun','games'),
('B','map','지도, 맵','The map shows where to go.','지도가 어디로 갈지 알려준다.','noun','games'),
('B','team','팀','Work with your team to win.','이기려면 팀과 협력해라.','noun','games'),
('B','battle','전투, 대결','The final battle was very exciting.','마지막 전투는 정말 흥미진진했다.','noun','games'),
('B','monster','몬스터','A wild monster appeared in the forest.','야생 몬스터가 숲에 나타났다.','noun','games'),
('B','catch','잡다, 포획하다','I want to catch every Pokemon.','나는 모든 포켓몬을 잡고 싶다.','verb','games'),
('B','evolve','진화하다','My Pokemon evolved into a stronger one.','내 포켓몬이 더 강한 것으로 진화했다.','verb','games'),
('B','base','기지, 베이스','We built a base to stay safe.','우리는 안전하게 지내려 기지를 지었다.','noun','games'),
('B','craft','제작하다, 만들다','You can craft tools from wood and stone.','나무와 돌로 도구를 만들 수 있다.','verb','games'),
('B','mission','임무','We completed the mission together.','우리는 함께 임무를 완수했다.','noun','games'),
('B','agent','요원(발로란트 캐릭터)','My favorite agent has cool abilities.','내가 좋아하는 요원은 멋진 능력을 가졌다.','noun','games'),
('B','ability','능력','Each agent has a special ability.','각 요원은 특별한 능력을 가지고 있다.','noun','games'),
('B','brawler','브롤러(브롤스타즈 캐릭터)','I unlocked a new brawler today.','나는 오늘 새 브롤러를 해금했다.','noun','games'),
('B','win','이기다','We worked together and won the match.','우리는 협력해서 경기를 이겼다.','verb','games')
on conflict (level, term) do nothing;
