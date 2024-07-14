require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./db/connection');
const PORT = process.env.PORT || 8000;

const userRouter = require('./routers/auth.router')
const courseRouter = require('./routers/course.router')
const studentRouter = require('./routers/student.router')
const assignmentRouter = require('./routers/assignment.router')
const forumRouter = require('./routers/forum.router')
const routineRouter = require('./routers/routine.router')

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser());


//Routes

app.get('/', (req, res) => {
    res.json({ "message": "Welcome to classX" });
});

app.use('/api/v1/user', userRouter)
app.use('/api/v1/course', courseRouter)
app.use('/api/v1/student', studentRouter)
app.use('/api/v1/course/assignment', assignmentRouter)
app.use('/api/v1/course/forum', forumRouter)
app.use('/api/v1/course/routine', routineRouter)

app.listen(PORT, async () => {
    try {
        await pool.connect();
        console.log('Connected to the database successfully');
        console.log(`The server is listening at port ${PORT}`);
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
})
