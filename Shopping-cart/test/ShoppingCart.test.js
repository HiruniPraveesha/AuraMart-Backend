import request from 'supertest';
import express from 'express';
import cartController from '../controllers/Cart.js'; // Your cart controller
import axios from 'axios';
import jwt from 'jsonwebtoken';
import Cart from '../models/CartModel.js';

const app = express();
app.use(express.json());

// Define API routes for the Cart functionality
app.post('/api/cart', cartController.userCart);
app.post('/api/cart/total', cartController.calculateCartTotal);
app.put('/api/cart/:productId', cartController.removeFromCart);
app.get('/api/cart', cartController.getUserCart);
app.delete('/api/empty-cart', cartController.emptyCart);

// Mock Axios and Cart methods
jest.mock('axios');
jest.mock('../models/CartModel.js');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('Cart Controller', () => {
  let token;
  let userId = '1234567890abcdef12345678'; // Use a valid user ID for testing

  beforeAll(() => {
    // Generate a mock token for the test
    token = jwt.sign({ id: userId }, 'mock-jwt-secret', { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/cart - Add to cart', async () => {
    const cartData = [
      { _id: 'productId1', count: 2 },
      { _id: 'productId2', count: 1 }
    ];

    // Mock the response for product price fetching
    axios.get.mockResolvedValueOnce({ data: { price: 100 } }).mockResolvedValueOnce({ data: { price: 200 } });

    // Mock the Cart model methods
    Cart.findOne = jest.fn().mockResolvedValue(null); // No existing cart for user

    const response = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ cart: cartData });

    expect(response.status).toBe(200);
    expect(response.body.cartTotal).toBe(400); // 2 * 100 + 1 * 200
    expect(response.body.products.length).toBe(2);
  });

  test('PUT /api/cart/:productId - Remove from cart', async () => {
    const productIdToRemove = 'productId1';
    const mockCart = {
      products: [
        { product: 'productId1', count: 2, price: 100 },
        { product: 'productId2', count: 1, price: 200 }
      ],
      cartTotal: 400
    };

    Cart.findOneAndUpdate = jest.fn().mockResolvedValue(mockCart);

    const response = await request(app)
      .put(`/api/cart/${productIdToRemove}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Product removed from cart');
    expect(response.body.updatedCart.products.length).toBe(1); // Only one product should remain
  });

  test('GET /api/cart - Get user cart', async () => {
    // Mock the cart data
    const mockCart = {
      products: [
        { product: 'productId1', count: 2, price: 100 },
        { product: 'productId2', count: 1, price: 200 }
      ],
      cartTotal: 400,
      tax: 12,
      totalAfterDiscount: 380
    };
  
    // Mock Cart.findOne to return mockCart when called
    Cart.findOne.mockResolvedValue(mockCart);
  
    // Simulating the token that will be used in the Authorization header
    const token = jwt.sign({ id: '1234567890abcdef12345678' }, 'mock-jwt-secret', { expiresIn: '1h' });
  
    // Make the request to the /api/cart endpoint with Authorization header
    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);  // Pass the token directly here
  
    // Assertions
    expect(response.status).toBe(200);
    expect(response.body.cartTotal).toBe(400); // Check if the cart total matches the mock value
    expect(response.body.products.length).toBe(2); // Check if the number of products is correct
    expect(response.body.tax).toBe(12); // Check if the tax value is correct
    expect(response.body.totalAfterDiscount).toBe(380); // Check if the discount value is correct
  });
  


  test('DELETE /api/empty-cart - Empty user cart', async () => {
    const mockCart = {
      products: [], // Cart is empty after removal
      cartTotal: 0,
      tax: 0,
      totalAfterDiscount: 0
    };

    // Mock the Cart model to return the mockCart when findOneAndRemove is called
    Cart.findOneAndRemove = jest.fn().mockResolvedValue(mockCart);

    // Send request to empty the cart
    const response = await request(app)
      .delete('/api/empty-cart')
      .set('Authorization', `Bearer ${token}`); // Ensure the token is valid

    // Assertions
    expect(response.status).toBe(200); // Expect successful status
    expect(response.body.products).toEqual([]); // Cart should be empty
    expect(response.body.cartTotal).toBe(0); // Cart total should be 0
    expect(response.body.tax).toBe(0); // Tax should be 0
    expect(response.body.totalAfterDiscount).toBe(0); // Total after discount should be 0
});



});
