import asyncHandler from "express-async-handler";
import Seller from "../models/Seller.js";
import jwt from "jsonwebtoken";
import axios from "axios";

//function to get a specific product
const getaProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.get(`http://product:7005/api/product/${id}`)
        res.send(response.data)
    } catch (error) {
        throw new Error(error);
    }
});

//function to get all products to the seller dashboard
const getAllProducts = asyncHandler(async (req, res) => {
    try {
        const response = await axios.get(`http://product:7005/api/product/`)
        res.send(response.data)

    } catch (error) {
        throw new Error(error);
    }
});

//function to add product
const createProdcut = asyncHandler(async (req, res) => {
    const product = req.body
    try {
        const productResponse = await axios.post('http://product:7005/api/product/', product);

        res.status(201).json({
            message: 'Product created',
            newProduct: productResponse.data.newProduct
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating product',
            error
        });
    }
})



export default {
    getAllProducts,
    getaProduct,
    createProdcut
}