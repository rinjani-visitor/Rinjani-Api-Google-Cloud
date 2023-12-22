import 'dotenv/config';
import moment from 'moment-timezone';
import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import { sendMail, sendMailMessage, sendPassword } from '../utils/sendMail.js';
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
    const user = await dataValid(valid, req.body);

    // Cek password
    if (user.data.password !== user.data.confirmPassword) {
      user.message.push('Password does not match');
    }

    if (user.message.length > 0) {
      return res.status(400).json({
        errors: user.message,
        message: 'Register Failed',
        data: null,
      });
    }

    const userExists = await User.findAll({
      where: {
        email: user.data.email,
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
      moment(userExists[0].expireTime).isAfter(moment().tz('Asia/Singapore').format('YYYY-MM-DD HH:mm:ss'))
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
            email: user.data.email,
          },
        },
        {
          transaction: t,
        }
      );
    }

    const newUser = await User.create(
      {
        ...user.data,
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
      const adminEmail = process.env.ADMIN_EMAIL;
      if (req.url.includes('/admin') && usr.email === adminEmail) {
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
      }
    );
    
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

    const uploadedFileName = req.file.filename;
    if (uploadedFileName) {
      const finalName =
        process.env.GOOGLE_CLOUD_RUN_EXTERNAL_URL +
        '/images/avatar/' +
        uploadedFileName;
      const result = await User.update(
        {
          profilPicture: finalName,
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
    email: 'required,isEmail',
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

    const {
      email, name, subject, message,
    } = dataSender.data;

    const sendMailVariable = await sendMailMessage(email, name, subject, message);

    if (!sendMailVariable) {
      return res.status(400).json({
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
      new Error(
        `controllers/userController.js:sendMessage - ${error.message}`,
      ),
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

    if(!result) {
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
        `controllers/userController.js:removeUserAccount - ${error.message}`,
      ),
    );
  }
};


export {
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
};
