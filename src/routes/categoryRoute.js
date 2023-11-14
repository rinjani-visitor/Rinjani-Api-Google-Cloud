import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  getAllCategoriesandSubCategories,
  setCategory,
  setSubCategory,
} from '../controllers/categoryController.js';

const categoryRouter = express.Router();

categoryRouter.post('/categories', autenticate, setCategory); //admin
categoryRouter.post('/subcategories', autenticate, setSubCategory); //admin
categoryRouter.get(
  '/categories',
  autenticate,
  getAllCategoriesandSubCategories
);

export default categoryRouter;
