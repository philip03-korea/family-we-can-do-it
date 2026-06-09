-- ============================================================
-- FamTalk — 주간 공통 토론 주제 팩2 (무료, 정적 콘텐츠)
-- Supabase SQL Editor 에서 실행. week_start 중복 시 무시.
-- ============================================================

insert into public.weekly_topics (week_start, title, prompt_en, prompt_ko, questions) values
('2026-06-22', 'My Best Friend', 'Talk about a friend who is special to you.',
 '나에게 특별한 친구에 대해 이야기해요.',
 '["Who is your best friend?","How did you meet?","What do you like to do together?"]'::jsonb),

('2026-06-29', 'A Movie I Love', 'Share a movie you really enjoyed and why.',
 '정말 좋았던 영화와 그 이유를 나눠요.',
 '["What is the movie about?","Who is your favorite character?","Would you recommend it? Why?"]'::jsonb),

('2026-07-06', 'My Dream Job', 'Describe a job you would love to have in the future.',
 '미래에 갖고 싶은 직업을 묘사해요.',
 '["What job do you want?","Why does it interest you?","What skills do you need for it?"]'::jsonb),

('2026-07-13', 'A Special Memory', 'Tell a story about a happy memory with your family.',
 '가족과의 행복한 추억을 이야기해요.',
 '["When did it happen?","Who was there?","Why is it special to you?"]'::jsonb),

('2026-07-20', 'Healthy Habits', 'Talk about how you stay healthy.',
 '건강을 지키는 방법에 대해 이야기해요.',
 '["What healthy habits do you have?","What would you like to improve?","How do you feel after exercise?"]'::jsonb),

('2026-07-27', 'My Favorite Season', 'Describe the season you like most and why.',
 '가장 좋아하는 계절과 이유를 묘사해요.',
 '["Which season do you like best?","What do you do in that season?","What is the weather like?"]'::jsonb),

('2026-08-03', 'Technology in Our Lives', 'Discuss how technology helps or hurts us.',
 '기술이 우리 삶을 어떻게 돕거나 해치는지 토론해요.',
 '["What technology do you use every day?","How does it help you?","Is there a downside?"]'::jsonb),

('2026-08-10', 'A Place I Visited', 'Talk about a trip or a place you have been to.',
 '가봤던 여행지나 장소에 대해 이야기해요.',
 '["Where did you go?","What did you see or do?","Would you go again?"]'::jsonb),

('2026-08-17', 'Books and Reading', 'Share a book you read or want to read.',
 '읽은 책이나 읽고 싶은 책을 나눠요.',
 '["What kind of books do you like?","What are you reading now?","Why do you read?"]'::jsonb),

('2026-08-24', 'Goals for This Year', 'Talk about something you want to achieve this year.',
 '올해 이루고 싶은 목표를 이야기해요.',
 '["What is your goal?","Why is it important to you?","What is your first step?"]'::jsonb)
on conflict (week_start) do nothing;
