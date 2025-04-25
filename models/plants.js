const mongoose = require("mongoose");
const schema = mongoose.Schema;

main().then((res)=>{
    console.log(res);
}).catch((err)=>{
    console.log(err);
})
async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/nursery');
}

const plantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Plant name is required']
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Fruit','Medicinal']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    imageUrl: {
        url: {
            type: String,
            required: [true, 'Image URL is required']
        },
        filename: {
            type: String,
            required: [true, 'Image filename is required']
        }
    }
}, {
    timestamps: true
});

const Plant = mongoose.model('Plant', plantSchema);
module.exports = Plant;