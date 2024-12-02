import request from 'supertest';
import express from 'express';
import userController from '../controllers/UserControllers.js'; // Update the path to your controller
import User from '../models/User.js'; // Update the path to your User model
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import generateToken from "../config/jwtToken.js";
import generateRefreshToken from "../config/refreshToken.js";


// Mock the Authorization Middleware to simulate an authenticated user
jest.mock('../middlewares/authMiddleware.js', () => {
  return (req, res, next) => {
    req.user = { _id: 'mockUserId' };  // Simulate the user being authenticated
    next();  // Proceed to the next middleware or controller
  };
});

const app = express();
app.use(express.json());

// Add routes for testing
app.post('/api/user/register', userController.createUser);
app.post('/api/user/login', userController.loginUser);
app.get('/api/user/profile', userController.getUser);
app.put('/api/user/profileupdate', userController.updateUser);
app.put('/api/user/address', userController.saveAddress);
app.delete('/api/user/:id', userController.deleteUser);
app.put('/api/user/:id/block', userController.blockUser);
app.put('/api/user/:id/unblock', userController.unBlockUser);
app.post('/api/user/forgot-password', userController.forgotPasswordToken);
app.post('/api/user/reset-password/:token', userController.resetPassword);
app.get('/api/user/verify-token', userController.verifyToken);
app.post('/api/user/refresh-token', userController.handleRefreshToken);
app.post('/api/user/update-password', userController.updatePassword);
app.post('/api/user/logout', userController.logout);
app.get('/api/users', userController.getAllUsers);

// Mock dependencies
jest.mock('../models/User.js');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));
// jest.mock('../models/User.js', () => ({
//   findByIdAndUpdate: jest.fn((id, update) => {
//     if (id === 'mockUserId') {
//       return { _id: id, ...update };
//     }
//     return null;
//   }),
// }));


describe('User Controller', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Mock user data for testing
    const user = {
      _id: '123', // Using a string value for consistency
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      mobile: '1234567890',
      password: await bcrypt.hash('password123', 10), // Password is hashed
      role: 'user',
    };
  
    // Mocking User model methods
    User.create = jest.fn().mockResolvedValue(user); // Mock user creation
    User.findOne = jest.fn().mockResolvedValue(user); // Mock finding user by email or query
    User.findById = jest.fn().mockResolvedValue(user); // Mock finding user by ID
  
    // Mocking User model method for updates
    User.findByIdAndUpdate = jest.fn().mockImplementation((id, updateData, options) => {
      if (id === user._id) {
        // Simulate returning the updated user object
        return Promise.resolve({
          ...user, // Base user object
          ...updateData, // Merge in the updated fields
        });
      }
      return Promise.resolve(null); // Simulate no user found for invalid ID
    });
  
    // Create a JWT token for mock purposes
    token = 'mock-token'; // Use a fixed mock token
    userId = user._id; // Store user ID for use in tests
  
    // Mock jwt.sign to return the mock token
    jwt.sign = jest.fn().mockReturnValue(token); // Mock JWT token generation
  });
  
  

  afterAll(() => {
    jest.clearAllMocks();
  });

  test('POST /api/user/register - Register a new user', async () => {
    const newUser = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      mobile: '9876543210',
      password: 'password123',
    };

    User.findOne.mockResolvedValue(null); 
    User.create.mockResolvedValue({
      _id: '456',
      ...newUser,
      password: await bcrypt.hash(newUser.password, 10),
    });

    const response = await request(app).post('/api/user/register').send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'User created successfully');
    expect(response.body.user).toHaveProperty('email', newUser.email);
  });

 test('POST /api/user/login - Login an existing user', async () => {
    const loginData = {
        email: 'testuser@example.com',
        password: 'password123',
    };

    const user = {
        _id: '123',
        email: 'testuser@example.com',
        password: await bcrypt.hash('password123', 10), // Hashed password
        firstName: 'Test',
        mobile: '1234567890',
        role: 'user',
    };

    User.findOne.mockResolvedValue(user); // Mock user retrieval
    User.findOneAndUpdate.mockResolvedValue(user); // Mock update for refresh token

    jwt.sign.mockReturnValue('mock-token'); // Mock the token generation

    const response = await request(app).post('/api/user/login').send(loginData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token', 'mock-token'); // Check token
    expect(response.body).toHaveProperty('email', 'testuser@example.com'); // Check user email
});

  

test('POST /api/user/login - Fail login with invalid credentials', async () => {
  const loginData = {
    email: 'testuser@example.com',
    password: 'wrongpassword',
  };

  const user = {
    _id: '123',
    email: loginData.email,
    password: await bcrypt.hash('password123', 10), 
    firstName: 'Test',
    mobile: '1234567890',
    role: 'user',
  };

  User.findOne.mockResolvedValue(user);

  const response = await request(app).post('/api/user/login').send(loginData);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('message', 'Invalid Email or Password'); 
});



  test('GET /api/user/profile - Get current user profile', async () => {
    User.findById.mockResolvedValue({
      _id: userId,
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      mobile: '1234567890',
    });

    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('_id', userId);
    expect(response.body.firstName).toBe('Test');
    expect(response.body.lastName).toBe('User');
  });


  test('PUT /api/user/profileupdate - Update user profile', async () => {
    const updatedData = {
        firstName: 'Updated',
        lastName: 'User',
        email: 'updateduser@example.com',
        mobile: '9876543210',
    };

    const user = {
        _id: '1234567890abcdef12345678',
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        mobile: '1234567890',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
    };

    // Mock User.findByIdAndUpdate to return the updated data
    User.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: user._id,
        ...updatedData,
    });

    // Mock a valid token
    const token = jwt.sign({ id: user._id }, 'mock-jwt-secret', { expiresIn: '1h' });

    const response = await request(app)
        .put('/api/user/profileupdate')
        .set('Authorization', `Bearer ${token}`) // Add the Authorization header with token
        .send(updatedData);

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body.firstName).toBe(updatedData.firstName);
    expect(response.body.lastName).toBe(updatedData.lastName);
    expect(response.body.email).toBe(updatedData.email);
    expect(response.body.mobile).toBe(updatedData.mobile);
});




  test('DELETE /api/user/:id - Delete user', async () => {
    User.findByIdAndDelete.mockResolvedValue({
      _id: userId,
    });

    const response = await request(app)
      .delete(`/api/user/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('_id', userId);
  });


  test('PUT /api/user/:id/block - Block user', async () => {
    const userId = 'mockUserId';
    const token = 'mock-jwt-token';
  
    User.findByIdAndUpdate.mockResolvedValue({
      _id: userId,
      isBlocked: true,
    });
    const response = await request(app)
      .put(`/api/user/${userId}/block`) 
      .set('Authorization', `Bearer ${token}`); 

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'User Blocked');
  });

  test('PUT /api/user/:id/unblock - Unblock user', async () => {
    const userId = 'mockUserId';
    const token = 'mock-jwt-token';
  
    // Mocking the User.findByIdAndUpdate method to simulate unblocking a user
    User.findByIdAndUpdate.mockResolvedValue({
      _id: userId,
      isBlocked: false,
    });
  
    const response = await request(app)
      .put(`/api/user/${userId}/unblock`)
      .set('Authorization', `Bearer ${token}`); 

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'User Unblocked');
  });
  
  

//   test('POST /api/user/forgot-password - Forgot password request', async () => {
//     const userId = 'mock-user-id';  // mock userId

//     // Mock the user object returned by User.findOne
//     const user = {
//         _id: userId,
//         email: 'testuser@example.com',
//         createPasswordResetToken: jest.fn().mockResolvedValue('mock-token'), // Mock the token generation
//     };

//     // Mock User.findOne to return the mock user
//     User.findOne.mockResolvedValue(user);  

//     // Making the POST request with the email
//     const response = await request(app)
//       .post('/api/user/forgot-password')
//       .send({ email: 'testuser@example.com' });

//     // Log the response body for debugging
//     console.log(response.body);

//     // Asserting that the response status is 200 and the expected message is returned
//     expect(response.status).toBe(200);
//     expect(response.body).toHaveProperty('message', 'sent email to reset password');
//     expect(response.body).toHaveProperty('token', 'mock-token'); // Check if token is returned in the response

//     // Ensure User.findOne was called with the correct email
//     expect(User.findOne).toHaveBeenCalledWith({ email: 'testuser@example.com' });

//     // Ensure createPasswordResetToken was called
//     expect(user.createPasswordResetToken).toHaveBeenCalledTimes(1);
// });

  

  test('POST /api/user/reset-password/:token - Reset password', async () => {
    const resetData = {
      password: 'newpassword123',
    };
    
    jwt.verify.mockResolvedValue({ id: userId });

    User.findOne.mockResolvedValue({
      _id: userId,
      password: 'oldpassword123',  
      passwordResetToken: 'mock-token-hash',  
      passwordResetExpires: Date.now() + 3600000,  
      save: jest.fn().mockResolvedValue(true), 
    });

    // Sending the request to the API with a mock token
    const response = await request(app)
      .post('/api/user/reset-password/mock-reset-token')  
      .send(resetData);

    // Asserting the status and response body
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Password reset successfully');
});

test('POST /api/user/update-password - Update user password', async () => {
  const userId = 'mock-user-id';  // Mock user ID
  const oldPassword = 'oldpassword123';  // Old password
  const newPassword = 'newpassword123';  // New password

  // Mock user object with necessary fields and methods
  const user = {
      _id: userId,
      email: 'testuser@example.com',
      password: oldPassword,
      save: jest.fn().mockResolvedValue({
          _id: userId,
          email: 'testuser@example.com',
          password: newPassword,  // Updated password after save
      }),  // Mock save to return the updated user with new password
  };

  // Mock User.findById to return the mock user object
  User.findById = jest.fn().mockResolvedValue(user);

  // Mock the req.user to simulate the authenticated user
  const req = {
      user: { _id: userId },
      body: { password: newPassword },  // The password we want to update
  };

  // Send the POST request to update the password
  const response = await request(app)
      .post('/api/user/update-password')  // Ensure the route is correct
      .set('Authorization', `Bearer mock-token`)  // Add authorization header for authenticated user
      .send({ password: newPassword });

  // Check if response status is 200 (OK)
  expect(response.status).toBe(200);

  // Check if the response message is correct
  expect(response.body).toHaveProperty('message', 'Updated password successfully');

  // Ensure the updated password is returned in the response
  expect(response.body.updatedPassword.password).toBe(newPassword);

  // Ensure that User.findById was called with the correct user ID
  expect(User.findById).toHaveBeenCalledWith(userId);

  // Ensure that save was called on the user object
  expect(user.save).toHaveBeenCalledTimes(1);
});



  test('GET /api/user/verify-token - Verify JWT token', async () => {
    const userId = '123'; 
    const token = 'mock-token';

    // Mock the jwt.verify to simulate decoding the token and returning the user ID
    jwt.verify.mockImplementation((token, secretOrPublicKey, callback) => {
        if (token === 'mock-token') {
            callback(null, { id: userId }); 
        } else {
            callback(new Error('Invalid token'), null);
        }
    });

    const response = await request(app)
      .get('/api/user/verify-token')
      .set('Authorization', `Bearer ${token}`);  

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Token verified successfully');
});


test('POST /api/user/refresh-token - Handle refresh token', async () => {
  const refreshToken = 'mock-refresh-token';
  const userId = 'mockUserId';

  // Set environment variable for testing
  process.env.JWT_SECRET = 'your-secret-key';

  // Mock the cookies to simulate having a refresh token
  const cookies = {
    refreshToken: refreshToken
  };

  // Mock User.findOne to simulate finding a user with the refresh token
  User.findOne.mockResolvedValue({
    _id: userId,
    refreshToken: refreshToken,
  });

  // Mock the jwt.verify to simulate verifying the refresh token
  jwt.verify.mockImplementation((token, secretOrPublicKey, callback) => {
    if (token === refreshToken) {
      callback(null, { id: userId });
    } else {
      callback(new Error('Invalid token'), null);
    }
  });

  // Mock the generateToken function directly in the test
  const generateToken = jest.fn().mockReturnValue('mock-new-access-token');

  // Making the POST request to refresh the token
  const response = await request(app)
    .post('/api/user/refresh-token')
    .set('Cookie', `refreshToken=${refreshToken}`); // Passing the refresh token in the cookies

  console.log(response.body);  // Log the response body for debugging

  // Test expectations
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('accessToken', 'mock-new-access-token');
  expect(generateToken).toHaveBeenCalledTimes(1); // Ensure generateToken was called once
});



test('POST /api/user/logout - Logout user', async () => {
  const refreshToken = 'mock-refresh-token';
  const userId = 'mockUserId';

  // Mock the cookies to simulate having a refresh token
  const cookies = {
    refreshToken: refreshToken,
  };

  // Mock the User.findOne to simulate finding a user with the refresh token
  User.findOne.mockResolvedValue({
    _id: userId,
    refreshToken: refreshToken,
  });

  // Mock the User.findOneAndUpdate to simulate clearing the refresh token
  User.findOneAndUpdate.mockResolvedValue({
    _id: userId,
    refreshToken: '',
  });

  // Making the POST request to logout the user
  const response = await request(app)
    .post('/api/user/logout')
    .set('Cookie', `refreshToken=${refreshToken}`); // Passing the refresh token in the cookies

  // Asserting the response status is 204 (No Content)
  expect(response.status).toBe(204);

  // Asserting that the refresh token was cleared from the cookies
  expect(response.headers['set-cookie']).toContain('refreshToken=;');
});


test('PUT /api/user/address - Save user address', async () => {
  const newAddress = '123 New Address'; // New address to be saved
  const userId = '123'; // The same ID as in the mock user

  // Mock user data
  const user = {
    _id: userId,
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@example.com',
    mobile: '1234567890',
    password: await bcrypt.hash('password123', 10),
    role: 'user',
    address: 'Old Address', // Initial address
  };

  // Mocking the User model methods
  User.findById.mockResolvedValue(user); // Simulate finding the user
  User.findByIdAndUpdate = jest.fn().mockImplementation((id, updateData, options) => {
    // Simulate returning the updated user object
    return Promise.resolve({
      _id: id,
      ...user, // Preserve other user properties
      ...updateData, // Apply the updated address
    });
  });

  // Generate a mock token for Authorization header
  const token = 'validToken'; // This can be a mock or a real token if needed
  jwt.verify = jest.fn().mockReturnValue({ _id: userId }); // Mock JWT verification

  // Make a PUT request to the address update endpoint
  const response = await request(app)
    .put('/api/user/address')
    .set('Authorization', `Bearer ${token}`)
    .send({ address: newAddress });

  // Assertions on the response
  expect(response.status).toBe(200); // Expect HTTP 200 OK
  expect(response.body).toHaveProperty('address', newAddress); // Check updated address
  expect(response.body).toHaveProperty('_id', userId); // Ensure correct user ID

  // Verify that the method `findByIdAndUpdate` was called with correct parameters
  expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
    userId, // User ID
    { address: newAddress }, // Updated fields
    { new: true } // Ensure the updated document is returned
  );
});






test('GET /api/users - Get all users', async () => {
  const mockUsers = [
    {
      _id: 'userId1',
      firstName: 'Test1',
      lastName: 'User1',
      email: 'testuser1@example.com',
      mobile: '1234567890',
    },
    {
      _id: 'userId2',
      firstName: 'Test2',
      lastName: 'User2',
      email: 'testuser2@example.com',
      mobile: '9876543210',
    }
  ];

  // Mocking User.find() to return the mockUsers array
  User.find.mockResolvedValue(mockUsers);

  // Mock token, replace this with a valid token or a mock
  const token = 'mock-jwt-token'; 

  // Making the GET request
  const response = await request(app)
    .get('/api/users') // Endpoint to get all users
    .set('Authorization', `Bearer ${token}`); // Add the mock token in the header

  // Checking if the response status is 200
  expect(response.status).toBe(200);

  // Checking if the response body contains all the expected user data
  expect(response.body).toHaveLength(mockUsers.length);
  expect(response.body[0]).toHaveProperty('_id', 'userId1');
  expect(response.body[0].firstName).toBe('Test1');
  expect(response.body[0].lastName).toBe('User1');
  expect(response.body[1]).toHaveProperty('_id', 'userId2');
  expect(response.body[1].firstName).toBe('Test2');
  expect(response.body[1].lastName).toBe('User2');
});



});
