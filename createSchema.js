const mysql = require('mysql2');

// Connect to Clever Cloud
const db = mysql.createPool({
    uri: 'mysql://ulcrkclsjnwefdx6:xDd6Qi41rcgkaf00JCXO@bep61l9gjrschc9drmsh-mysql.services.clever-cloud.com:3306/bep61l9gjrschc9drmsh',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const createTableSQL = `
CREATE TABLE IF NOT EXISTS products (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50),
    gst DECIMAL(5, 2),
    image VARCHAR(255),
    PRIMARY KEY (id)
);`;

// Data from your previous requests
const insertDataSQL = `
INSERT INTO products (id, name, price, category, unit, gst, image) VALUES
(1, 'Gulab Jamun', 600.00, 'Sweets', 'kg', 5.00, 'Gulab jamun.png'),
(2, 'Gajar Ka Halwa', 550.00, 'Sweets', 'kg', 5.00, 'Gajar ka halwa.png'),
(3, 'Mysore Pak', 720.00, 'Sweets', 'kg', 5.00, 'Mysore pak.png'),
(4, 'Jalebi', 400.00, 'Sweets', 'kg', 5.00, 'Jalebi.png'),
(5, 'Kaju Barfi', 900.00, 'Sweets', 'kg', 5.00, 'Barfi.png'),
(6, 'Tirunelveli Halwa', 680.00, 'Sweets', 'kg', 5.00, 'Tirunelveli Halwa.png'),
(7, 'Srivilliputhur Palkova', 480.00, 'Sweets', 'kg', 5.00, 'Srivilliputhur Palkova.png'),
(8, 'Rasmalai', 650.00, 'Sweets', 'kg', 5.00, 'https://via.placeholder.com/150'),
(9, 'Coconut Ladoo', 400.00, 'Sweets', 'kg', 5.00, 'Coconut ladoo.png'),
(10, 'Murukku', 280.00, 'Snacks', 'kg', 5.00, 'Thenkuzhal Murukku.png'),
(11, 'Kara Murukku', 280.00, 'Snacks', 'kg', 5.00, 'Kara Murukku.png'),
(12, 'Mixture', 320.00, 'Snacks', 'kg', 5.00, 'Spicy Mixture.png'),
(13, 'Kheer', 300.00, 'Sweets', 'kg', 5.00, 'Kheer.png'),
(14, 'Banana Chips', 450.00, 'Snacks', 'kg', 5.00, 'Banana Chips.png'),
(15, 'Kadalai Mittai', 260.00, 'Snacks', 'kg', 5.00, 'Kadalai Mittai.png'),
(16, 'Rusks', 220.00, 'Snacks', 'kg', 5.00, 'Rusks.png'),
(17, 'Veg Puff', 25.00, 'Snacks', 'pc', 5.00, 'Veg Puff.png'),
(18, 'Cookies', 350.00, 'Snacks', 'kg', 5.00, 'Cookies.png'),
(19, 'Chicken Puff', 40.00, 'Snacks', 'pc', 5.00, 'chicken puff.png'),
(20, 'Rose Milk', 60.00, 'Juices', 'pc', 0.00, 'Rose Milk.png'),
(21, 'Badam Milk', 70.00, 'Juices', 'pc', 0.00, 'Badam Milk.png'),
(22, 'Lime Juice', 40.00, 'Juices', 'pc', 0.00, 'Lime Juice.png'),
(99, 'Mixed Sweets & Snacks', 500.00, 'Sweets', 'kg', 5.00, 'mix.png')
ON DUPLICATE KEY UPDATE 
name=VALUES(name), price=VALUES(price);
`;

async function setupDatabase() {
    try {
        console.log("⏳ Creating Table on Clever Cloud...");
        await db.promise().query(createTableSQL);
        console.log("✅ Table 'products' is ready.");

        console.log("⏳ Inserting Product Data...");
        await db.promise().query(insertDataSQL);
        console.log("✅ All products inserted successfully!");

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

setupDatabase();