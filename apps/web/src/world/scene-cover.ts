const sceneParams = ['read', 'event', 'ask', 'memory', 'album', 'evening', 'level', 'household',
  'occasion', 'life', 'visits', 'visitReplay', 'visitMorning', 'gallery', 'stove']

export const sceneCoversWorld = (params: URLSearchParams): boolean => sceneParams.some(key => params.has(key))
