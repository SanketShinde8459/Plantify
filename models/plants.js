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


const PlantSchema = new schema({
    name:{
    type :String,
    required:true    
    },
    imageUrl:{
    type : String,
    },
    category:{
        type :String,
    },
    price :{
        type : Number,
    },
    description:{
        type: String,
    },
    quantity:{
        type: Number,
        required: true,
        min: [0, 'Quantity cannot be negative'],
        validate: {
            validator: Number.isInteger,
            message: 'Quantity must be a whole number'
        }
    }
});
const Plant = mongoose.model("Plant",PlantSchema);
module.exports=Plant;