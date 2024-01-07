import express from 'express';
import { autenticate } from '../controllers/errorHandlingController.js';
import {setReview, getAllReview } from '../controllers/reviewController.js';

const reviewRouter = express.Router();

reviewRouter.post('/reviews', autenticate, setReview); 
reviewRouter.get('/reviews', getAllReview);

export default reviewRouter;