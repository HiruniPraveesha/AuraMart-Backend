import Cart from "../models/CartModel.js";
import axios from "axios";
import cartController from "../controllers/Cart.js";
import httpMocks from "node-mocks-http"; // Missing import for mocking HTTP requests and responses

// Mocking Cart model and axios
jest.mock("../models/CartModel.js");
jest.mock("axios");

describe("Cart Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks before each test
    });

    describe("POST /api/cart - userCart", () => {
        it("should add new products to the cart and calculate totals", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                url: "/cart",
                body: {
                    cart: [
                        { _id: "product1", count: 2 },
                        { _id: "product2", count: 1 },
                    ],
                },
                user: { _id: "user1" },
                headers: { authorization: "Bearer mock-token" },
            });
            const res = httpMocks.createResponse();

            axios.get.mockResolvedValueOnce({ data: { price: 10 } });
            axios.get.mockResolvedValueOnce({ data: { price: 20 } });

            Cart.findOne.mockResolvedValue(null); // No existing cart

            const mockSave = jest.fn().mockResolvedValue({
                products: [
                    { product: "product1", count: 2, price: 10 },
                    { product: "product2", count: 1, price: 20 },
                ],
                cartTotal: 63,
                tax: 3,
            });
            Cart.mockImplementation(() => ({ save: mockSave }));

            await cartController.userCart(req, res);

            expect(res.statusCode).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.cartTotal).toBe(63);
            expect(data.products.length).toBe(2);
            expect(mockSave).toHaveBeenCalled();
        });

        it("should update existing cart with new products", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                url: "/cart",
                body: {
                    cart: [{ _id: "product1", count: 3 }],
                },
                user: { _id: "user1" },
                headers: { authorization: "Bearer mock-token" },
            });
            const res = httpMocks.createResponse();

            axios.get.mockResolvedValueOnce({ data: { price: 15 } });

            Cart.findOne.mockResolvedValue({
                products: [{ product: "product1", count: 2, price: 15 }],
                save: jest.fn().mockResolvedValue({
                    products: [{ product: "product1", count: 5, price: 15 }],
                    cartTotal: 77.25,
                    tax: 2.25,
                }),
            });

            await cartController.userCart(req, res);

            expect(res.statusCode).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.cartTotal).toBe(77.25);
            expect(data.products[0].count).toBe(5);
        });
    });

    describe("DELETE /api/cart/empty - Empty the cart", () => {
        it("should remove the user's cart", async () => {
            const req = httpMocks.createRequest({
                method: "DELETE",
                url: "/empty-cart",
                user: { _id: "user1" },
            });
            const res = httpMocks.createResponse();

            Cart.findOneAndRemove.mockResolvedValue({ products: [], cartTotal: 0 });

            await cartController.emptyCart(req, res);

            expect(res.statusCode).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.products).toEqual([]);
        });
    });

    describe("PUT /cart/:productId - removeFromCart", () => {
        it("should remove a product from the cart", async () => {
            const req = httpMocks.createRequest({
                method: "PUT",
                url: "/cart/product1",
                params: { productId: "product1" },
                user: { _id: "user1" },
            });
            const res = httpMocks.createResponse();

            Cart.findOneAndUpdate.mockResolvedValue({
                save: jest.fn().mockResolvedValue({
                    products: [{ product: "product2", count: 1, price: 20 }],
                    cartTotal: 20,
                }),
                products: [{ product: "product2", count: 1, price: 20 }],
                cartTotal: 20,
            });            

            await cartController.removeFromCart(req, res);

            expect(res.statusCode).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.updatedCart.products.length).toBe(1);
        });
    });

    describe("GET /api/cart - Get user cart", () => {
        it("should return the user's cart with populated products", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                url: "/cart",
                user: { _id: "user1" }, // Mocked user ID
            });
            const res = httpMocks.createResponse();
    
            // Mock Cart.updateOne to simulate removing null products
            Cart.updateOne = jest.fn().mockResolvedValue({
                modifiedCount: 1, // Indicates that the cart was updated
            });
    
            // Mock Cart.findOne to simulate fetching the cart
            Cart.findOne = jest.fn().mockResolvedValue({
                products: [
                    {
                        product: "product1",
                        count: 2,
                        price: 10,
                        toObject: jest.fn().mockReturnValue({
                            product: "product1",
                            count: 2,
                            price: 10,
                        }),
                    },
                ],
                toObject: jest.fn().mockReturnValue({
                    products: [
                        {
                            product: "product1",
                            count: 2,
                            price: 10,
                        },
                    ],
                }),
            });
    
            // Mock axios.get to simulate fetching product details from another service
            axios.get = jest.fn().mockResolvedValueOnce({
                data: { name: "Product 1" }, // Mocked product details
            });
    
            // Call the controller function
            await cartController.getUserCart(req, res);
    
            // Verify the response status code
            expect(res.statusCode).toBe(200);
    
            // Parse the response data
            const data = JSON.parse(res._getData());
    
            // Verify the populated products in the response
            expect(data.products[0].product.name).toBe("Product 1");
        });
    });    
});