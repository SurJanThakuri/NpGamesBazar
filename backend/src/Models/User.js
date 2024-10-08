import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  googleId: {
    type: String,
    unique: true, // Ensures no two users can have the same Google ID
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  refreshToken: {
    type: String,
  },
}, {
  timestamps: true,
});

// Pre-save hook to hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
  return jwt.sign({
       _id: this._id,
       name: this.name,
       email: this.email,
        role: this.role,
        username: this.username,
   },
   
   process.env.ACCESS_TOKEN_SECRET, {
       expiresIn: process.env.ACCESS_TOKEN_EXPIRY
   })
}

userSchema.methods.generateRefreshToken = function(){
  return jwt.sign({
      _id: this._id
  },
  
  process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  })
}

// Prevent model overwrite
export const User = mongoose.models.User || mongoose.model('User', userSchema);
