import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  deleteProduct,
  getAllProducts,
  getProductDetail,
  setEvent,
  setHomeStay,
  setProduct,
  setProductJson,
  setRinjani,
  setWisata,
  updateProduct,
} from '../controllers/productController.js';
import {
  updateFotoProduct,
  updateFotoProductJson,
  setFotoProductJson,
  setFotoProduct,
  deleteFotoProduct,
  getAllFotoProduct,
} from '../controllers/fotoController.js';
import { upload } from '../middleware/multer_firebase.js';

const productRouter = express.Router();

productRouter.post(
  '/admin/products',
  autenticate,
  upload.single('thumbnail'),
  setProduct
); //admin

productRouter.post(
  '/admin/add-products',
  autenticate,
  setProductJson
); //admin

productRouter.patch('/admin/products/:id', autenticate, updateProduct); //admin

productRouter.post('/admin/products/rinjani', autenticate, setRinjani); //admin

productRouter.post('/admin/products/homestay', autenticate, setHomeStay); //admin

productRouter.post('/admin/products/wisata', autenticate, setWisata); //admin

productRouter.post('/admin/products/event', autenticate, setEvent); //admin

productRouter.post(
  '/admin/products/foto/:product_id',
  autenticate,
  upload.array('fotoproduct', 5),
  setFotoProduct
); //admin

productRouter.post('/admin/products/fotos/:product_id', autenticate, setFotoProductJson); //admin

productRouter.delete('/admin/products/foto/:product_id/:foto_id', autenticate, deleteFotoProduct); //admin

productRouter.patch(
  '/admin/products/foto/:product_id/:foto_id',
  autenticate,
  upload.single('fotoproduct'),
  updateFotoProduct
); //admin

productRouter.patch('/admin/products/fotos/:product_id/:foto_id', autenticate, updateFotoProductJson); //admin

productRouter.delete('/admin/products/:id', autenticate, deleteProduct); //admin

productRouter.get('/admin/products/fotos/:product_id', autenticate, getAllFotoProduct); //admin

productRouter.get('/products', getAllProducts);

productRouter.get('/admin/products', getAllProducts); //admin

productRouter.get('/products/:product_id', getProductDetail);

export default productRouter;
