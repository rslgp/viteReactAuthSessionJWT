import { GoogleSheetService } from './GoogleSheetService.js'

class UserController {
    constructor(sheetID, worker) {
        this.instance = new GoogleSheetService(sheetID, worker);
    }
    async init() {
        await this.instance.init();
    }
    async get(username) {
        const rows = await this.instance.readFilteredRow("username", username);
        return this.instance.rowToJSON(rows[0]);
    }
    async getRows(sheet_index) {
        const rows = await this.instance.readRows(sheet_index);
        return rows;
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
    async deleteContent(filterColumn, filterValue, sheet_index = 0) {
        await this.instance.deleteAllRow(filterColumn, filterValue, sheet_index);
    }
    async deleteAllSessions(username) {
        await this.instance.deleteAllRow("username", username, 1);
    }

    async getUserSessions(username) {
        const rows = await this.instance.readFilteredRow("username", username, 1);
        let formattedRows = [];
        for (const row of rows) {
            formattedRows.push(this.instance.rowToJSON(row));
        }
        return formattedRows;
    }

    async addUserSessions(session) {
        await this.instance.createRow(session, 1);
    }

    async addContent(content_json, sheet_index) {
        await this.instance.createRow(content_json, sheet_index);
    }
    async updateContent(content_json, column_name, column_value, sheet_index) {
        await this.instance.updateRow(content_json, column_name, column_value, sheet_index);
    }
}
export default UserController;