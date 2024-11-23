import express from "express";
import ProductController from "../controllers/ProductController.js";
import {getProductsByCategory} from '../controllers/CategoryController.js';
import { getAllCategoriesWithProducts } from '../controllers/CategoryController.js';
import UploadImages from "../middleware/uploadImages.js";
import { getAllCategories } from "../controllers/CategoryController.js";
import axios from "axios";

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const response = await axios.post('http://userauth:7002/api/user/verify', {
            token: token
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        req.user = response.data.user;
        next();
    } catch (error) {
        console.log(error)
        res.status(401).json({ message: 'Unauthorized' });
    }
};


const router = express.Router();

router.post('/', ProductController.createProduct);
router.put('/upload/:id',
    verifyToken,
    UploadImages.uploadPhoto.array('images', 10),
    UploadImages.productImgResize,
    ProductController.uploadImages
);
router.get('/categories/product', getAllCategoriesWithProducts);
router.get("/category/:category", ProductController.getProductsByCategory);
router.get('/:id', ProductController.getaProduct);
router.get('/', ProductController.getAllProducts);
router.put('/rating', verifyToken, ProductController.rating);
router.put('/:id', ProductController.updateProduct);
router.put("/", ProductController.bulkUpdate)
router.delete('/:id', ProductController.deleteProduct);
router.post('/', ProductController.createProduct);
router.get('/categories/:slug', getProductsByCategory);
router.get("/categories", getAllCategories);



export default router;