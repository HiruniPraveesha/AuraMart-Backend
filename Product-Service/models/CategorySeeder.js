import mongoose from 'mongoose';
import Category from './CategoryModel.js'; // Import the Category model

// Connect to your database
mongoose.connect('mongodb+srv://hirunipraveesha18:N3L0BtXaci7arCGW@cluster0.d46wa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('Database connected successfully!');

        // Seed the database with categories
        const categories = [
            { name: 'Skin Care', slug: 'skin care' },
            { name: 'Hair Care', slug: 'hair care' },
            { name: 'Foot Care', slug: 'foot care' },
        ];

        try {
            // Insert the categories
            for (const category of categories) {
                const newCategory = new Category(category);
                await newCategory.save();
                console.log(`Category "${category.name}" saved successfully.`);
            }
        } catch (error) {
            console.error('Error saving categories:', error);
        } finally {
            // Disconnect from the database
            mongoose.disconnect();
        }
    })
    .catch((err) => console.error('Database connection error:', err));
