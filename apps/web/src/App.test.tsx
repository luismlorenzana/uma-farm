import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('shows the game name', () => expect(renderToString(<App />)).toContain('uma-farm'))
})
