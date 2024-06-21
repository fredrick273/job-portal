const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
    fullName: { type: String },
    phoneNumber: { type: String },
    address: { type: String },
    education: [{
      degree: String,
      institution: String,
      yearOfCompletion: String
    }],
    experience: [{
      company: String,
      title: String,
      years: Number,
      description: String
    }],
    skills: [String],
    resume: { type: String }, 
    
    companyName: { type: String },
    companyWebsite: { type: String },
    companyDescription: { type: String }
  });

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: { type: ProfileSchema, required: false}
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
