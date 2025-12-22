const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');

const app = express();
// Railway or Render will provide a PORT, otherwise use 3000
const PORT = process.env.PORT || 3000;

// --- 1. DATABASE CONNECTION (Using your Railway Link) ---
const db = mysql.createPool({
    host: 'interchange.proxy.rlwy.net',
    user: 'root',
    password: 'SZXYvSQkmLJoulMwDfcYiBRBrMziClbF',
    database: 'railway',
    port: 57840,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection when the server starts
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err.message);
    } else {
        console.log('✅ Connected to Railway Database Successfully!');
        connection.release();
    }
});

// --- 2. MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve HTML files from the 'public' folder
app.use(express.static('public'));

// Serve uploaded images from the 'uploads' folder
app.use('/uploads', express.static('uploads'));

// --- 3. IMAGE UPLOAD CONFIG ---
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        // Name file: fieldname-timestamp.png
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 4. API ROUTES ---

// Root Route (To check if server is running)
app.get('/', (req, res) => {
    res.send("✅ Trichy Sweets Backend is Running on Railway Database!");
});

// GET ALL PRODUCTS
app.get('/api/products', (req, res) => {
    const sql = "SELECT * FROM products ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// ADD NEW PRODUCT
app.post('/api/products', upload.single('image'), (req, res) => {
    const { name, price, category, unit, gst } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : 'https://via.placeholder.com/150';

    const sql = "INSERT INTO products (name, price, category, unit, gst, image) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, price, category, unit, gst, image], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Product added!", id: result.insertId });
    });
});

// EDIT PRODUCT
app.put('/api/products/:id', upload.single('image'), (req, res) => {
    const id = req.params.id;
    const { name, price, category, unit, gst } = req.body;
    
    let sql = "";
    let params = [];

    if (req.file) {
        sql = "UPDATE products SET name=?, price=?, category=?, unit=?, gst=?, image=? WHERE id=?";
        params = [name, price, category, unit, gst, `/uploads/${req.file.filename}`, id];
    } else {
        sql = "UPDATE products SET name=?, price=?, category=?, unit=?, gst=? WHERE id=?";
        params = [name, price, category, unit, gst, id];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Updated successfully" });
    });
});

// DELETE PRODUCT
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM products WHERE id=?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Deleted successfully" });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});