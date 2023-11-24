import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  setAddOns,
  addAddOns,
  getAllAddOns,
  updateAddOns,
  deleteAddOns,
} from '../controllers/addOnsController.js';

const addOnsRouter = express.Router();

addOnsRouter.post('/admin/addOns', autenticate, setAddOns); //admin
addOnsRouter.post('/admin/addOns/add', autenticate, addAddOns); //admin
addOnsRouter.patch('/admin/addOns', autenticate, updateAddOns); //admin
addOnsRouter.delete('/admin/addOns', autenticate, deleteAddOns); //admin
addOnsRouter.get('/admin/addOns', autenticate, getAllAddOns); //admin

export default addOnsRouter;
