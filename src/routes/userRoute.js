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
  getAllFavoriteUser,
  sendMessage,
  removeUserAccount,
  deleteUserByAdmin,
  isLoggedIn,
} from '../controllers/userController.js';
import { autenticate } from '../controllers/errorHandlingController.js';
import { upload } from '../middleware/multer_firebase.js';
const userRouter = express.Router();

userRouter.post('/users', setUser);
userRouter.get('/users/refresh', setRefreshToken);
userRouter.get('/admin/users', autenticate, getUser); //admin get all user
userRouter.get('/users', autenticate, getUserById);
userRouter.get('/users/me', autenticate, isLoggedIn);
userRouter.get('/users/activate/:id', setActivateUser);
userRouter.post('/users/login', setLogin);

userRouter.post('/admin/login', setLogin); //admin
userRouter.get('/admin/refresh', setRefreshToken); //admin

userRouter.patch('/users', autenticate, updateUser);
userRouter.patch(
  '/users/avatar',
  autenticate,
  upload.single('avatar'),
  avatarUser
);
userRouter.delete('/users/:id', autenticate, deleteUser);

userRouter.delete('/admin/users/:id', autenticate, deleteUserByAdmin); //admin

userRouter.post('/users/forgot-password', forgotPassword);

userRouter.get('/users/favorite/all', autenticate, getAllFavoriteUser);
userRouter.post('/users/favorite', autenticate, favorite);

userRouter.delete('/users', autenticate, removeUserAccount);

userRouter.post('/send-message', sendMessage);

export default userRouter;
