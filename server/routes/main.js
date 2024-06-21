const express = require("express");
const router = express.Router();

const Job = require("../models/JobScheme");


router.get("", (req,res) => {
    res.render("index");
});


router.get('/job', async (req, res) => {
    try{
    const jobs = await Job.find();
    res.render('jobs.ejs',{ jobs })
    } catch(error){
        console.log(error)
    }
    
})

router.get("/job/register", (req, res) => {
    res.render("job")
});

router.post('/job/register', async (req, res) => {
    try{
        const newJob = new Job({
            title: req.body.name,
            description: req.body.desc,
            location: req.body.loc,
            active: false,
            type: "full-time"
        })
        await Job.create(newJob);
        res.redirect('')
        
    } catch(error){
        console.log(error)
    }
})

module.exports = router;