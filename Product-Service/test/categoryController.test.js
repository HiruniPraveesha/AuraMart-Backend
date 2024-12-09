//categoryController.test.js
import express from "express";
import request from "supertest";
import * as categoryController from "../controllers/CategoryController"; // Import controller
import Category from "../models/CategoryModel";
import Product from "../models/ProductModel";

// Mocking the models
jest.mock("../models/CategoryModel");
jest.mock("../models/ProductModel");

const app = express();
app.use(express.json());

// Set up the routes for the controller
app.get("/api/categories/:slug", categoryController.getProductsByCategory);
app.get("/api/categories", categoryController.getAllCategories);
app.get("/api/categories/product", categoryController.getAllCategoriesWithProducts);

describe("CategoryController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return products by category", async () => {
    const mockCategory = { name: "Fruits", slug: "fruits" };
    const mockProducts = [
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
    ];

    // Mock Category and Product models
    Category.findOne.mockResolvedValue(mockCategory); // Mock the category response
    Product.find.mockResolvedValue(mockProducts); // Mock the product response

    // Make the request
    const response = await request(app).get("/api/categories/fruits");

    // Assert the response
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProducts);
  });

  it("should return 404 if category is not found", async () => {
    Category.findOne.mockResolvedValue(null); // Mock that no category was found

    const response = await request(app).get("/api/categories/nonexistent");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Category not found");
  });

  it("should return 404 if no products found for category", async () => {
    const mockCategory = { name: "Vegetables", slug: "vegetables" };

    // Mock the responses
    Category.findOne.mockResolvedValue(mockCategory); // Mock category
    Product.find.mockResolvedValue([]); // Mock no products for the category

    const response = await request(app).get("/api/categories/vegetables");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No products found for this category");
  });

//   it("should return all categories with their products", async () => {
//     const mockCategories = [
//       { name: "Fruits", slug: "fruits" },
//       { name: "Vegetables", slug: "vegetables" },
//     ];

//     const mockProducts = [
//       { name: "Apple", category: "Fruits" },
//       { name: "Banana", category: "Fruits" },
//       { name: "Carrot", category: "Vegetables" },
//     ];

//     // Mock database methods
//     Category.find.mockResolvedValue(mockCategories);
//     Product.find.mockImplementation(({ category }) =>
//       Promise.resolve(mockProducts.filter(product => product.category === category))
//     );

//     const response = await request(app).get("/api/categories/product");

//     expect(response.status).toBe(200);
//     expect(response.body).toEqual([
//       {
//         category: "Fruits",
//         slug: "fruits",
//         products: [
//           { name: "Apple", category: "Fruits" },
//           { name: "Banana", category: "Fruits" },
//         ],
//       },
//       {
//         category: "Vegetables",
//         slug: "vegetables",
//         products: [
//           { name: "Carrot", category: "Vegetables" },
//         ],
//       },
//     ]);
//   });

  it("should return 404 if no categories are found", async () => {
    Category.find.mockResolvedValue([]); // Mock no categories found

    const response = await request(app).get("/api/categories");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No categories found");
  });
});