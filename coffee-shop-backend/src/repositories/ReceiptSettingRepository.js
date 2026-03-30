const db = require("../config/database");

class ReceiptSettingRepository {
    async findActive() {
        const sql = `
            SELECT *
            FROM receipt_settings
            WHERE is_active = TRUE
            ORDER BY updated_at DESC, id DESC
            LIMIT 1
        `;
        const [rows] = await db.query(sql);
        return rows[0] || null;
    }

    async create(data) {
        const sql = `
            INSERT INTO receipt_settings
            (store_name, address, phone, header_lines, footer_lines, logo_url, is_active, open_time, close_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            data.store_name ?? null,
            data.address ?? null,
            data.phone ?? null,
            JSON.stringify(data.header_lines ?? []),
            JSON.stringify(data.footer_lines ?? []),
            data.logo_url ?? null,
            typeof data.is_active === "boolean" ? data.is_active : true,
            data.open_time ?? "07:00",
            data.close_time ?? "22:30",
        ]);

        return this.findById(result.insertId);
    }

    async updateById(id, data) {
        const fields = [];
        const values = [];

        if (data.store_name !== undefined) {
            fields.push("store_name = ?");
            values.push(data.store_name);
        }

        if (data.address !== undefined) {
            fields.push("address = ?");
            values.push(data.address);
        }

        if (data.phone !== undefined) {
            fields.push("phone = ?");
            values.push(data.phone);
        }

        if (data.header_lines !== undefined) {
            fields.push("header_lines = ?");
            values.push(JSON.stringify(data.header_lines));
        }

        if (data.footer_lines !== undefined) {
            fields.push("footer_lines = ?");
            values.push(JSON.stringify(data.footer_lines));
        }

        if (data.logo_url !== undefined) {
            fields.push("logo_url = ?");
            values.push(data.logo_url);
        }

        if (data.is_active !== undefined) {
            fields.push("is_active = ?");
            values.push(Boolean(data.is_active));
        }

        if (data.open_time !== undefined) {
            fields.push("open_time = ?");
            values.push(data.open_time);
        }

        if (data.close_time !== undefined) {
            fields.push("close_time = ?");
            values.push(data.close_time);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);

        const sql = `
            UPDATE receipt_settings
            SET ${fields.join(", ")}
            WHERE id = ?
        `;

        const [result] = await db.query(sql, values);

        if (result.affectedRows === 0) {
            return null;
        }

        return this.findById(id);
    }

    async deactivateAll(exceptId = null) {
        const sql = exceptId
            ? "UPDATE receipt_settings SET is_active = FALSE WHERE id <> ?"
            : "UPDATE receipt_settings SET is_active = FALSE";
        const params = exceptId ? [exceptId] : [];
        await db.query(sql, params);
    }

    async findById(id) {
        const [rows] = await db.query("SELECT * FROM receipt_settings WHERE id = ?", [
            id,
        ]);
        return rows[0] || null;
    }
}

module.exports = new ReceiptSettingRepository();