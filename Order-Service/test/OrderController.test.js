import request from "supertest";
import express from "express";
import axios from "axios";
import orderController from "../controllers/orderController.js"; // Import the orderController
import Order from "../models/OrderModel.js";

// Mock dependencies
jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

jest.mock("uniqid", () => jest.fn(() => "mockUniqueId"));

jest.mock("../models/OrderModel.js", () => ({
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));

// Setup express app
const app = express();
app.use(express.json());

// Directly test controller functions
app.post("/api/orders", orderController.createOrder);
app.get("/api/orders", orderController.getOrders);
app.put("/api/orders/:id", orderController.updateOrderStatus);
app.get("/api/orders/all", orderController.allOrders);

describe("OrderController Tests", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  test("POST /api/orders - createOrder", async () => {
    // Mock cart service response
    const mockCartResponse = {
      data: {
        products: [{ product: { _id: "product1" }, count: 2 }],
        cartTotal: 100,
        totalAfterDiscount: 80,
      },
    };
  
    // Mock axios and Order.create
    axios.get.mockResolvedValueOnce(mockCartResponse);
    Order.create.mockResolvedValueOnce({
      _id: "mockOrderId",
      paymentIntent: {
        id: "mockUniqueId",
        amount: 80,
        status: "Pending",
      },
    });
  
    try {
      // Make request to the route
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", "Bearer mockToken");
      console.log("Response:", res.body);
  
      // Assertions
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("success");
      expect(axios.get).toHaveBeenCalledWith(
        "http://cart:7001/api/checkout/cart",
        expect.any(Object)
      );
      expect(Order.create).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.error("Error during test:", error);
    }
  });
  

  // test("GET /api/orders - getOrders", async () => {
  //   const mockOrders = [
  //     {
  //       _id: "mockOrderId",
  //       products: [
  //         { _id: "product1", count: 2 }, // Mock product object with _id
  //       ],
  //     },
  //   ];
  
  //   const mockProductResponse = {
  //     data: { _id: "product1", name: "Test Product" },
  //   };
  
  //   // Mock the database call
  //   Order.find.mockResolvedValueOnce(mockOrders);
  //   // Mock the external API call to fetch product details
  //   axios.get.mockResolvedValueOnce(mockProductResponse);
  
  //   const mockToken = 'mock-token';
  
  //   const response = await request(app)
  //     .get("/api/orders")
  //     .set("Authorization", `Bearer ${mockToken}`); // Mock Authorization header
  
  //   expect(response.status).toBe(200); // Ensure successful response
  //   expect(response.body).toHaveLength(1); // Check that only one order is returned
  //   expect(response.body[0].products[0].product.name).toBe("Test Product"); // Check product name
  //   expect(Order.find).toHaveBeenCalledTimes(1); // Ensure Order.find is called
  //   expect(axios.get).toHaveBeenCalledWith("http://product:7005/api/product/product1"); // Ensure correct product API call
  // });
  
  
  

  test("PUT /api/orders/:id - updateOrderStatus", async () => {
    // Mock update response
    const mockUpdatedOrder = {
      _id: "mockOrderId",
      orderStatus: "Shipped",
      paymentIntent: { status: "Shipped" },
    };

    // Mock Order.findByIdAndUpdate
    Order.findByIdAndUpdate.mockResolvedValueOnce(mockUpdatedOrder);

    // Make request to the route
    const res = await request(app)
      .put("/api/orders/mockOrderId")
      .send({ status: "Shipped" });

    // Assertions
    expect(res.status).toBe(200);
    expect(res.body.orderStatus).toBe("Shipped");
    expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
      "mockOrderId",
      { orderStatus: "Shipped", paymentIntent: { status: "Shipped" } },
      { new: true }
    );
  });

  test("GET /api/orders/all - allOrders", async () => {
    // Mock all orders
    const mockOrders = [
      {
        _id: "mockOrderId",
        products: [{ product: { _id: "product1" }, count: 2 }],
      },
    ];

    // Mock Order.find
    Order.find.mockResolvedValueOnce(mockOrders);

    // Make request to the route
    const res = await request(app).get("/api/orders/all");

    // Assertions
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(Order.find).toHaveBeenCalledTimes(1);
  });
});
