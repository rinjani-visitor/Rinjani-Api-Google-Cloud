import express from 'express';
import {
  setUser,
  setActivateUser,
  getUser,
  getUserById,
  setLogin,
  setRefreshToken,
  updateUser,
  avatarUser,
  deleteUser,
  forgotPassword,
} from '../controllers/userController.js';
import { autenticate } from '../controllers/errorHandlingController.js';
import upload from '../middleware/multer.js';
const userRouter = express.Router();

userRouter.post('/users', setUser);
userRouter.get('/users/refresh', setRefreshToken);
userRouter.get('/users', getUser); //admin
userRouter.get('/users/:id', autenticate, getUserById);
userRouter.get('/users/activate/:id', setActivateUser);
userRouter.post('/users/login', setLogin);

userRouter.patch('/users/:id', autenticate, updateUser);
userRouter.patch(
  '/users/avatar/:id',
  autenticate,
  upload.single('avatar'),
  avatarUser
);
userRouter.delete('/users/:id', autenticate, deleteUser);
userRouter.get('/users/forgot-password', forgotPassword);

export default userRouter;
