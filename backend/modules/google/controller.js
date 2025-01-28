import { GoogleSheetService } from './GoogleSheetService.js'

class Controller {
    constructor() {
        this.instance = new GoogleSheetService();
    }
    async init() {
        await this.instance.setup();
    }
    async get(username) {
        const rows = await this.instance.readFilteredRow("username", username);
        return rows[0];
    }

    async has(username) {
        const rows = await this.instance.readFilteredRow("username", username);
        return rows.length !== 0;
    }

    async push(user) {
        await this.instance.createRow(user);
    }

    async delete(username) {
        await this.instance.deleteAllRow("username", username);
    }

    async getUserSessions(username) {
        const rows = await this.instance.readFilteredRow("username", username, 1);
        return rows;
    }
}

export default new Controller();