const mongoose = require("mongoose");
const Admin = require("../models/Admins");


mongoose.connect('mongodb://127.0.0.1:27017/nursery', {
   
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seedAdmin = async () => {
    try {
        // Clear existing admins
        await Admin.deleteMany({});

        const admin = new Admin({
            username: 'Sanket',
            email: 'sanketshinde.dev@gmail.com',
            isAdmin: true
        });

        // Register admin with password
        await Admin.register(admin, '7350');
        console.log('Admin created successfully');
    }catch (err) {
        console.error('Error seeding admin:', err);
    } finally {
        mongoose.connection.close();
    }
};

seedAdmin();