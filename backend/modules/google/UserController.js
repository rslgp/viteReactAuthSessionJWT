import { GoogleSheetService } from './GoogleSheetService.js'

const SHEET_ID = {
    user_pass: 0,
    active_auth_session: 1
}
class UserController {
    constructor(config) {
        const { sheetID, worker } = config;
        this.instance = new GoogleSheetService(sheetID, worker);
    }
    async init() {
        await this.instance.init();
    }

    setHeaders = async (sheet, headers) => {
        await sheet.setHeaderRow(headers, 1);

    }

    async firstSetup() {
        const config = { headerValues: [] };
        const user_content = await this.instance.accessSheet(SHEET_ID.user_pass);

        // config user pass sheet
        config.headerValues = ['username', 'password'];
        await user_content.setHeaderRow(config.headerValues, 1);

        //config active session
        config.headerValues = ['username', 'refreshToken', 'device'];
        try {
            const active_auth_session = await this.instance.accessSheet(SHEET_ID.active_auth_session);
            await active_auth_session.setHeaderRow(config.headerValues, 1);

        } catch (error) {
            await this.instance.doc.addSheet(config);
        }
    }
    async get(username) {
        const rows = await this.instance.readFilteredRow("username", username);
        return GoogleSheetService.rowToJSON(rows[0]);
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
        await this.instance.deleteAllRow("username", username, SHEET_ID.active_auth_session);
    }

    async getUserSessions(username) {
        const rows = await this.instance.readFilteredRow("username", username, SHEET_ID.active_auth_session);
        let formattedRows = [];
        for (const row of rows) {
            formattedRows.push(GoogleSheetService.rowToJSON(row));
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

    static generateWorker(email, key) {
        return GoogleSheetService.generateWorker(email, key);
    }

}
export default UserController;