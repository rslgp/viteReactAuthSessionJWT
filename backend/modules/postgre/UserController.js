import { PostgreSQLService } from './PostgreSQLService.js';

// use env
const admin_PostgreConfig = {
    dbConfig: {
        host: '0.tcp.sa.ngrok.io',
        port: 14491,
        database: 'mydatabase',
        user: 'myuser',
        password: 'mypassword'
    }
};

const MAP = ['user_pass', 'active_auth_session'];
class UserController {
    constructor(config = admin_PostgreConfig) {
        const { dbConfig } = config;
        this.instance = new PostgreSQLService(dbConfig);
    }

    async init() {
        // Setup user table and session table
        const userTableQuery = `CREATE TABLE IF NOT EXISTS user_pass (
            username VARCHAR PRIMARY KEY,
            password VARCHAR
        )`;
        await this.instance.db.none(userTableQuery);

        const sessionTableQuery = `CREATE TABLE IF NOT EXISTS active_auth_session (
            username VARCHAR REFERENCES user_pass(username),
            refreshToken VARCHAR,
            device VARCHAR
        )`; // postgre dont support case sensitive refreshToken
        await this.instance.db.none(sessionTableQuery);
    }

    async get(username) {
        const rows = await this.instance.readFilteredRows("user_pass", "username", username);
        return rows[0]; // Assuming first match is correct
    }

    async getRows(table) {
        console.log("GETROW", table);
        if (typeof (table) === 'number') table = MAP[table];
        const rows = await this.instance.readRows(table);
        return rows;
    }

    async has(username) {
        const rows = await this.instance.readFilteredRows("user_pass", "username", username);
        return rows.length !== 0;
    }

    async push(user) {
        await this.instance.createRow('user_pass', user);
    }

    async delete(username) {
        await this.instance.deleteRow('user_pass', 'username', username);
    }

    async deleteAllSessions(username) {
        await this.instance.deleteAllRows('active_auth_session', 'username', username);
    }

    async getUserSessions(username) {
        const rows = await this.instance.readFilteredRows('active_auth_session', 'username', username);
        console.log("getUserSessions", rows);
        return rows;
    }

    async addUserSessions(session) {
        await this.instance.createRow('active_auth_session', session);
    }

    async addContent(content_json, table) {
        console.log("addContent", table);
        if (typeof (table) === 'number') table = MAP[table];
        await this.instance.createRow(table, content_json);
    }

    async updateContent(content_json, column_name, column_value, table) {
        console.log("updateContent", table);
        if (typeof (table) === 'number') table = MAP[table];
        await this.instance.updateRow(table, content_json, column_name, column_value);
    }

    async deleteContent(filterColumn, filterValue, table) {
        if (typeof (table) === 'number') table = MAP[table];
        filterColumn = filterColumn.toLowerCase();
        await this.instance.deleteAllRows(table, filterColumn, filterValue);
    }
}

export default UserController;

