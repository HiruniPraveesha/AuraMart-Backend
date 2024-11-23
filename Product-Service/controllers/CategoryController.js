import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";

export const getProductsByCategory = async (req, res) => {
    try {
        const { slug } = req.params;

        // Find the category by slug
        const category = await Category.findOne({ slug });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Query products by category name (since category in Product model is a string)
        const products = await Product.find({ category: category.name });

        if (!products || products.length === 0) {
            return res.status(404).json({ message: 'No products found for this category' });
        }

        return res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return res.status(500).json({ message: 'An error occurred while fetching products.', error: error.message });
    }
};
export const getAllCategoriesWithProducts = async (req, res) => {
    try {
      // Fetch all categories
      const categories = await Category.find();
      console.log("Categories found:", categories);
  
      if (!categories || categories.length === 0) {
        return res.status(404).json({ message: "No categories found" });
      }
  
      // Initialize an array to store categories and their products
      const categoryProducts = [];
  
      // Loop through categories and fetch products for each category
      for (const category of categories) {
        const products = await Product.find({ category: category.name }); // Query by category name (String)
  
        // Only include categories with products
        if (products.length > 0) {
          categoryProducts.push({
            category: category.name,
            slug: category.slug,
            products: products,
          });
        }
      }
  
      // If no products are found for any category
      if (categoryProducts.length === 0) {
        return res
          .status(404)
          .json({ message: "No products found for any category" });
      }
  
      // Return the categories and their products
      return res.status(200).json(categoryProducts);
    } catch (error) {
      console.error("Error fetching categories with products:", error);
      return res
        .status(500)
        .json({
          message: "An error occurred while fetching categories and products.",
        });
    }
  };

  export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find(); // Retrieve all categories from the database
        if (!categories || categories.length === 0) {
            return res.status(404).json({ message: 'No categories found' });
        }
        return res.status(200).json(categories);  // Send the categories as a response
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ message: 'An error occurred while fetching categories' });
    }
};