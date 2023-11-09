import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  setProduct,
  setRinjani,
  updateProduct,
} from '../controllers/productController.js';
import setFotoProduct from '../controllers/fotoController.js';
import upload from '../middleware/multer.js';

const productRouter = express.Router();

productRouter.post('/products', autenticate, setProduct); //admin
productRouter.patch('/products/:id', autenticate, updateProduct); //admin
productRouter.post('/products/rinjani', autenticate, setRinjani); //admin
productRouter.post(
  '/products/foto/:id',
  autenticate,
  upload('./public/images/fotoproduct').array('fotoproduct', 5),
  setFotoProduct
); //admin
export default productRouter;
