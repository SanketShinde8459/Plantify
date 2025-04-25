const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');
const { isLoggedIn } = require('../middleware');

router.post('/:plantId', isLoggedIn, async (req, res) => {
    try {
        const { plantId } = req.params;
        const { rating, comment } = req.body;

        // Check if user has already given feedback
        const existingFeedback = await Feedback.findOne({
            user: req.user._id,
            plant: plantId
        });

        if (existingFeedback) {
            req.flash('error', 'You have already submitted feedback for this plant');
            return res.redirect(`/plants/${plantId}`);
        }

        const feedback = new Feedback({
            user: req.user._id,
            plant: plantId,
            rating,
            comment
        });

        await feedback.save();
        req.flash('success', 'Thank you for your feedback!');
        res.redirect(`/plants/${plantId}`);
    } catch (error) {
        console.error('Feedback Error:', error);
        req.flash('error', 'Error submitting feedback');
        res.redirect(`/plants/${plantId}`);
    }
});

module.exports = router;