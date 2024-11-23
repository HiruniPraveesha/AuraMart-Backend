import asyncHandler from "express-async-handler";
import Admin from "../models/Admin.js";
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

// function to create token
const createToken = (_id) => {
    return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: '3d' })
}

// login a admin
const loginAdmin = async (req, res) => {
    const { email, password } = req.body
    try {
        const admin = await Admin.login(email, password)

        // create a token
        const token = createToken(admin._id)

        res.status(200).json({ email, token })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// signup a user
const signupAdmin = async (req, res) => {
    const { firstName, lastName, email, mobile, address, password } = req.body

    try {
        const admin = await Admin.signup(firstName, lastName, email, mobile, address, password)

        // create a token
        const token = createToken(admin._id)

        res.status(200).json({ email, token })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

export default {
    getAllProducts,
    getaProduct,
    loginAdmin,
    signupAdmin,
    createProdcut
}