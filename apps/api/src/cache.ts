// Tiny cache for slow, read-heavy endpoints (species list, reports).
// Uses Redis when REDIS_URL is set, otherwise an in-memory Map (fine for dev).
import Redis from 'ioredis'

type Store = {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  del(prefix: string): Promise<void>
}

function memoryStore(): Store {
  const map = new Map<string, { value: string; expires: number }>()
  return {
    async get(key) {
      const hit = map.get(key)
      if (!hit || hit.expires < Date.now()) return null
      return hit.value
    },
    async set(key, value, ttlSeconds) {
      map.set(key, { value, expires: Date.now() + ttlSeconds * 1000 })
    },
    async del(prefix) {
      for (const key of map.keys()) if (key.startsWith(prefix)) map.delete(key)
    },
  }
}

function redisStore(url: string): Store {
  const redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 })
  return {
    get: (key) => redis.get(key),
    async set(key, value, ttlSeconds) {
      await redis.set(key, value, 'EX', ttlSeconds)
    },
    async del(prefix) {
      const keys = await redis.keys(`${prefix}*`)
      if (keys.length) await redis.del(...keys)
    },
  }
}

const store: Store = process.env.REDIS_URL ? redisStore(process.env.REDIS_URL) : memoryStore()

export async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  try {
    const hit = await store.get(key)
    if (hit) return JSON.parse(hit) as T
  } catch (e) {
    console.warn('cache read failed', e)
  }
  const value = await load()
  store.set(key, JSON.stringify(value), ttlSeconds).catch((e) => console.warn('cache write failed', e))
  return value
}

export function invalidate(prefix: string) {
  return store.del(prefix).catch((e) => console.warn('cache invalidate failed', e))
}
