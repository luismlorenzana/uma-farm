import { beginTempering, finishTool, type ToolOrder } from '@farm/domain'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useRef, useState } from 'react'
import { changeHomestead } from './homestead-actions'

export function Tempering({ order }: { order: ToolOrder }) {
  const [active, setActive] = useState(false)
  const [strikes, setStrikes] = useState<boolean[]>([])
  const [ready, setReady] = useState(false)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')
  const writing = useRef(false)
  const hits = strikes.filter(Boolean).length
  const complete = strikes.length === 5
  useEffect(() => {
    if (!active || !started || complete) return
    const heat = setTimeout(() => setReady(true), 720 + (strikes.length % 3) * 180)
    return () => clearTimeout(heat)
  }, [active, started, complete, strikes.length])
  useEffect(() => {
    if (!ready) return
    const cool = setTimeout(() => {
      setReady(false)
      setStrikes(old => old.length === strikes.length ? [...old, false] : old)
    }, 650)
    return () => clearTimeout(cool)
  }, [ready, strikes.length])
  const submit = async (kind: 'begin' | 'standard' | 'stamped') => {
    if (writing.current) return
    writing.current = true
    setError('')
    try {
      await changeHomestead(save => kind === 'begin' ? beginTempering(save, order.ordered) : finishTool(save, order.ordered, kind === 'stamped'))
      setActive(kind === 'begin')
    } catch (err) { setError(err instanceof Error ? err.message : 'Try again.') }
    finally { writing.current = false }
  }
  return <div className="mt-1 space-y-1">
    {error && <p role="alert" className="text-danger">{error}</p>}
    {!active ? order.finish ? <p>{order.finish === 'stamped' ? 'Maker’s stamp earned' : 'Standard finish'}</p>
      : <><p className="text-ink-soft">Hit three of five Ready cues to add a maker’s stamp.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void submit('begin')}>Start tempering</Button>
          <Button variant="secondary" onClick={() => void submit('standard')}>Skip</Button>
        </div></>
      : !complete ? <div className="flex flex-wrap items-center gap-2">
        {!started ? <Button onClick={() => setStarted(true)}>Start five strikes</Button>
          : <Button aria-label={ready ? 'Strike now' : 'Strike'} variant={ready ? 'primary' : 'secondary'} onClick={() => {
            setStrikes(old => old.length === strikes.length ? [...old, ready] : old)
            setReady(false)
          }}>{ready ? 'Ready · Strike' : 'Heating…'}</Button>}
        <span aria-live="polite">{strikes.length}/5 strikes · {hits} on cue</span>
        <Button variant="secondary" onClick={() => void submit('standard')}>Skip</Button>
      </div>
      : <Button onClick={() => void submit(hits >= 3 ? 'stamped' : 'standard')}>{hits >= 3 ? 'Apply maker’s stamp' : 'Finish standard'}</Button>}
  </div>
}
