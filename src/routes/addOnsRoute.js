import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  setAddOns,
  addAddOns,
  getAllAddOns,
  updateAddOns,
  deleteAddOns,
  deleteAddOnsList,
} from '../controllers/addOnsController.js';

const addOnsRouter = express.Router();

addOnsRouter.post('/admin/addOns', autenticate, setAddOns); //admin
addOnsRouter.post('/admin/addOns/:productId', autenticate, addAddOns); //admin
addOnsRouter.patch('/admin/addOns/:productId', autenticate, updateAddOns); //admin
addOnsRouter.delete('/admin/addOns/:productId', autenticate, deleteAddOns); //admin
addOnsRouter.delete('/admin/addOns', autenticate, deleteAddOnsList); //admin
addOnsRouter.get('/admin/addOns', autenticate, getAllAddOns); //admin

export default addOnsRouter;
