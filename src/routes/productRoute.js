import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  getAllProducts,
  getHomeStayDetail,
  getRinjaniDetail,
  setHomeStay,
  setProduct,
  setRinjani,
  updateProduct,
} from '../controllers/productController.js';
import {
  updateFotoProduct,
  setFotoProduct,
} from '../controllers/fotoController.js';
import upload from '../middleware/multer.js';
import test from '../controllers/test.js';

const productRouter = express.Router();

productRouter.post(
  '/products',
  autenticate,
  upload('./public/images/thumbnail').single('thumbnail'),
  setProduct
); //admin

productRouter.patch('/products/:id', autenticate, updateProduct); //admin

productRouter.post('/products/rinjani', autenticate, setRinjani); //admin

productRouter.post('/products/homestay', autenticate, setHomeStay); //admin

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

productRouter.get('/products', autenticate, getAllProducts);

productRouter.get(
  '/products/rinjani/:product_id',
  autenticate,
  getRinjaniDetail
);
productRouter.get(
  '/products/homestay/:product_id',
  autenticate,
  getHomeStayDetail
);

productRouter.get('/products/foto/:id', test);

export default productRouter;
