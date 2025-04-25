const express = require('express');
const router = express.Router();
const ExpressError = require('../utils/ExpressError');
const wrapAsync = require('../utils/wrapAsync');
const Plant = require('../models/plants.js');
const {PlantSchema} = require("../schema.js");
const {isLoggedIn} = require("../middleware.js");
const {isAdmin} = require("../middleware.js");
const mongoose = require("mongoose");
const multer = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});
const Feedback = require('../models/feedback.js');

const validatePlant=(req,res,next)=>{
    let {error} =PlantSchema.validate(req.body.listing);
    console.log(error);
    // let {title,desc,image,} = req.body;
if(error)
{
   req.flash('error',"Enter valid data");
   return res.redirect("/plants/new");
}
else{
    next();
}
}



// title showing
router.get("/",wrapAsync(async (req,res)=>{
    let allPlant  = await Plant.find({});
       res.render("listings/index.ejs",{allPlant});
}));



// new create
router.get("/new",isAdmin,wrapAsync((req,res)=>{
    res.render("listings/new.ejs");
}));

// show route
router.get("/:id", wrapAsync(async(req, res) => {
    let { id } = req.params;
    let Plants = await Plant.findById(id);
    
    // Fetch feedbacks for this plant
    const feedbacks = await Feedback.find({ plant: id })
        .populate('user', 'username')
        .sort('-createdAt');
    
    res.render("listings/show.ejs", { Plants, feedbacks });
}));

//create route
router.post("/add", upload.single('listing[imageUrl]'), isAdmin, wrapAsync(async (req, res) => {
    try {
        // Validate file upload
        if (!req.file) {
            req.flash('error', 'Please upload an image');
            return res.redirect('/plants/new');
        }

        // Log the received data for debugging
        console.log('Request body:', req.body);
        console.log('File:', req.file);

        // Create new plant with validated data
        let newListing = new Plant({
            name: req.body.listing.name,
            description: req.body.listing.description,
            price: req.body.listing.price,
            category: req.body.listing.category,
            quantity: req.body.listing.quantity,
            imageUrl: {
                url: req.file.path,
                filename: req.file.filename
            }
        });

      
        // Save the plant
        await newListing.save();
        req.flash('success', 'Successfully added new plant!');
        return res.redirect("/plants");

    } catch (error) {
        console.error('Error creating plant:', error);
        req.flash('error', `Error creating plant: ${error.message}`);
        return res.redirect('/plants/new');
    }
}));

// Edit route
router.get("/:id/edit", isAdmin, wrapAsync(async (req, res) => {
    let { id } = req.params;    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash('error', 'Invalid Plant ID');
        return res.redirect('/plants');
    }
    try {
        let listing = await Plant.findById(id);
        if (!listing) {
            req.flash('error', 'Plant not found');
            return res.redirect('/plants');
        }
        res.render("listings/edit.ejs", { listing });
    } catch (error) {
        req.flash('error', 'Error finding plant');
        res.redirect('/plants');
    }
}));
// update route
router.put("/:id",isAdmin,wrapAsync(async(req,res)=>{
       let {id} = req.params;
      await Plant.findByIdAndUpdate(id,{...req.body.listing},{new:true});
        res.redirect("/plants");
       
}));

router.delete("/:id",isAdmin,wrapAsync(async(req,res)=>{
    let {id} = req.params;
    console.log(id);
    let temp = await Plant.findByIdAndDelete(id).then((res)=>{console.log(res)}).catch((err)=>{console.log(err);})
    console.log(temp);
    res.redirect("/plants");
}));

router.patch('/:id/quantity', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantityChange, action } = req.body;
        const change = parseInt(quantityChange) * (action === 'add' ? 1 : -1);

        const plant = await Plant.findById(id);
        if(plant.quantity + change < 0){
            req.flash('error', 'Cannot reduce quantity below 0');
            return res.redirect(`/plants`);
        }
        if (!plant) {
            req.flash('error', 'Plant not found');
            return res.redirect('/plants');
        }

        const newQuantity = plant.quantity + change;
        if (newQuantity < 0) {
            req.flash('error', 'Cannot reduce quantity below 0');
            return res.redirect(`/plants/${id}`);
        }

        await Plant.findByIdAndUpdate(id, { quantity: newQuantity });
        let temp = action;
        let temp1;
        if(temp=="add"){temp1="added"}else{temp1="removed"};
        req.flash('success', `Stock ${action === 'removed' ? 'add' : `${temp1}`} successfully`);
        res.redirect(`/plants/${id}`);
    } catch (err) {
        console.error('Quantity update error:', err);
        req.flash('error', 'Error updating quantity');
        res.redirect(`/plants/${id}`);
    }
});

module.exports = router;