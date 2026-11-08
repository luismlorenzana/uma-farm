import { AuthProvider } from '@luismlorenzana/uma-kit/auth'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

describe('Home', () => {
  it("shows the farm's name and its three rows", () => {
    const html = renderToString(<AuthProvider config={null}><HomePage /></AuthProvider>)
    expect(html).toContain('uma-farm')
    for (const row of ['Signed in', 'Save', 'Master data']) expect(html).toContain(`data-row="${row}"`)
  })
})
