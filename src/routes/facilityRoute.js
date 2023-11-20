import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  setFacility,
  getAllFacility,
  addFacility,
  updateFacility,
  deleteFacility,
} from '../controllers/facilityController.js';

const facilityRouter = express.Router();

facilityRouter.post('/admin/facilities', autenticate, setFacility); //admin
facilityRouter.post('/admin/facilities/add', autenticate, addFacility); //admin
facilityRouter.patch('/admin/facilities', autenticate, updateFacility); //admin
facilityRouter.delete('/admin/facilities', autenticate, deleteFacility); //admin
facilityRouter.get('/admin/facilities', autenticate, getAllFacility); //admin

export default facilityRouter;
