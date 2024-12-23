const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');


const bcrypt = require('bcrypt');

const app = express();
const port = 5502;
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Измените путь здесь
// Указываем папку для статических файлов
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(express.static(path.join(__dirname, '../pages'))); // Замените на вашу папку со статическими файлами

app.use(cors());
app.use(bodyParser.json());

// Настройка хранилища для multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads')); // Измените путь здесь
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Уникальное имя файла
    }
});

const upload = multer({ storage: storage });

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'golden_middle',
    password: 'XDemon',
    port: 5432,
});

// Route для загрузки аватарки
app.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
    const { userId } = req.body; // Предполагается, что вы передаете userId в теле запроса
    const avatarUrl = `http://localhost:${port}/uploads/${req.file.filename}`; // URL загруженного аватара

    try {
        await pool.query('UPDATE users SET avatar_url = \$1 WHERE id = \$2', [avatarUrl, userId]);
        res.status(200).json({ message: 'Аватарка успешно загружена', avatarUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Registration route

app.post('/register', async (req, res) => {
    const { email, username, first_name, last_name, password } = req.body;

    try {
        // Check for existing user
        const existingUser  = await pool.query(
            'SELECT * FROM users WHERE username = \$1 OR email = \$2',
            [username, email]
        );

        if (existingUser .rows.length > 0) {
            return res.status(400).json({ message: 'Пользователь с таким логином или почтой уже существует' });
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10); // 10 - это количество "соль" для хеширования

        // Insert new user into the database
        const result = await pool.query(
            'INSERT INTO users (email, username, first_name, last_name, password, avatar_url) VALUES (\$1, \$2, \$3, \$4, \$5, DEFAULT) RETURNING *',
            [email, username, first_name, last_name, hashedPassword]
        );

        res.status(201).json({ message: 'Пользователь успешно зарегистрировался', user: result.rows[0] });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE (username = \$1 OR email = \$1)',
            [username]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];

            // Сравниваем введённый пароль с хешированным паролем
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                // Сохраняем информацию о пользователе в localStorage
                res.status(200).json({
                    message: 'Успешный вход',
                    user: { id: user.id, username: user.username, avatar_url: user.avatar_url }
                });
            } else {
                res.status(401).json({ message: 'Неверный логин или пароль' });
            }
        } else {
            res.status(401).json({ message: 'Неверный логин или пароль' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});





app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Route для получения информации о пользователе
app.get('/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM users WHERE id = \$1', [id]);

        if (result.rows.length > 0) {
            res.status(200).json({ user: result.rows[0] });
        } else {
            res.status(404).json({ message: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});


app.get('/index.html', (req, res) => {
    console.log('Запрос к /index.html');
    res.sendFile(path.join(__dirname, '../pages/index.html'), (err) => {
        if (err) {
            console.error('Ошибка при отправке файла:', err);
            res.status(err.status).end();
        }
    });
});

app.get('/Catalog.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/Catalog.html'));
});

// Route для получения всех туров
app.get('/api/tours', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Tours WHERE available > 0'); // выбираем только доступные туры
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Route для получения тура по ID
app.get('/api/tours/:id', async (req, res) => {
    const tourId = parseInt(req.params.id);

    try {
        const result = await pool.query('SELECT * FROM Tours WHERE id = \$1 AND available > 0', [tourId]); // выбираем тур по ID
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]); // Возвращаем найденный тур
        } else {
            res.status(404).send('Тур не найден');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});
// Route for searching tours
app.get('/api/search', async (req, res) => {
    const { query } = req.query; // Get the search query from the request

    try {
        const result = await pool.query(
            'SELECT * FROM Tours WHERE available > 0 AND (name ILIKE \$1 OR short_description ILIKE \$1)',
            [`%${query}%`] // Using ILIKE for case-insensitive search
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});


app.post('/send-message', async (req, res) => {
    const { mail, message_text, user_id } = req.body; // Получаем user_id из тела запроса

    try {
        // Проверяем, существует ли пользователь с таким user_id
        const userResult = await pool.query('SELECT * FROM users WHERE id = \$1', [user_id]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Пользователь не найден' });
        }

        // Вставляем новое сообщение в базу данных
        const result = await pool.query(
            'INSERT INTO messages (mail, message_text, user_id) VALUES (\$1, \$2, \$3) RETURNING *',
            [mail, message_text, user_id]
        );

        res.status(201).json({ message: 'Сообщение успешно отправлено' });
    } catch (error) {
        console.error(error); // Логируем ошибку для отладки
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Route для уменьшения количества доступных туров
app.post('/api/tours/decrease-availability', async (req, res) => {
    console.log('Получен запрос:', req.method, req.path);
    const { tourId } = req.body; // Получаем ID тура из тела запроса

    try {
        // Уменьшаем количество доступных туров на 1
        const result = await pool.query(
            'UPDATE Tours SET available = available - 1 WHERE id = \$1 AND available > 0 RETURNING *',
            [tourId]
        );

        if (result.rows.length > 0) {
            res.status(200).json({ message: 'Количество доступных туров уменьшено', tour: result.rows[0] });
        } else {
            res.status(404).json({ message: 'Тур не найден или недоступен' });
        }
    } catch (error) {
        console.error('Ошибка при уменьшении доступных туров:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Route для увеличения количества доступных туров
app.post('/api/tours/increase-availability', async (req, res) => {
    const { tourId } = req.body; // Получаем ID тура из тела запроса

    try {
        // Увеличиваем количество доступных туров на 1
        const result = await pool.query(
            'UPDATE Tours SET available = available + 1 WHERE id = \$1 RETURNING *',
            [tourId]
        );

        if (result.rows.length > 0) {
            res.status(200).json({ message: 'Количество доступных туров увеличено', tour: result.rows[0] });
        } else {
            res.status(404).json({ message: 'Тур не найден' });
        }
    } catch (error) {
        console.error('Ошибка при увеличении доступных туров:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Route для получения изображений тура по ID
app.get('/api/tours/:tourId/images', async (req, res) => {
    const tourId = parseInt(req.params.tourId);

    try {
        // Измените запрос на использование таблицы tourimages
        const result = await pool.query('SELECT image_url FROM tourimages WHERE tour_id = \$1', [tourId]);

        if (result.rows.length > 0) {
            const images = result.rows.map(row => row.image_url); // Извлекаем URL изображений
            res.status(200).json(images); // Возвращаем массив изображений
        } else {
            res.status(404).json({ error: 'Изображения для данного тура не найдены' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

