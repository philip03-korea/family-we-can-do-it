import { useState } from 'react'

// 영어를 먼저 보여주고, 탭하면 한국어 번역이 나타났다 다시 탭하면 사라진다.
export default function Translatable({ children, ko }) {
  const [show, setShow] = useState(false)
  if (!ko) return <span>{children}</span>
  return (
    <span>
      <span onClick={() => setShow((s) => !s)} className="cursor-pointer">
        {children}
      </span>
      {show ? (
        <span className="block mt-1 pt-1 border-t border-white/15 text-sm opacity-90">{ko}</span>
      ) : (
        <span onClick={() => setShow(true)} className="block mt-0.5 text-[11px] opacity-50 cursor-pointer">
          👆 탭하면 번역
        </span>
      )}
    </span>
  )
}
