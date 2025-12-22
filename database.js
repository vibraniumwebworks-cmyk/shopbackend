const mysql = require('mysql2');

// Create the connection pool
const db = mysql.createPool({
    host: 'bep61l9gjrschc9drmsh-mysql.services.clever-cloud.com',  // Added quotes
    user: 'ulcrkclsjnwefdx6',      // Added quotes
    password: 'xDd6Qi41rcgkaf00JCXO',  // Added quotes
    database: 'bep61l9gjrschc9drmsh',  // Added quotes
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection immediately
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err.code);
        console.error('Details:', err.message);
    } else {
        console.log('✅ Connected to MySQL Database');
        connection.release();
    }
});

// Export the connection so server.js can use it
module.exports = db;