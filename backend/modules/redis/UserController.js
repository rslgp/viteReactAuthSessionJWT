import { RedisService } from './RedisService.js';

const MAP = ['user_pass', 'active_auth_session'];
const admin_config = { host: 'localhost', port: 6379 };
class UserController {
    constructor(config = admin_config) {
        this.redisService = new RedisService(config);
    }

    async init() {
        // Redis is schema-less, no need to define tables, just ensure that the keys are set
        console.log('UserController initialized');
    }

    // Set up user data (push a new user)
    async push(user) {
        const key = `${MAP[0]}:${user.username}`;
        await this.redisService.setKey(key, user);
    }

    // Get user data by username
    async get(username) {
        const key = `${MAP[0]}:${username}`;
        return await this.redisService.getKey(key);
    }

    // Check if user exists by username
    async has(username) {
        const key = `${MAP[0]}:${username}`;
        return await this.redisService.hasKey(key);
    }

    // Delete user by username
    async delete(username) {
        const key = `${MAP[0]}:${username}`;
        return await this.redisService.deleteKey(key);
    }

    // Add session data
    async addUserSessions(session) {
        const key = `${MAP[1]}:${session.username}:${session.refreshToken}`;
        await this.redisService.setKey(key, session);
    }

    // Get user sessions
    async getUserSessions(username) {
        const keys = await this.redisService.getAllKeys(`${MAP[1]}:${username}:*`);
        const sessions = [];
        for (const key of keys) {
            const session = await this.redisService.getKey(key);
            sessions.push(session);
        }
        return sessions;
    }

    // Delete all sessions for a user
    async deleteAllSessions(username) {
        const keys = await this.redisService.getAllKeys(`${MAP[1]}:${username}:*`);
        for (const key of keys) {
            await this.redisService.deleteKey(key);
        }
    }

    // Delete content based on filter column (e.g., username)
    async deleteContent(filterColumn, filterValue, table) {
        let pattern = "*";
        if (filterColumn == 'refreshToken') {
            pattern = `${MAP[table]}:*:${filterValue}`;
        }

        const keys = await this.redisService.getAllKeys(pattern);
        for (const key of keys) {
            await this.redisService.deleteKey(key);
        }
    }

    // Add content (session or user)
    async addContent(content_json, table) {
        if (MAP[table] === 'user_pass') {
            await this.push(content_json);
        } else if (MAP[table] === 'active_auth_session') {
            await this.addUserSessions(content_json);
        }
    }

    // Update content (e.g., for sessions or user data)
    async updateContent(content_json, column_name, column_value, table) {
        const key = `${table}:${column_name}:${column_value}`;
        await this.redisService.setKey(key, content_json);
    }
}

export default UserController;
