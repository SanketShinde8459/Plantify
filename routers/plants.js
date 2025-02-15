const express = require('express');
const router = express.Router();
const ExpressError = require('../utils/ExpressError');
const wrapAsync = require('../utils/wrapAsync');
const Plant = require('../models/plants.js');
const {PlantSchema} = require("../schema.js");
const {isLoggedIn} = require("../middleware.js");
const {isAdmin} = require("../middleware.js");
const mongoose = require("mongoose");


const validatePlant=(req,res,next)=>{
    let {error} =PlantSchema.validate(req.body);
    // let {title,desc,image,} = req.body;
if(error)
{
    let errMsg = error.details.map((el)=>el.message).join(",");
  throw new ExpressError(400,errMsg);
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
 router.get("/:id",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    // console.log(id);
    let Plants = await Plant.findById(id);
    res.render("listings/show.ejs",{Plants});

}));

//create route
router.post("/add",isAdmin,validatePlant,wrapAsync(async(req,res)=>{
    // let {title,desc,image,} = req.body;
    let newListing = new Plant(req.body.listing);
   await newListing.save();
   res.redirect("/plants");
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
router.put("/:id",isAdmin,validatePlant,wrapAsync(async(req,res)=>{
       let {id} = req.params;
      await Plant.findByIdAndUpdate(id,{...req.body.listing},{new:true,runValidators:true});
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
        if(plant.quantity + change <= 0){
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
        req.flash('success', `Stock ${action === 'add' ? 'removed' : 'added'} successfully`);
        res.redirect(`/plants/${id}`);
    } catch (err) {
        console.error('Quantity update error:', err);
        req.flash('error', 'Error updating quantity');
        res.redirect(`/plants/${id}`);
    }
});

module.exports = router;