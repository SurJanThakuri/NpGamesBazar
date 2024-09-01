import express from "express";
import {registerUser, loginUser} from "../Controllers/user.controllers.js";

const router = express.Router();

// Define routes for user controllers
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;