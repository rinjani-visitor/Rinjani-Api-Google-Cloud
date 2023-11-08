import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import { setProduct, updateProduct } from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.post('/products', autenticate, setProduct);
productRouter.patch('/products/:id', autenticate, updateProduct);

export default productRouter;