import request from "supertest";
import express from "express";
import productController from "../controllers/ProductController"; // Update path if needed
import Product from "../models/ProductModel"; // Import Product model
import axios from "axios";
import slugify from "slugify";
jest.mock('axios');

// Mock Product model
jest.mock("../models/ProductModel", () => ({
  find: jest.fn(() => ({
    sort: jest.fn().mockReturnThis(), // Allows chaining
    select: jest.fn().mockReturnThis(), // Allows chaining
    skip: jest.fn().mockReturnThis(), // Allows chaining
    limit: jest.fn().mockResolvedValue([]), // Returns resolved value at the end of the chain
  })),
  countDocuments: jest.fn().mockResolvedValue(10), // Simulate countDocuments for pagination
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

// Setup Express application
const app = express();
app.use(express.json());

// Routes using the productController
app.get("/api/product", productController.getAllProducts);
app.get("/api/product/:id", productController.getaProduct);
app.post("/api/product", productController.createProduct);
app.put("/api/product/:id", productController.updateProduct);
app.delete("/api/product/:id", productController.deleteProduct);

describe("Product Controller Tests", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  
  test("GET /api/product/:id - should return a product with populated ratings", async () => {
    const mockUser = { _id: "user123", name: "John Doe", email: "john@example.com" };

    // Mock Product.findById
    Product.findById.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValueOnce({
            _id: "mockProductId",
            name: "Mock Product",
            ratings: [
                {
                    _id: "rating1",
                    score: 5,
                    postedby: "user123",
                    toObject: jest.fn().mockReturnValue({
                        _id: "rating1",
                        score: 5,
                        postedby: "user123",
                    }),
                },
            ],
            toObject: jest.fn().mockReturnValue({
                _id: "mockProductId",
                name: "Mock Product",
                ratings: [
                    {
                        _id: "rating1",
                        score: 5,
                        postedby: "user123",
                    },
                ],
            }),
        }),
    }));

    // Mock axios.get
    axios.get.mockResolvedValueOnce({ data: mockUser });

    const res = await request(app).get("/api/product/mockProductId");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
        _id: "mockProductId",
        name: "Mock Product",
        ratings: [
            {
                _id: "rating1",
                score: 5,
                postedby: mockUser,
            },
        ],
    });
    expect(Product.findById).toHaveBeenCalledWith("mockProductId");
    expect(axios.get).toHaveBeenCalledWith("http://userauth:7002/api/user/user123");
});


  test("POST /api/product - should create a product and return it", async () => {
    const mockProductData = {
      title: "New Product",
      description: "New product description",
      price: 150,
      category: "Electronics",
      brand: "BrandName",
      quantity: 10,
      images: ["image1.jpg"],
    };

    const mockCreatedProduct = {
        ...mockProductData,
        _id: "mockProductId",
        slug: slugify(mockProductData.title),
    };

    // Mock Product.create
    Product.create.mockResolvedValueOnce(mockCreatedProduct);

    const res = await request(app)
        .post("/api/product")
        .send(mockProductData)
        .expect("Content-Type", /json/);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
        message: "Product created successfully",
        newProduct: mockCreatedProduct,
    });
    expect(Product.create).toHaveBeenCalledWith({
        ...mockProductData,
        slug: slugify(mockProductData.title),
    });
});

// test("POST /api/product - should return 400 if category is missing", async () => {
//   const mockProductData = {
//       title: "Mock Product",
//       description: "A great product",
//       price: 100,
//   };

//   const res = await request(app)
//       .post("/api/product")
//       .send(mockProductData)
//       .expect("Content-Type", "/json"); // Expect JSON response

//   expect(res.status).toBe(400);  // Expect 400 for missing category
//   expect(res.body).toHaveProperty("error", "Category is required");
//   expect(Product.create).not.toHaveBeenCalled();  // Ensure create method is not called
// });

test("PUT /api/product/:id - should update an existing product", async () => {
    const updatedData = {
      title: "Updated Product",
      price: 200,
    };
  
    const slug = "Updated-Product"; // The expected slug after slugifying the title
  
    const mockUpdatedProduct = {
      _id: "mockProductId",
      ...updatedData,
      slug: slug, // Include the generated slug in the mock product
      description: "Existing description",
      category: "Existing category",
    };
  
    // Mock Product.findByIdAndUpdate
    Product.findByIdAndUpdate.mockResolvedValueOnce(mockUpdatedProduct);
  
    const res = await request(app)
      .put("/api/product/mockProductId")
      .send(updatedData);
  
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockUpdatedProduct);
    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
      "mockProductId",
      { ...updatedData, slug: slug }, // Ensure the slug is included in the update data
      { new: true }
    );
  });
  
  test("DELETE /api/product/:id - should delete a product", async () => {
    const mockDeletedProduct = {
      _id: "mockProductId",
      title: "Deleted Product",
    };

    // Mock Product.findByIdAndDelete
    Product.findByIdAndDelete.mockResolvedValueOnce(mockDeletedProduct);

    const res = await request(app).delete("/api/product/mockProductId");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockDeletedProduct);
    expect(Product.findByIdAndDelete).toHaveBeenCalledWith("mockProductId");
  });
});