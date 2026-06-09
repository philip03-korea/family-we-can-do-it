/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      // 레벨별 고유 그라데이션 (CLAUDE.md UI 디자인 시스템)
      backgroundImage: {
        'level-a': 'linear-gradient(135deg, #14b8a6 0%, #fbbf24 100%)', // 틸→골드
        'level-b': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // 블루→청록
        'level-c': 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', // 인디고→핑크
        'level-d': 'linear-gradient(135deg, #d946ef 0%, #f97316 100%)', // 마젠타→오렌지
        'level-e': 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)', // 네이비→퍼플
        'level-f': 'linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)', // 딥틸→틸
      },
    },
  },
  plugins: [],
}
