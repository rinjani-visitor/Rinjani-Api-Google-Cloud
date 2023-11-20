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

const productRouter = express.Router();

productRouter.post(
  '/admin/products',
  autenticate,
  upload('./public/images/thumbnail').single('thumbnail'),
  setProduct
); //admin

productRouter.patch('/admin/products/:id', autenticate, updateProduct); //admin

productRouter.post('/admin/products/rinjani', autenticate, setRinjani); //admin

productRouter.post('/admin/products/homestay', autenticate, setHomeStay); //admin

productRouter.post(
  '/admin/products/foto/:product_id',
  autenticate,
  upload('./public/images/fotoproduct').array('fotoproduct', 5),
  setFotoProduct
); //admin

productRouter.patch(
  '/admin/products/foto/:product_id/:foto_id',
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

export default productRouter;
