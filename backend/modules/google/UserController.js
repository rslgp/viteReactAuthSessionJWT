import { GoogleSheetService } from './GoogleSheetService.js'

class UserController {
    constructor() {
        this.instance = new GoogleSheetService();
    }
    async init() {
        await this.instance.setup();
    }
    async get(username) {
        const rows = await this.instance.readFilteredRow("username", username);
        return this.instance.rowToJSON(rows[0]);
    }

    async has(username) {
        const rows = await this.instance.readFilteredRow("username", username);
        return rows.length !== 0;
    }

    async push(user) {
        await this.instance.createRow(user);
    }

    async delete(username) {
        await this.instance.deleteRow("username", username);
    }
    async deleteAllSessions(username) {
        await this.instance.deleteAllRow("username", username, 1);
    }

    async getUserSessions(username) {
        const rows = await this.instance.readFilteredRow("username", username, 1);
        let formattedRows = [];
        for (const row in rows) {
            formattedRows.push(this.instance.rowToJSON(row));
        }
        return formattedRows;
    }
}

export default new UserController();