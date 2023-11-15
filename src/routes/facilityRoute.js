import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {setFacility, getAllFacility} from '../controllers/facilityController.js';

const facilityRouter = express.Router();

facilityRouter.post('/facilities', autenticate, setFacility); //admin
facilityRouter.get('/facilities', autenticate, getAllFacility);

export default facilityRouter;
