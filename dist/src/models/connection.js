"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.pool = exports.db = void 0;
const mysql2_1 = require("drizzle-orm/mysql2");
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create the MySQL connection pool
const poolConnection = promise_1.default.createPool({
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "cms_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
// Create drizzle instance
exports.db = (0, mysql2_1.drizzle)(poolConnection);
// Export the pool for raw queries if needed
exports.pool = poolConnection;
// Connection test function
const connectDB = async () => {
    try {
        const connection = await poolConnection.getConnection();
        console.log("MySQL connected successfully");
        connection.release();
    }
    catch (error) {
        console.error("MySQL connection failed:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
