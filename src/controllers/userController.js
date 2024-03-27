import 'dotenv/config';
import moment from 'moment-timezone';
import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import {
  sendConfirmDeleteAccountUserByAdmin,
  sendMail,
  sendMailMessage,
  sendPassword,
} from '../utils/sendMail.js';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import User from '../models/userModel.js';
import { Op } from 'sequelize';
import { compare } from '../utils/bcrypt.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getUserIdFromAccessToken,
  parseJWT,
  verifyRefreshToken,
} from '../utils/jwt.js';
import {
  userActivatedHtml,
  userNotFoundHtml,
} from '../utils/responActivation.js';
import { isExists } from '../validation/sanitization.js';
import { Entropy, charset32 } from 'entropy-string';
import Favorites from '../models/favoritesModel.js';
import Product from '../models/productModel.js';
import { bucket } from '../middleware/multer_firebase.js';
import { adminEmails } from '../utils/emailAdmin.js';

const setUser = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    name: 'required',
    email: 'required,isEmail',
    country: 'required',
    password: 'required,isStrongPassword',
    confirmPassword: 'required',
  };

  try {
    const userExists = await User.findAll({
      where: {
        email: req.body.email,
      },
    });

    if (userExists.length > 0 && userExists[0].isActive) {
      return res.status(400).json({
        errors: ['Email already activated'],
        message: 'Register Failed',
        data: null,
      });
    } else if (
      userExists.length > 0 &&
      !userExists[0].isActive &&
      moment(userExists[0].expireTime).isAfter(
        moment().tz('Asia/Singapore').format('YYYY-MM-DD HH:mm:ss')
      )
    ) {
      return res.status(400).json({
        errors: ['Email already registered, please check your email'],
        message: 'Register Failed',
        data: null,
      });
    } else {
      User.destroy(
        {
          where: {
            email: req.body.email,
          },
        },
        {
          transaction: t,
        }
      );
    }

    const userData = {
      name: req.body.name,
      email: req.body.email,
      country: req.body.country,
      password: req.body.password,
    };

    const newUser = await User.create(
      {
        ...userData,
      },
      {
        transaction: t,
      }
    );

    if (!newUser) {
      await t.rollback();
      return res.status(500).json({
        errors: ['User not created in the database'],
        message: 'Register Failed',
        data: null,
      });
    }

    const result = await sendMail(newUser.email, newUser.userId);

    if (!result) {
      await t.rollback();
      return res.status(500).json({
        errors: ['Send email failed'],
        message: 'Register Failed',
        data: null,
      });
    } else {
      await t.commit();
      res.status(201).json({
        errors: null,
        message: 'User created, please check your email',
        data: {
          userId: newUser.userId,
          name: newUser.name,
          email: newUser.email,
          expireTime: newUser.expireTime,
        },
      });
    }
  } catch (error) {
    await t.rollback();
    next(new Error('controllers/userController.js:setUser - ' + error.message));
  }
};

const setActivateUser = async (req, res, next) => {
  try {
    const user_id = req.params.id;
    const user = await User.findOne({
      where: {
        userId: user_id,
        isActive: false,
        expireTime: {
          [Op.gte]: moment().tz('Asia/Singapore').format('YYYY-MM-DD HH:mm:ss'),
        },
      },
    });
    if (!user) {
      return res.status(404).send(userNotFoundHtml);
    } else {
      const userName = user.name;
      const userEmail = user.email;

      user.isActive = true;
      user.expireTime = null;
      await user.save();

      const userActivatedResponse = userActivatedHtml(userName, userEmail);

      return res.status(200).send(userActivatedResponse);
    }
  } catch (error) {
    next(
      new Error(
        'controllers/userController.js:setActivateUser - ' + error.message
      )
    );
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findAll();
    res.status(200).json({
      errors: [],
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(new Error('controllers/userController.js:getUser - ' + error.message));
  }
};

const getUserById = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const tokenInfo = getUserIdFromAccessToken(token);
    const user_id = tokenInfo.userId;

    const user = await User.findOne({
      where: {
        userId: user_id,
      },
    });
    if (!user) {
      return res.status(404).json({
        errors: ['User not found'],
        message: 'Get User By Id Failed',
        data: null,
      });
    }
    return res.status(200).json({
      errors: [],
      message: 'Get user by id successfully',
      data: {
        name: user.name,
        email: user.email,
        country: user.country,
        phoneNumber: user.phoneNumber,
        profilPicture: user.profilPicture,
      },
    });
  } catch (error) {
    next(
      new Error('controllers/userController.js:getUserById - ' + error.message)
    );
  }
};

const isLoggedIn = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const tokenInfo = getUserIdFromAccessToken(token);
    const user_id = tokenInfo.userId;

    const user = await User.findOne({
      where: {
        userId: user_id,
      },
    });
    if (!user) {
      return res.status(404).json({
        errors: ['User not found'],
        message: 'User retrieved Failed',
        data: null,
      });
    }
    return res.status(200).json({
      errors: [],
      message: 'User retrieved successfully',
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(
      new Error('controllers/userController.js:isLoggedIn - ' + error.message)
    );
  }
};

const setLogin = async (req, res, next) => {
  try {
    const valid = {
      email: 'required,isEmail',
      password: 'required',
    };
    const user = await dataValid(valid, req.body);
    const data = user.data;
    if (user.message.length > 0) {
      return res.status(400).json({
        errors: user.message,
        message: 'Login Failed',
        data: null,
      });
    }
    const userExists = await User.findOne({
      where: {
        email: data.email,
        isActive: true,
      },
    });
    if (!userExists) {
      return res.status(400).json({
        errors: ['User not found'],
        message: 'Login Failed',
        data: data,
      });
    }
    if (compare(data.password, userExists.password)) {
      const usr = {
        userId: userExists.userId,
        name: userExists.name,
        email: userExists.email,
        role: 'user', //default role user
      };

      //khusus admin login
      const adminEmailsList = adminEmails;
      if (req.url.includes('/admin') && adminEmailsList.includes(usr.email)) {
        usr.role = 'admin';
      }

      const token = generateAccessToken(usr);
      const refreshToken = generateRefreshToken(usr);
      return res.status(200).json({
        errors: [],
        message: 'Login successfully',
        data: usr,
        accessToken: token,
        refreshToken: refreshToken,
      });
    } else {
      return res.status(400).json({
        errors: ['Wrong password'],
        message: 'Login Failed',
        data: data,
      });
    }
  } catch (error) {
    next(
      new Error('controllers/userController.js:setLogin - ' + error.message)
    );
  }
};

const setRefreshToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        errors: ['Refresh token not found'],
        message: 'Refresh Failed',
        data: null,
      });
    }
    const verify = verifyRefreshToken(token);
    if (!verify) {
      return res.status(401).json({
        errors: ['Invalid refresh token'],
        message: 'Refresh Failed',
        data: null,
      });
    }
    let data = parseJWT(token);
    const user = await User.findOne({
      where: {
        email: data.email,
        isActive: true,
      },
    });
    if (!user) {
      return res.status(404).json({
        errors: ['User not found'],
        message: 'Refresh Failed',
        data: null,
      });
    } else {
      const usr = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: 'user', //default role user
      };

      const adminEmail = 'muhfirdaus0805@gmail.com';
      if (req.url.includes('/admin') && usr.email === adminEmail) {
        usr.role = 'admin';
      }

      const token = generateAccessToken(usr);
      const refreshToken = generateRefreshToken(usr);
      return res.status(200).json({
        errors: [],
        message: 'Refresh successfully',
        data: usr,
        accessToken: token,
        refreshToken: refreshToken,
      });
    }
  } catch (error) {
    next(
      new Error(
        'controllers/userController.js:setRefreshToken - ' + error.message
      )
    );
  }
};

const updateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const tokenInfo = getUserIdFromAccessToken(token);
    const user_id = tokenInfo.userId;

    if (
      !req.body.name &&
      !req.body.email &&
      !req.body.password &&
      !req.body.country &&
      !req.body.phoneNumber &&
      !req.body.profilPicture
    ) {
      return res.status(200).json({
        errors: [],
        message: 'No data to update',
        data: null,
      });
    }

    const valid = {};
    if (isExists(req.body.name)) {
      valid.name = 'required';
    }
    if (isExists(req.body.email)) {
      valid.email = 'required,isEmail';
    }
    if (isExists(req.body.password)) {
      valid.password = 'required,isStrongPassword';
      valid.confirmPassword = 'required';
    }
    if (isExists(req.body.country)) {
      valid.country = 'required';
    }
    if (isExists(req.body.phoneNumber)) {
      valid.phoneNumber = 'required';
    }

    const user = await dataValid(valid, req.body);
    if (
      isExists(user.data.password) &&
      user.data.password !== user.data.confirmPassword
    ) {
      user.message.push('Password not match');
    }
    if (user.message.length > 0) {
      return res.status(400).json({
        errors: user.message,
        message: 'Update Failed',
        data: null,
      });
    }

    const updateData = {
      ...user.data,
    };

    if (isExists(req.body.profilPicture)) {
      updateData.profilPicture = req.body.profilPicture;
    }

    const result = await User.update(updateData, {
      where: {
        userId: user_id,
      },
    });

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['User not found'],
        message: 'Update Failed',
        data: null,
      });
    } else {
      return res.status(200).json({
        errors: [],
        message: 'User updated successfully',
        data: user.data,
      });
    }
  } catch (error) {
    next(
      new Error('controllers/userController.js:updateUser - ' + error.message)
    );
  }
};

const avatarUser = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const tokenInfo = getUserIdFromAccessToken(token);
    const user_id = tokenInfo.userId;

    const uploadedFileName = req.file;

    if (uploadedFileName) {
      const allowedImageFormats = ['image/jpeg', 'image/jpg', 'image/png'];

      if (!allowedImageFormats.includes(req.file.mimetype)) {
        return res.status(400).json({
          errors: [
            'Invalid file format. Only JPEG, JPG, and PNG images are allowed.',
          ],
          message: 'Update Avatar Failed',
          data: null,
        });
      }

      const folderName = 'avatar-rinjani';
      const fileName = `${uuidv4()}-${req.file.originalname}`;
      const filePath = `${folderName}/${fileName}`;

      const metadata = {
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
        contentType: req.file.mimetype,
        cacheControl: 'public, max-age=31536000',
      };

      const blob = bucket.file(filePath);
      const blobStream = blob.createWriteStream({
        metadata,
        gzip: true,
      });

      blobStream.on('error', (error) =>
        res.status(500).json({
          errors: [error.message],
          message: 'Update Avatar Failed',
          data: null,
        })
      );

      let urlphoto;
      blobStream.on('finish', async () => {
        urlphoto = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(filePath)}?alt=media`;
      });

      const blobStreamEnd = promisify(blobStream.end).bind(blobStream);

      await blobStreamEnd(req.file.buffer);

      const result = await User.update(
        {
          profilPicture: urlphoto,
        },
        {
          where: {
            userId: user_id,
          },
        }
      );
      if (result[0] == 0) {
        return res.status(404).json({
          errors: ['Failed to save url photo to database'],
          message: 'Update Failed',
          data: null,
        });
      } else {
        return res.status(200).json({
          errors: [],
          message: 'User avatar updated successfully',
          data: [],
        });
      }
    }
  } catch (error) {
    next(
      new Error('controllers/userController.js:avatarUser - ' + error.message)
    );
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user_id = req.params.id;
    const usrDelete = User.destroy({
      where: {
        userId: user_id,
      },
    });
    if (!usrDelete) {
      return res.status(404).json({
        errors: ['User not found'],
        message: 'Delete Failed',
        data: null,
      });
    }
    return res.status(200).json({
      errors: [],
      message: 'User deleted successfully',
      data: null,
    });
  } catch (error) {
    next(
      new Error('controllers/userController.js:deleteUser - ' + error.message)
    );
  }
};

const deleteUserByAdmin = async (req, res, next) => {
  try {
    const user_id = req.params.id;

    const getEmail = await User.findOne({
      attributes: ['email', 'userId'],
      where: {
        userId: user_id,
      },
    });

    const usrDelete = User.destroy({
      where: {
        userId: user_id,
      },
    });
    if (!usrDelete) {
      return res.status(404).json({
        errors: ['User not found'],
        message: 'Delete Failed',
        data: null,
      });
    }

    const sendMail = await sendConfirmDeleteAccountUserByAdmin(getEmail.email);

    if (!sendMail) {
      return res.status(500).json({
        errors: ['Failed to send email confirmation'],
        message: 'Delete Failed',
        data: null,
      });
    }

    return res.status(200).json({
      errors: [],
      message: 'User deleted successfully',
      data: null,
    });
  } catch (error) {
    next(
      new Error('controllers/userController.js:deleteUser - ' + error.message)
    );
  }
};

const forgotPassword = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const valid = {
      email: 'required,isEmail',
    };
    const userData = await dataValid(valid, req.body);
    if (userData.message.length > 0) {
      return res.status(400).json({
        errors: userData.message,
        message: 'Forgot Password Failed',
        data: null,
      });
    }
    const user = await User.findOne({
      where: {
        email: userData.data.email,
      },
    });
    if (!user) {
      return res.status(404).json({
        errors: ['User not found'],
        message: 'Forgot Password Failed',
        data: null,
      });
    }
    // dapatkan random password
    const random = new Entropy({ bits: 60, charset: charset32 });
    const stringPwd = random.string();
    await User.update(
      {
        password: stringPwd,
      },
      {
        where: {
          user_id: user.userId,
        },
        transaction: t,
      }
    );
    const result = await sendPassword(user.email, stringPwd);
    if (!result) {
      await t.rollback();
      return res.status(400).json({
        errors: ['Email not sent'],
        message: 'Forgot Password Failed',
        data: null,
      });
    }
    await t.commit();
    return res.status(200).json({
      errors: [],
      message: 'Forgot Password success, please check your email',
      data: null,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/userController.js:forgotPassword - ' + error.message
      )
    );
  }
};

const favorite = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const tokenInfo = getUserIdFromAccessToken(token);
    const user_id = tokenInfo.userId;
    const product_id = req.body.productId;

    if (!user_id || !product_id) {
      return res.status(400).json({
        errors: ['userId and productId is required'],
        message: 'Favorite Failed',
        data: null,
      });
    }

    const checkFavorite = await Favorites.findOne({
      where: {
        userId: user_id,
        productId: product_id,
      },
    });

    if (checkFavorite) {
      await Favorites.destroy({
        where: {
          userId: user_id,
          productId: product_id,
        },
        transaction: t,
      });
      await t.commit();
      return res.status(200).json({
        errors: [],
        message: 'Unfavorite successfully',
        data: null,
      });
    }

    const result = await Favorites.create(
      {
        userId: user_id,
        productId: product_id,
      },
      {
        transaction: t,
      }
    );

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to save favorite to database'],
        message: 'Favorite Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(201).json({
      errors: [],
      message: 'Favorite successfully',
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error('controllers/userController.js:favorite - ' + error.message)
    );
  }
};

const getAllFavoriteUser = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const tokenInfo = getUserIdFromAccessToken(token);
    const user_id = tokenInfo.userId;

    const checkUser = await User.findOne({
      where: {
        userId: user_id,
      },
    });

    if (!checkUser) {
      return res.status(404).json({
        errors: ['User not found'],
        message: 'Get All Favorite Failed',
        data: null,
      });
    }

    const result = await Favorites.findAll({
      where: {
        userId: user_id,
      },
    });

    const productIds = result.map((favorite) => favorite.productId);

    const favoriteProducts = await Product.findAll({
      where: {
        productId: {
          [Op.in]: productIds,
        },
      },
    });

    const formattedProducts = favoriteProducts.map((product) => ({
      productId: product.productId,
      title: product.title,
      status: product.status,
      rating: product.rating ? product.rating : 0,
      location: product.location,
      thumbnail: product.thumbnail,
      lowestPrice: product.lowestPrice,
    }));

    return res.status(200).json({
      errors: [],
      message: 'Get All Favorite successfully',
      data: formattedProducts,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/userController.js:getAllFavorite - ' + error.message
      )
    );
  }
};

const sendMessage = async (req, res, next) => {
  const valid = {
    emailUser: 'required,isEmail',
    name: 'required',
    subject: 'required',
    message: 'required',
  };
  try {
    const dataSender = await dataValid(valid, req.body);

    if (dataSender.message.length > 0) {
      return res.status(400).json({
        errors: dataSender.message,
        message: 'Failed Send Message Email',
        data: null,
      });
    }

    const { emailUser, name, subject, message } = dataSender.data;

    let sendPaymentMails = [];
    for (const email of adminEmails) {
      const sendPaymentMail = sendMailMessage(
        email,
        emailUser,
        name,
        subject,
        message
      ); // Menghapus await di sini agar pengiriman email dilakukan secara paralel
      sendPaymentMails.push(sendPaymentMail); // Menambahkan promise ke array
    }

    // Menunggu semua email terkirim atau gagal
    const results = await Promise.all(sendPaymentMails);

    // Memeriksa apakah setidaknya satu email gagal terkirim
    if (results.some((result) => !result)) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed Send Message Email'],
        message: 'Failed Send Message Email',
        data: null,
      });
    }

    return res.status(200).json({
      errors: [],
      message: 'Success Send Message Email',
      data: null,
    });
  } catch (error) {
    next(
      new Error(`controllers/userController.js:sendMessage - ${error.message}`)
    );
  }
};

const removeUserAccount = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const tokenInfo = getUserIdFromAccessToken(token);
    const { userId } = tokenInfo;

    const user = await User.findOne({
      where: {
        userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        errors: ['User not found'],
        message: 'Remove User Account Failed',
        data: null,
      });
    }

    const result = await User.destroy({
      where: {
        userId,
      },
      transaction,
    });

    if (!result) {
      await transaction.rollback();
      return res.status(404).json({
        errors: ['Failed to remove user account'],
        message: 'Remove User Account Failed',
        data: null,
      });
    }

    await transaction.commit();

    return res.status(200).json({
      errors: [],
      message: 'Remove User Account Success',
      data: null,
    });
  } catch (error) {
    await transaction.rollback();
    next(
      new Error(
        `controllers/userController.js:removeUserAccount - ${error.message}`
      )
    );
  }
};

export {
  setUser,
  setActivateUser,
  getUser,
  getUserById,
  isLoggedIn,
  setLogin,
  setRefreshToken,
  updateUser,
  avatarUser,
  deleteUser,
  deleteUserByAdmin,
  forgotPassword,
  favorite,
  getAllFavoriteUser,
  sendMessage,
  removeUserAccount,
};
