import { vi } from 'vitest'

export function mockQuery<T>(data: T, error: any = null) {
  const chain: Record<string, any> = {}
  let promise: Promise<any> | null = null
  const getPromise = () => {
    if (!promise) promise = error ? Promise.reject(error) : Promise.resolve({ data, error: null })
    return promise
  }
  for (const method of ['select', 'eq', 'gte', 'lte', 'order', 'single', 'insert', 'update', 'in', 'maybeSingle']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.then = (resolve: any, reject: any) => getPromise().then(resolve, reject)
  chain.catch = (reject: any) => getPromise().catch(reject)
  return chain
}
