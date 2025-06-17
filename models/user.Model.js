const mongoose = require('mongoose');
const { Schema, models, model } = mongoose;

const roletypes = {
  buyer: "buyer",
  broker: "broker",
  admin: "admin"
};

// User Schema (for Buyers, Brokers, and Admins)
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  role: { 
    type: String, 
    enum: ['buyer', 'broker', 'admin'], 
    required: true 
  },
  phone: { type: String },
  otp: { 
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  changecredentials: Date,
  image: { type: String, default: null },
  favourites: [{
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    property: { type: Schema.Types.ObjectId }
  }]
}, { timestamps: true });

// Create index for efficient querying
UserSchema.index({ email: 1 });


// Create or reuse Mongoose model
const userModel = models.User || model('User', UserSchema);

module.exports = {
  roletypes,
  userModel
};
