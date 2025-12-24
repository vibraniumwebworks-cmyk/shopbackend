const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure 'uploads' folder exists
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}

// --- DATABASE CONNECTION ---
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',      // YOUR MYSQL USERNAME
    password: 'manager',      // YOUR MYSQL PASSWORD
    database: 'trichy_pos',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

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

// 1. GET ALL PRODUCTS
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 2. ADD PRODUCT (With Image)
app.post('/api/products', upload.single('image'), (req, res) => {
    const { name, price, category, unit, gst } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    const sql = 'INSERT INTO products (name, price, category, unit, gst, image) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, price, category, unit, gst, image], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Product added', id: result.insertId });
    });
});

// 3. DELETE PRODUCT
app.delete('/api/products/:id', (req, res) => {
    db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Product deleted' });
    });
});

// 4. UPDATE PRODUCT (For Edit)
app.put('/api/products/:id', upload.single('image'), (req, res) => {
    const { name, price, category, unit, gst } = req.body;
    const id = req.params.id;
    
    // First, get the old image to preserve it if no new image is uploaded
    let sql = 'UPDATE products SET name=?, price=?, category=?, unit=?, gst=?';
    let params = [name, price, category, unit, gst];

    if (req.file) {
        sql += ', image=?';
        params.push(`/uploads/${req.file.filename}`);
    }
    
    sql += ' WHERE id=?';
    params.push(id);

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Product updated' });
    });
});

// 5. SAVE ORDER (Bill)
app.post('/api/orders', (req, res) => {
    const { customer_name, phone, address, order_type, total_amount, paid_amount, due_amount, items } = req.body;
    
    // 'items' must be a JSON string
    const itemsJson = JSON.stringify(items); 

    const sql = `INSERT INTO orders 
    (customer_name, phone, address, order_type, total_amount, paid_amount, due_amount, items) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [customer_name, phone, address, order_type, total_amount, paid_amount, due_amount, itemsJson], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Order saved successfully', orderId: result.insertId });
    });
});

// 6. GET ALL ORDERS (For Admin)
// 6. GET ALL ORDERS (For Admin) - SAFER VERSION
app.get('/api/orders', (req, res) => {
    db.query('SELECT * FROM orders ORDER BY order_date DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        
        const parsedResults = results.map(row => {
            let parsedItems = [];
            try {
                // Try to parse the items. If it fails, use an empty list []
                parsedItems = JSON.parse(row.items || "[]");
            } catch (error) {
                console.log(`Skipping bad data in Order #${row.id}`);
                parsedItems = []; 
            }
            
            return {
                ...row,
                items: parsedItems
            };
        });
        
        res.json(parsedResults);
    });
});

// 7. UPDATE ORDER PAYMENT (Pay Balance)
app.put('/api/orders/:id/pay', (req, res) => {
    const { amount } = req.body;
    const id = req.params.id;

    // First get current order
    db.query('SELECT * FROM orders WHERE id = ?', [id], (err, results) => {
        if(err || results.length === 0) return res.status(500).json({error: "Order not found"});
        
        const order = results[0];
        const newPaid = parseFloat(order.paid_amount) + parseFloat(amount);
        const newDue = parseFloat(order.total_amount) - newPaid;

        db.query('UPDATE orders SET paid_amount = ?, due_amount = ? WHERE id = ?', 
            [newPaid, newDue, id], 
            (err, updateRes) => {
                if(err) return res.status(500).json(err);
                res.json({ message: 'Payment updated', newDue });
            }
        );
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});