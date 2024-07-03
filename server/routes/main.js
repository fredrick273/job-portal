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
    if (req.isAuthenticated()){
        if (req.user.email == 'admin@admin.com'){
            return res.redirect('/admin')
        }
    }
    const user = req.user;
    res.render("index", { user });
});

router.get('/jobs', async (req, res) => {
    try {
        console.log(req.user);
        const jobs = await Job.find();
        const user = req.user;
        res.render('jobs.ejs', { jobs, user });
    } catch (error) {
        console.log(error);
    }
});

router.get('/job/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        console.log(job);
        const user = req.user
        res.render('job-detail.ejs', { job,user })
    } catch (error) {
        console.log(error);
    }
});

router.post('/apply/:id', checkAuthenticated, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).send("Job not found");
        }
        
        if (!job.applicants.includes(req.user._id)) {
            job.applicants.push(req.user._id);
            await job.save();
        }

        res.send("Applied successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error applying for job");
    }
});


router.post('/search', async (req, res) => {
    const searchterm = req.body.search;

    try {
        const jobs = await Job.find({
            title: { $regex: new RegExp(searchterm, 'i') }
        });
        const user = req.user;
        res.render('jobs', { jobs, user});
    } catch (error) {
        console.log(error);
    }
});

router.get('/login', async (req, res) => {
    const user = req.user;
    res.render('login.ejs', {user});
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get('/register', async (req, res) => {
    const user = req.user;
    res.render('register.ejs', {user});
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



router.get("/admin", checkAdmin, async (req, res) => {

    try {
        const jobs = await Job.find();
        res.render("admin/jobs", { jobs, layout: './layouts/admin-layout.ejs' },);
    } catch (error) {
        console.log(error);
        res.redirect("/admin");
    }
});

router.get("/admin/jobs/new", checkAdmin, (req, res) => {
    res.render("admin/new-job",{ layout: './layouts/admin-layout.ejs' });
});

router.post("/admin/jobs/new", checkAdmin, async (req, res) => {
    try {
        const newJob = new Job({
            title: req.body.name,
            description: req.body.desc,
            location: req.body.loc,
            active: true,
            type: "full-time"
        });
        await Job.create(newJob);
        res.redirect("/admin");
    } catch (error) {
        console.log(error);
        res.redirect("/admin/jobs/new");
    }
});

router.get("/admin/jobs/edit/:id", checkAdmin, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        res.render("admin/edit-job", { job ,layout: './layouts/admin-layout.ejs' });
    } catch (error) {
        console.log(error);
        res.redirect("/admin");
    }
});

router.post("/admin/jobs/edit/:id", checkAdmin, async (req, res) => {
    try {
        const active = req.body.active === 'on';
        const job = await Job.findByIdAndUpdate(req.params.id, {
            title: req.body.name,
            description: req.body.desc,
            location: req.body.loc,
            active: active,
            type: req.body.type
        });
        res.redirect("/admin");
    } catch (error) {
        console.log(error);
        res.redirect(`/admin/jobs/edit/${req.params.id}`);
    }
});

router.get("/admin/jobs/:id/applicants", checkAdmin, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('applicants');
        res.render("admin/view-applicants", { job, layout: './layouts/admin-layout.ejs' });
    } catch (error) {
        console.log(error);
        res.redirect("/admin");
    }
});

router.get("/admin/applicant/:id", checkAdmin, async (req, res) => {
    try {
        const applicant = await User.findById(req.params.id);
        res.render("admin/view-applicant-profile", { applicant, layout: './layouts/admin-layout.ejs' });
    } catch (error) {
        console.log(error);
        res.redirect("/admin/jobs");
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


function checkAdmin(req,res,next) {
    if (req.isAuthenticated()){
        if (req.user.email == 'admin@admin.com'){
            return next()
        }
    }
    res.redirect('/login');
}

module.exports = router;
