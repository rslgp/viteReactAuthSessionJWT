import pgPromise from 'pg-promise';

class PostgreSQLService {
    constructor(config) {
        this.db = pgPromise()(config);
    }

    // CREATE - Add a new row to the table
    async createRow(table, data) {
        const keys = Object.keys(data).join(", ");
        const values = Object.values(data);
        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(", ");
        const query = `INSERT INTO ${table} (${keys}) VALUES (${placeholders}) RETURNING *`;

        const result = await this.db.one(query, values);
        console.log('Row added:', result);
        return result;
    }

    // READ - Get all rows from the table
    async readRows(table) {
        const result = await this.db.any(`SELECT * FROM ${table}`);
        return result;
    }

    // READ - Get rows filtered by a specific column value
    async readFilteredRows(table, column, value) {
        const result = await this.db.any(`SELECT * FROM ${table} WHERE ${column} = $1`, [value]);
        return result;
    }

    // UPDATE - Update an existing row (based on a column value)
    async updateRow(table, updateData, filterColumn, filterValue) {
        const setClause = Object.keys(updateData).map((key, idx) => `${key} = $${idx + 1}`).join(", ");
        const values = Object.values(updateData);
        const query = `UPDATE ${table} SET ${setClause} WHERE ${filterColumn} = $${values.length + 1} RETURNING *`;

        const result = await this.db.oneOrNone(query, [...values, filterValue]);
        if (result) {
            console.log('Row updated:', result);
            return result;
        }
        return null;
    }

    // DELETE - Delete a row based on a condition
    async deleteRow(table, filterColumn, filterValue) {
        const result = await this.db.result(`DELETE FROM ${table} WHERE ${filterColumn} = $1`, [filterValue]);
        console.log(result.rowCount ? 'Row deleted' : 'Row not found');
        return result.rowCount > 0;
    }

    // DELETE - Delete all rows based on a condition
    async deleteAllRows(table, filterColumn, filterValue) {
        const result = await this.db.result(`DELETE FROM ${table} WHERE ${filterColumn} = $1`, [filterValue]);
        console.log(`${result.rowCount} rows deleted`);
        return result.rowCount;
    }
}

export { PostgreSQLService };