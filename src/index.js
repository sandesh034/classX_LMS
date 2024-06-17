require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./db/connection');
const userRouter = require('./routers/auth.router')
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());


//Routes
app.get('/', (req, res) => {
    res.json({ "message": "Welcome to classX" });
});
app.use('/api/v1/user', userRouter)


app.listen(PORT, async () => {
    try {
        await pool.connect();
        console.log('Connected to the database successfully');
        console.log(`The server is listening at port ${PORT}`);
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
})
