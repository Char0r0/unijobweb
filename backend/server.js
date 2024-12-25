require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// 身份验证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// 登录路由
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (isValidPassword) {
                const token = jwt.sign(
                    { id: user.id, role: user.role, university_id: user.university_id },
                    process.env.JWT_SECRET
                );
                res.json({ token });
            } else {
                res.status(401).json({ error: '用户名或密码错误' });
            }
        } else {
            res.status(401).json({ error: '用户名或密码错误' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取工作岗位路由
app.get('/api/jobs', authenticateToken, async (req, res) => {
    try {
        let query = `
            SELECT j.*, u.name as university_name 
            FROM job_postings j 
            JOIN universities u ON j.university_id = u.id 
            WHERE 1=1
        `;
        
        const params = [];
        
        if (req.user.role === 'regular' && req.user.university_id) {
            query += ' AND j.university_id = $1';
            params.push(req.user.university_id);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取所有用户
app.get('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: '没有权限访问' });
    }

    try {
        const result = await pool.query('SELECT id, username, role, university_id FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取所有大学
app.get('/api/universities', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM universities');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新用户信息
app.put('/api/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: '没有权限修改' });
    }

    const { id } = req.params;
    const { role, university_id } = req.body;

    try {
        await pool.query(
            'UPDATE users SET role = $1, university_id = $2 WHERE id = $3',
            [role, university_id, id]
        );
        res.json({ message: '更新成功' });
    } catch (err) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 注册路由
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 检查用户名是否已存在
        const userExists = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 创建新用户
        const result = await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
            [username, hashedPassword, 'regular']
        );

        // 生成JWT令牌
        const token = jwt.sign(
            { id: result.rows[0].id, role: 'regular' },
            process.env.JWT_SECRET
        );

        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '服务器错误' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`服务器运行在端口 ${PORT}`)); 