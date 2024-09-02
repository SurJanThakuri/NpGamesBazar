import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from 'express-session';
import passport from './Utils/passport.js';

const app = express();

app.use(session({
    secret: 'a9d2120f7a5b3ff684641f108578ddae809b24c77e5edb3c2c40c13d394b96d5',
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import userRouter from "./Routes/user.routes.js";
import authRouter from "./Routes/auth.routes.js" 

// Declare routes
app.use("/api/v1/users", userRouter);
app.use("/auth", authRouter);

export { app };
