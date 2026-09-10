// 원본 4×4 일러스트를 CSS로 표시한다. 순서는 recipes.js의 r1~r16과 같다.
export default function FoodArt({ id = 'r1', name = '요리 일러스트', className = '' }) {
  const index = Math.min(15, Math.max(0, Number(id.slice(1)) - 1))
  return <div role="img" aria-label={`${name} · 일러스트`} className={`food-art ${className}`}
    style={{ backgroundPosition: `${[1, 34, 67, 100][index % 4]}% ${[0, 31.5, 64, 99][Math.floor(index / 4)]}%` }} />
}
