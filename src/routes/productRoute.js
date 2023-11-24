import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  deleteProduct,
  getAllProducts,
  getEventDetail,
  getHomeStayDetail,
  getRinjaniDetail,
  getWisataDetail,
  setEvent,
  setHomeStay,
  setProduct,
  setRinjani,
  setWisata,
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

productRouter.post('/admin/products/wisata', autenticate, setWisata); //admin

productRouter.post('/admin/products/event', autenticate, setEvent); //admin

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

productRouter.delete('/admin/products/:id', autenticate, deleteProduct);//admin

productRouter.get('/products', getAllProducts);

productRouter.get(
  '/products/rinjani/:product_id',
  getRinjaniDetail
);

productRouter.get(
  '/products/homestay/:product_id',
  getHomeStayDetail
);

productRouter.get(
  '/products/wisata/:product_id',
  getWisataDetail
);

productRouter.get(
  '/products/event/:product_id',
  getEventDetail
);

export default productRouter;
