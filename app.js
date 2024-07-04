require('dotenv').config();

const express = require("express");
const expressLayout = require("express-ejs-layouts")

const app = express();
const PORT = 5000;

const connectDB = require('./server/config/db');

app.use(express.static('public'));
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const User = require("./server/models/UserSchema");

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => User.findOne({email: email}),
  id => User.findById(id)
)


app.use(expressLayout);
app.set('layout','./layouts/main');
app.set('view engine','ejs')
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

connectDB();

app.use("/", require('./server/routes/main'))
app.use('/admin/applicant/uploads/', express.static('uploads'))



app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})