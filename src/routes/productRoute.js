import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  setProduct,
  setRinjani,
  updateProduct,
} from '../controllers/productController.js';
import { updateFotoProduct, setFotoProduct } from '../controllers/fotoController.js';
import upload from '../middleware/multer.js';
import test from '../controllers/test.js';

const productRouter = express.Router();

productRouter.post('/products', autenticate, setProduct); //admin
productRouter.patch('/products/:id', autenticate, updateProduct); //admin
productRouter.post('/products/rinjani', autenticate, setRinjani); //admin
productRouter.post(
  '/products/foto/:product_id',
  autenticate,
  upload('./public/images/fotoproduct').array('fotoproduct', 5),
  setFotoProduct
); //admin
productRouter.patch(
  '/products/foto/:product_id/:foto_id',
  autenticate,
  upload('./public/images/fotoproduct').single('fotoproduct'),
  updateFotoProduct
); //admin

productRouter.get('/products/foto/:id', test);

export default productRouter;
