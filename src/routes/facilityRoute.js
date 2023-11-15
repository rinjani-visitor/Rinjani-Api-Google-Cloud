import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {
  setFacility,
  getAllFacility,
  addFacility,
} from '../controllers/facilityController.js';

const facilityRouter = express.Router();

facilityRouter.post('/facilities', autenticate, setFacility); //admin
facilityRouter.post('/facilities/add', autenticate, addFacility); //admin
facilityRouter.get('/facilities', autenticate, getAllFacility); //admin

export default facilityRouter;
