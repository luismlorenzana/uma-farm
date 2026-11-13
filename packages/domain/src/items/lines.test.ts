// The material lines and items' names from their uma-art ids.
import { describe, expect, it } from 'vitest'
import { itemNameOf, MATERIAL_LINES } from './lines'

describe('the material lines', () => {
  it('holds the five lines in order', () => {
    expect(MATERIAL_LINES).toEqual(['metal', 'wood', 'vegetables', 'fish', 'stone'])
  })

  it('names an item from its id, two words keeping their marks', () => {
    expect(itemNameOf('copper-ore')).toBe('Copper Ore')
    expect(itemNameOf('tomato-puree')).toBe('Tomato Purée')
    expect(itemNameOf('cut-philosophers-stone')).toBe("Cut Philosopher's Stone")
  })
})
