import request from 'supertest';
import express from 'express';
import adminController from '../controllers/AdminController.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const app = express();
app.use(express.json());

// Add routes for testing
app.get('/api/product/:id', adminController.getaProduct);
app.get('/api/product', adminController.getAllProducts);
app.post('/api/product', adminController.createProdcut);
app.post('/api/admin/login', adminController.loginAdmin);
app.post('/api/admin/signup', adminController.signupAdmin);

// Mock axios and Admin methods
jest.mock('axios');
jest.mock('../models/Admin.js');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('Admin Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/product/:id - Get a specific product', async () => {
    const mockProduct = { id: '1', name: 'Test Product' };
    axios.get.mockResolvedValue({ data: mockProduct });

    const response = await request(app).get('/api/product/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProduct);
    expect(axios.get).toHaveBeenCalledWith('http://product:7005/api/product/1');
  });

  test('GET /api/product - Get all products', async () => {
    const mockProducts = [{ id: '1', name: 'Product 1' }, { id: '2', name: 'Product 2' }];
    axios.get.mockResolvedValue({ data: mockProducts });

    const response = await request(app).get('/api/product');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProducts);
    expect(axios.get).toHaveBeenCalledWith('http://product:7005/api/product/');
  });

  test('POST /api/product - Create a product', async () => {
    const newProduct = { name: 'New Product', price: 100 };
    const mockResponse = { newProduct: { id: '1', ...newProduct } };
    axios.post.mockResolvedValue({ data: mockResponse });

    const response = await request(app).post('/api/product').send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: 'Product created',
      newProduct: mockResponse.newProduct,
    });
    expect(axios.post).toHaveBeenCalledWith('http://product:7005/api/product/', newProduct);
  });

  test('POST /api/admin/login - Login an admin', async () => {
    const admin = { _id: '123', email: 'test@example.com' };
    const token = 'mock-token';
    Admin.login.mockResolvedValue(admin); // Mock successful login
    jwt.sign.mockReturnValue(token); // Mock token generation

    const response = await request(app)
      .post('/api/admin/login')
      .send({ email: 'test@example.com', password: 'password' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ email: admin.email, token });
    expect(Admin.login).toHaveBeenCalledWith('test@example.com', 'password');
    expect(jwt.sign).toHaveBeenCalledWith({ _id: admin._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
  });

  test('POST /api/admin/signup - Signup an admin', async () => {
    const newAdmin = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      mobile: '1234567890',
      address: '123 Street',
      password: 'password',
    };

    const admin = { _id: '123', email: 'john@example.com', firstName: 'John', lastName: 'Doe' };
    const token = 'mock-token';

    // Mocking Admin.signup and jwt.sign
    Admin.signup.mockResolvedValue(admin); // Mock successful signup
    jwt.sign.mockReturnValue(token); // Mock token generation

    const response = await request(app)
      .post('/api/admin/signup')
      .send(newAdmin);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ email: admin.email, token });
    expect(Admin.signup).toHaveBeenCalledWith(
      newAdmin.firstName,
      newAdmin.lastName,
      newAdmin.email,
      newAdmin.mobile,
      newAdmin.address,
      newAdmin.password
    );
    expect(jwt.sign).toHaveBeenCalledWith({ _id: admin._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
  });
});
