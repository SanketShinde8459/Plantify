const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');


// Define the User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  mobno: { type: Number, required: true },
  plants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
      id:false, // Reference to the Plant model
    },
  ],
});

// Create the User model
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', userSchema);
module.exports=User;
// Insert the first document

