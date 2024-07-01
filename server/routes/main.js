const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const multer = require('multer');
const path = require('path');

const Job = require("../models/JobSchema");
const User = require("../models/UserSchema");

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get("", (req, res) => {
    console.log(req.user);
    res.render("index");
});

router.get('/jobs', async (req, res) => {
    try {
        console.log(req.user);
        const jobs = await Job.find();
        res.render('jobs.ejs', { jobs });
    } catch (error) {
        console.log(error);
    }
});

router.get('/job/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        console.log(job);
        res.send(job);
    } catch (error) {
        console.log(error);
    }
});

router.get("/jobs/register", (req, res) => {
    res.render("job");
});

router.post('/jobs/register', async (req, res) => {
    try {
        const newJob = new Job({
            title: req.body.name,
            description: req.body.desc,
            location: req.body.loc,
            active: false,
            type: "full-time"
        });
        await Job.create(newJob);
        res.redirect('/');
    } catch (error) {
        console.log(error);
    }
});

router.post('/search', async (req, res) => {
    const searchterm = req.body.search;

    try {
        const jobs = await Job.find({
            title: { $regex: new RegExp(searchterm, 'i') }
        });
        res.render('jobs', { jobs });
    } catch (error) {
        console.log(error);
    }
});

router.get('/login', async (req, res) => {
    res.render('login.ejs');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get('/register', async (req, res) => {
    res.render('register.ejs');
});

router.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            email: req.body.email,
            password: hashedPassword
        });

        await User.create(newUser);
        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
});

router.get('/logout', (req, res) => {
    req.logOut(function (err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
});

router.get('/profile', checkAuthenticated, (req, res) => {
    res.render('profile.ejs', { user: req.user });
});

router.post('/profile', checkAuthenticated, upload.single('resume'), async (req, res) => {
    try {
        const updatedProfile = {
            fullName: req.body.fullName,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            education: req.body.education ? req.body.education.map(edu => ({
                degree: edu.degree,
                institution: edu.institution,
                yearOfCompletion: edu.yearOfCompletion
            })) : [],
            experience: req.body.experience ? req.body.experience.map(exp => ({
                company: exp.company,
                title: exp.title,
                years: exp.years,
                description: exp.description
            })) : [],
            skills: req.body.skills ? req.body.skills.split(',') : [],
            resume: req.file ? req.file.path : req.user.profile.resume,
            companyName: req.body.companyName,
            companyWebsite: req.body.companyWebsite,
            companyDescription: req.body.companyDescription
        };

        await User.findByIdAndUpdate(req.user.id, { profile: updatedProfile });
        res.redirect('/profile');
    } catch (error) {
        console.log(error);
        res.redirect('/profile');
    }
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}

module.exports = router;
