// Category Model (Category.js)
import mongoose from 'mongoose';

// Declare the Schema of the Category model
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    slug: {
        type: String,
        lowercase: true,
        unique: true,
    },
}, {
    timestamps: true,
});

// Export the Category model
const Category = mongoose.model('Category', categorySchema);
export default Category;
