export function CastRing({ elapsed, meet, tapped = false }: { elapsed: number; meet: number; tapped?: boolean }) {
  const radius = Math.max(4, 28 * (1 + 2 * (meet - Math.min(elapsed, meet + 720)) / meet))
  return (
    <div className="relative mx-auto grid size-44 place-items-center" aria-hidden>
      <span className="absolute size-14 rounded-full border-4 border-[#3f7d3a]" />
      <span className="absolute rounded-full border-4 border-[#c2385e]" style={{ width: radius * 2, height: radius * 2, opacity: tapped ? 0.3 : 1 }} data-ring={Math.round(radius)} />
    </div>
  )
}
