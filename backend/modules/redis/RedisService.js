import Redis from 'ioredis';

class RedisService {
    constructor(config) {
        this.redis = new Redis(config);
    }

    // CREATE - Set a key-value pair
    async setKey(key, value) {
        await this.redis.set(key, JSON.stringify(value));
        console.log('Key set:', key);
    }

    // READ - Get value for a key
    async getKey(key) {
        const result = await this.redis.get(key);
        return result ? JSON.parse(result) : null;
    }

    // DELETE - Delete a key
    async deleteKey(key) {
        const result = await this.redis.del(key);
        console.log(result ? 'Key deleted' : 'Key not found');
        return result > 0;
    }

    // CHECK - Check if a key exists
    async hasKey(key) {
        const result = await this.redis.exists(key);
        return result === 1;
    }

    // READ - Get all keys (this could be useful for getting all users or sessions, but be careful on large datasets)
    async getAllKeys(pattern = '*') {
        const keys = await this.redis.keys(pattern);
        return keys;
    }
}

export { RedisService };
