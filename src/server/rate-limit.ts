import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Sliding-window limiter. If Upstash env is absent the limiter is a no-op so
// local dev and the first deploy still work.
const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

export const ratelimit = hasRedis
  ? new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(5, '10 m'), prefix: 'bravo' })
  : { limit: async (_key: string) => ({ success: true, limit: 0, remaining: 0, reset: 0 }) }
