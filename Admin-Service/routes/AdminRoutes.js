import express from "express";
// import requireAuth from '../middlewares/requireAuth.js'
import AdminController from '../controllers/AdminController.js';

const router = express.Router();

router.post('/login', AdminController.loginAdmin)
router.post('/signup', AdminController.signupAdmin)
router.get('/:id', AdminController.getaProduct);
router.post('/', AdminController.createProdcut);
router.get('/', AdminController.getAllProducts);



export default router;