import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  setFacility,
  getAllFacility,
  addFacility,
  updateFacility,
  deleteFacility,
  deleteFacilityList,
} from '../controllers/facilityController.js';

const facilityRouter = express.Router();

facilityRouter.post('/admin/facilities', autenticate, setFacility); //admin
facilityRouter.post('/admin/facilities/:productId', autenticate, addFacility); //admin
facilityRouter.patch('/admin/facilities/:productId', autenticate, updateFacility); //admin
facilityRouter.delete('/admin/facilities/:productId', autenticate, deleteFacility); //admin
facilityRouter.delete('/admin/facilities', autenticate, deleteFacilityList); //admin
facilityRouter.get('/admin/facilities', autenticate, getAllFacility); //admin

export default facilityRouter;
