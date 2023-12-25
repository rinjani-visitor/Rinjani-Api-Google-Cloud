import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  deleteCategory,
  deleteSubCategory,
  getAllCategories,
  getAllCategoriesandSubCategories,
  getAllSubCategories,
  setCategory,
  setSubCategory,
  updateCategory,
  updateSubCategory,
} from '../controllers/categoryController.js';

const categoryRouter = express.Router();

categoryRouter.post('/admin/categories', autenticate, setCategory); //admin
categoryRouter.patch('/admin/categories', autenticate, updateCategory); //admin
categoryRouter.delete('/admin/categories', autenticate, deleteCategory); //admin

categoryRouter.post('/admin/subcategories', autenticate, setSubCategory); //admin
categoryRouter.patch('/admin/subcategories', autenticate, updateSubCategory); //admin
categoryRouter.delete('/admin/subcategories', autenticate, deleteSubCategory); //admin

categoryRouter.get(
  '/admin/categoriesAndSubCategories',
  autenticate,
  getAllCategoriesandSubCategories
);

categoryRouter.get(
  '/admin/categories',
  autenticate,
  getAllCategories
)

categoryRouter.get(
  '/admin/subCategories',
  autenticate,
  getAllSubCategories
)

export default categoryRouter;
