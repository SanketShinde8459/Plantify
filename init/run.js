const mongoose = require("mongoose");
main().then((res)=>{
    console.log(res);
}).catch((err)=>{
    console.log(err);
})
async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/nursery');
}

async function insertPlant() {
    try {
        const db = mongoose.connection; // Use existing connection
        const Plant = db.collection("plant"); // Select collection

        const plantData = {
            name: "Tulsi",
            description: "A medicinal plant with spiritual significance",
            price: 150,
            category: "Medicinal",
            quantity: 50,
            imageUrl: {
                url: "https://www.ugaoo.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/t/u/tulsi_1.jpg",
                filename: "tulsi.jpg"
            }
        };

        const result = await Plant.insertOne(plantData); // Insert data
        console.log("Plant inserted with ID:", result.insertedId);
    } catch (error) {
        console.error("Error inserting data:", error);
    }
}

insertPlant();

