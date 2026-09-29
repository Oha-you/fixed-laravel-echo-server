import { DatabaseDriver } from './database-driver'
import { Log } from './../log'
import Redis from 'ioredis'

export class RedisDatabase implements DatabaseDriver {
  /**
   * Redis client.
   */
  private _redis: Redis

  /**
   * Create a new cache instance.
   */
  constructor(private options) {
    this._redis = new Redis(options.databaseConfig.redis)
  }

  /**
   * Retrieve data from redis.
   */
  get(key: string): Promise<any> {
    return this._redis.get(key).then(value => JSON.parse(value))
  }

  /**
   * Store data to cache.
   */
  set(key: string, value: any): void {
    this._redis.set(key, JSON.stringify(value))
      .catch(error => Log.error(`Redis set ${key} failed: ${error}`))
    if (this.options.databaseConfig.publishPresence === true && /^presence-.*:members$/.test(key))
      this._redis.publish('PresenceChannelUpdated', JSON.stringify({
        "event": {
          "channel": key,
          "members": value
        }
      })).catch(error => Log.error(`Redis publish ${key} failed: ${error}`))
  }
}
