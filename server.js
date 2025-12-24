const express = require('express');
const Database = require('better-sqlite3'); 
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// --- 1. CONFIGURATION ---
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure 'uploads' folder exists
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}

// --- 2. DATABASE CONNECTION (SQLite) ---
const db = new Database('trichy.db', { verbose: console.log });
console.log('✅ Connected to SQLite database (trichy.db)');

// --- 3. CREATE TABLES AUTOMATICALLY ---
db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        category TEXT,
        unit TEXT,
        gst REAL,
        image TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        phone TEXT,
        address TEXT,
        order_type TEXT,
        total_amount REAL,
        paid_amount REAL,
        due_amount REAL,
        items TEXT, 
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// --- 4. BULK ADD PRODUCTS (SEEDING) ---
// This runs automatically if the database is found empty
const productCount = db.prepare('SELECT count(*) as count FROM products').get();

if (productCount.count === 0) {
    console.log("⚡ Database is empty. Adding bulk products...");

    const insert = db.prepare('INSERT INTO products (name, price, category, unit, gst, image) VALUES (?, ?, ?, ?, ?, ?)');

    // === YOUR FULL PRODUCT LIST ===
    const initialProducts = [
        { name: "Gulab Jamun", price: 600, category: "Sweets", unit: "kg", gst: 5, image: "Gulab jamun.png" },
        { name: "Gajar Ka Halwa", price: 550, category: "Sweets", unit: "kg", gst: 5, image: "Gajar ka halwa.png" },
        { name: "Mysore Pak", price: 720, category: "Sweets", unit: "kg", gst: 5, image: "Mysore pak.png" },
        { name: "Jalebi", price: 400, category: "Sweets", unit: "kg", gst: 5, image: "Jalebi.png" },
        { name: "Kaju Barfi", price: 900, category: "Sweets", unit: "kg", gst: 5, image: "Barfi.png" },
        { name: "Tirunelveli Halwa", price: 680, category: "Sweets", unit: "kg", gst: 5, image: "Tirunelveli Halwa.png" },
        { name: "Srivilliputhur Palkova", price: 480, category: "Sweets", unit: "kg", gst: 5, image: "Srivilliputhur Palkova.png" },
        { name: "Rasmalai", price: 650, category: "Sweets", unit: "kg", gst: 5, image: "/uploads/1765866830601.png" },
        { name: "Coconut Ladoo", price: 400, category: "Sweets", unit: "kg", gst: 5, image: "Coconut ladoo.png" },
        { name: "Kheer", price: 300, category: "Sweets", unit: "kg", gst: 5, image: "Kheer.png" },
        { name: "Mixed Sweets & Snacks", price: 500, category: "Sweets", unit: "kg", gst: 5, image: "mix.png" },
        { name: "Murukku", price: 280, category: "Snacks", unit: "kg", gst: 5, image: "Thenkuzhal Murukku.png" },
        { name: "Kara Murukku", price: 280, category: "Snacks", unit: "kg", gst: 5, image: "Kara Murukku.png" },
        { name: "Mixture", price: 320, category: "Snacks", unit: "kg", gst: 5, image: "Spicy Mixture.png" },
        { name: "Banana Chips", price: 450, category: "Snacks", unit: "kg", gst: 5, image: "Banana Chips.png" },
        { name: "Kadalai Mittai", price: 260, category: "Snacks", unit: "kg", gst: 5, image: "Kadalai Mittai.png" },
        { name: "Rusks", price: 220, category: "Snacks", unit: "kg", gst: 5, image: "Rusks.png" },
        { name: "Veg Puff", price: 25, category: "Snacks", unit: "pc", gst: 5, image: "Veg Puff.png" },
        { name: "Cookies", price: 350, category: "Snacks", unit: "kg", gst: 5, image: "Cookies.png" },
        { name: "Chicken Puff", price: 40, category: "Snacks", unit: "pc", gst: 5, image: "chicken puff.png" },
        { name: "Rose Milk", price: 60, category: "Juices", unit: "pc", gst: 0, image: "Rose Milk.png" },
        { name: "Badam Milk", price: 70, category: "Juices", unit: "pc", gst: 0, image: "Badam Milk.png" },
        { name: "Lime Juice", price: 40, category: "Juices", unit: "pc", gst: 0, image: "Lime Juice.png" }
    ];

    // Use a transaction for fast bulk insertion
    const insertMany = db.transaction((products) => {
        for (const p of products) insert.run(p.name, p.price, p.category, p.unit, p.gst, p.image);
    });

    insertMany(initialProducts);
    console.log(`✅ Successfully added ${initialProducts.length} products!`);
}


// --- IMAGE UPLOAD CONFIG ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ================= ROUTES =================

// Root Route
app.get('/', (req, res) => {
    res.send('Backend is Running with Better-SQLite3! 🚀');
});

// 1. GET ALL PRODUCTS
app.get('/api/products', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM products').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ADD PRODUCT
app.post('/api/products', upload.single('image'), (req, res) => {
    try {
        const { name, price, category, unit, gst } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : '';

        const stmt = db.prepare('INSERT INTO products (name, price, category, unit, gst, image) VALUES (?, ?, ?, ?, ?, ?)');
        const info = stmt.run(name, price, category, unit, gst, image);
        
        res.json({ message: 'Product added', id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. DELETE PRODUCT
app.delete('/api/products/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM products WHERE id = ?');
        stmt.run(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. UPDATE PRODUCT
app.put('/api/products/:id', upload.single('image'), (req, res) => {
    try {
        const { name, price, category, unit, gst } = req.body;
        const id = req.params.id;
        
        let sql = 'UPDATE products SET name=?, price=?, category=?, unit=?, gst=?';
        let params = [name, price, category, unit, gst];

        if (req.file) {
            sql += ', image=?';
            params.push(`/uploads/${req.file.filename}`);
        }
        
        sql += ' WHERE id=?';
        params.push(id);

        const stmt = db.prepare(sql);
        stmt.run(...params); 

        res.json({ message: 'Product updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. SAVE ORDER
app.post('/api/orders', (req, res) => {
    try {
        const { customer_name, phone, address, order_type, total_amount, paid_amount, due_amount, items } = req.body;
        const itemsJson = JSON.stringify(items); 

        const stmt = db.prepare(`INSERT INTO orders 
        (customer_name, phone, address, order_type, total_amount, paid_amount, due_amount, items) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        
        const info = stmt.run(customer_name, phone, address, order_type, total_amount, paid_amount, due_amount, itemsJson);
        
        res.json({ message: 'Order saved successfully', orderId: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. GET ALL ORDERS
app.get('/api/orders', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM orders ORDER BY order_date DESC').all();
        
        const parsedResults = rows.map(row => {
            let parsedItems = [];
            try { parsedItems = JSON.parse(row.items || "[]"); } 
            catch (e) { parsedItems = []; }
            return { ...row, items: parsedItems };
        });
        
        res.json(parsedResults);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. UPDATE ORDER PAYMENT
app.put('/api/orders/:id/pay', (req, res) => {
    try {
        const { amount } = req.body;
        const id = req.params.id;

        const payTransaction = db.transaction(() => {
            const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
            if (!order) throw new Error("Order not found");

            const newPaid = parseFloat(order.paid_amount) + parseFloat(amount);
            const newDue = parseFloat(order.total_amount) - newPaid;

            db.prepare('UPDATE orders SET paid_amount = ?, due_amount = ? WHERE id = ?')
              .run(newPaid, newDue, id);
            
            return newDue;
        });

        const newDue = payTransaction();
        res.json({ message: 'Payment updated', newDue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. DYNAMIC PORT ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
});