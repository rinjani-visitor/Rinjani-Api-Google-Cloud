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
  favorite,
  getAllFavorite,
} from '../controllers/userController.js';
import { autenticate } from '../controllers/errorHandlingController.js';
import upload from '../middleware/multer.js';
const userRouter = express.Router();

userRouter.post('/users', setUser);
userRouter.get('/users/refresh', setRefreshToken);
userRouter.get('/admin/users', autenticate, getUser); //admin get all user
userRouter.get('/users/:id', autenticate, getUserById);
userRouter.get('/users/activate/:id', setActivateUser);
userRouter.post('/users/login', setLogin);

userRouter.post('/admin/users/login', setLogin); //admin

userRouter.patch('/users/:id', autenticate, updateUser);
userRouter.patch(
  '/users/avatar/:id',
  autenticate,
  upload('./public/images/avatar').single('avatar'),
  avatarUser
);
userRouter.delete('/users/:id', autenticate, deleteUser);
userRouter.post('/users/forgot-password', forgotPassword);

userRouter.post('/users/favorite', autenticate, favorite);
userRouter.get('/users/favorite/all', autenticate, getAllFavorite);

export default userRouter;
