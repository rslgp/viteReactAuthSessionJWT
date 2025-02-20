import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import google_creds from './google_creds.json' with { "type": "json" }

const serviceAccountAuth = new JWT({
    // env var values here are copied from service account credentials generated by google
    // see "Authentication" section in docs for more info
    email: google_creds.client_email,
    key: google_creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

class GoogleSheetService {
    // The static instance will hold the singleton instance of the class
    // static instance;

    constructor(sheetID = "13LpsvbsydOoM_aKsjJO3HMmikVutRFnMq-dFsL_LvVc", worker = serviceAccountAuth) {
        // if (GoogleSheetService.instance) {
        //     return GoogleSheetService.instance;
        // }

        // // Singleton pattern: initialize the instance only once
        // GoogleSheetService.instance = this;

        this.sheetID = sheetID;
        this.worker = worker;
        this.doc = null;

        // new and after init
        // this.setup(sheetID, worker);
    }

    // Set up and authenticate the Google Spreadsheet
    async init() {
        await this.setup();
    }

    // Set up and authenticate the Google Spreadsheet
    async setup() {
        this.doc = new GoogleSpreadsheet(this.sheetID, this.worker);
        await this.doc.loadInfo();
        console.log('Google Sheet setup complete! ' + this.sheetID);
    }

    static generateWorker(email = google_creds.client_email, key = google_creds.private_key) {
        return new JWT({
            // env var values here are copied from service account credentials generated by google
            // see "Authentication" section in docs for more info
            email,
            key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }

    // Access the sheet object (used in CRUD operations)
    async accessSheet(index = 0) {
        if (!this.doc) {
            await this.setup();
        }
        return this.doc.sheetsByIndex[index];
    }

    // CREATE - Add a new row to the sheet
    async createRow(data, sheet_index = 0) {
        const sheet = await this.accessSheet(sheet_index);
        await sheet.addRow(data);
        console.log('Row added:', data);
    }

    static rowToJSON(row) {
        if (!row) return null;
        const formattedRow = {};
        row._worksheet._headerValues.forEach((header, index) => {
            formattedRow[header] = row._rawData[index];
        });
        formattedRow.instance = row;
        return formattedRow;
    }

    rowToJSON(row) {
        return GoogleSheetService.rowToJSON(row);
    }

    async readFilteredRow(filterColumn, filterValue, sheet_index = 0) {
        // Get the specific sheet by index
        const sheet = await this.accessSheet(sheet_index);

        // Load all rows (you can also use `sheet.getRows()` for more control)
        const rows = await sheet.getRows();

        const filterColumnIndex = sheet.headerValues.indexOf(filterColumn);
        // Filter rows based on the specified column and value
        const filteredRows = rows.filter(row => row._rawData[filterColumnIndex] === filterValue);

        // Return the filtered rows
        return filteredRows;
    }
    // READ - Get all rows from the sheet
    async readRows(sheet_index = 0) {
        const sheet = await this.accessSheet(sheet_index);
        const rows = await sheet.getRows();

        let result = [];
        for (const row of rows) {
            result.push(GoogleSheetService.rowToJSON(row));
        }
        return result;
    }

    // UPDATE - Update an existing row (based on a column value)
    async updateRow(updateData, filterColumn, filterValue, sheet_index = 0) {
        const rows = await this.readFilteredRow(filterColumn, filterValue, sheet_index);
        console.log(rows);
        const row = rows[0];
        if (row) {
            row.assign(updateData);
            await row.save();
            return true;
        }
        return false;
    }

    // DELETE - Delete a row based on a condition
    async deleteRow(filterColumn, filterValue, sheet_index = 0) {
        const rows = await this.readFilteredRow(filterColumn, filterValue, sheet_index);
        const row = rows[0];
        if (row) {
            await row.delete();
            console.log('Row deleted:', row);
        } else {
            console.log('Row not found.');
        }
    }

    async deleteAllRow(filterColumn, filterValue, sheet_index = 0) {
        const rows = await this.readFilteredRow(filterColumn, filterValue, sheet_index);
        for (const row of rows) {
            if (row) {
                await row.delete();
                console.log('Row deleted:', row);
            } else {
                console.log('Row not found.');
            }
        }
    }
}

export { GoogleSheetService };
export default new GoogleSheetService();