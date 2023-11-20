import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  getAllCategoriesandSubCategories,
  setCategory,
  setSubCategory,
} from '../controllers/categoryController.js';

const categoryRouter = express.Router();

categoryRouter.post('/admin/categories', autenticate, setCategory); //admin
categoryRouter.post('/admin/subcategories', autenticate, setSubCategory); //admin
categoryRouter.get(
  '/categories',
  autenticate,
  getAllCategoriesandSubCategories
);

export default categoryRouter;
