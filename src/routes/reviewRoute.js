import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import setReview from '../controllers/raviewController.js';

const reviewRouter = express.Router();

reviewRouter.post('/reviews', autenticate, setReview); 

export default reviewRouter;