import { createClient } from 'redis';
import { promisify } from 'util';

/**
 * Represents a Redis client for interacting with a Redis database.
 * This class provides methods to perform common operations in Redis,
 * including setting, getting, and deleting keys, as well as checking
 * the connection status. It utilizes Promises to facilitate asynchronous
 * operations, allowing for more straightforward error handling and
 * cleaner code.
 *
 * The RedisClient establishes a connection to the Redis server upon
 * instantiation and handles error reporting and connection readiness
 * notifications. The class methods are designed to be easy to use,
 * allowing developers to quickly integrate Redis functionality
 * into their applications without needing to manage the connection
 * or error handling directly.
 */
class RedisClient {
  constructor() {
    this.client = createClient();

    this.client
      .on('error', (error) => console.log(`Redis client not connected to the server: ${error}`))
      .on('ready', () => {
        console.log('Redis client connected to the server');
      });

    this.getAsync = promisify(this.client.GET).bind(this.client);
  }

  /**
   * Check if the Redis client connection is active
   * @returns {boolean} true if connected, false otherwise
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Get the value of a key
   * @param {string} key - Redis key
   * @returns {Promise<string>} value associated with the key
   */
  async get(key) {
    try {
      return await this.getAsync(key);
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  /**
   * Set a key with an expiration time
   * @param {string} key - Redis key
   * @param {string} value - Value to be stored
   * @param {number} duration - Expiration time in seconds
   */
  async set(key, value, duration) {
    await this.client.SET(key, value, 'EX', duration, (err) => {
      if (err) {
        console.log(`Error setting ${key} with expiration: ${err}`);
      }
    });
  }

  /**
   * Delete a key
   * @param {string} key - Redis key to delete
   */
  async del(key) {
    await this.client.DEL(key, (err, reply) => {
      if (err) {
        console.log(`Error deleting key ${key}: ${err}`);
      } else {
        console.log(reply);
      }
    });
  }
}

const redisClient = new RedisClient();
export default redisClient;
