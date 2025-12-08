  /*
  Joe Pepe, Oscar Nama, and Nick Zywalewski
  Database Management Systems
  12/3/2025
  Final Project
  Purpose: Implement desired functionality to contribute to a simulated travel agency website and database
  */
// mysql.js - The Database Connection Pool Module
require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');


// Configuration details
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    // Connection Pool settings are optional but good practice
    waitForConnections: true, 
    connectionLimit: 10,
    queueLimit: 0
};

// Create and export the connection pool
const pool = mysql.createPool(dbConfig);

// A simple check to ensure the pool is working on startup
pool.getConnection()
    .then(connection => {
        console.log("Database Pool: MySQL connection successful and pool established.");
        connection.release(); // Release the test connection immediately
    })
    .catch(err => {
        console.error("Database Pool Error: Could not connect to MySQL! Check credentials and if the server is running.", err.message);
    });

module.exports = pool;