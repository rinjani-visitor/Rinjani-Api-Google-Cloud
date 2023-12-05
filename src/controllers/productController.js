import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import { isExists } from '../validation/sanitization.js';
import Product from '../models/productModel.js';
import ModelRinjani from '../models/modelRinjaniNew.js';
import Foto from '../models/fotoModel.js';
import HomeStay from '../models/HomeStayModel.js';
import Favorites from '../models/favoritesModel.js';
import Category from '../models/categoryModel.js';
import SubCategory from '../models/subCategoryModel.js';
import Facility from '../models/facilityModel.js';
import Booking from '../models/bookingModel.js';
import Wisata from '../models/wisataModel.js';
import EventModel from '../models/eventModel.js';
import Review from '../models/reviewModel.js';
import AddOnsModel from '../models/addOnsModel.js';
import User from '../models/userModel.js';
import { Op } from 'sequelize';
import { getUserIdFromAccessToken, verifyAccessToken } from '../utils/jwt.js';

const setProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    title: 'required',
    categoryId: 'required, isDecimal',
    location: 'required',
    lowestPrice: 'required',
  };
  try {
    const product = await dataValid(valid, req.body);
    if (product.message.length > 0) {
      return res.status(400).json({
        errors: product.message,
        message: 'Product Failed',
        data: null,
      });
    }

    let subCategoryId = req.body.subCategoryId;
    if (!subCategoryId) {
      subCategoryId = null;
    }

    const thumbnail = req.file.filename;
    if (!thumbnail) {
      return res.status(400).json({
        errors: ['Thumbnail is required'],
        message: 'Product Failed',
        data: null,
      });
    } else {
      const finalName =
        process.env.GOOGLE_CLOUD_RUN_EXTERNAL_URL +
        '/images/thumbnail/' +
        thumbnail;
      const result = await Product.create(
        {
          ...product.data,
          subCategoryId,
          thumbnail: finalName,
        },
        {
          transaction: t,
        }
      );
      if (result[0] == 0) {
        return res.status(404).json({
          errors: ['Failed to save url photo to database'],
          message: 'Update Failed',
          data: null,
        });
      } else {
        await t.commit();
        return res.status(201).json({
          errors: [],
          message: 'Product created successfully',
          data: result,
        });
      }
    }
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/productController.js:setProduct - ' + error.message
      )
    );
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product_id = req.params.id;
    const valid = {};
    if (isExists(req.body.title)) {
      valid.title = 'required';
    }
    if (isExists(req.body.status)) {
      valid.status = 'required';
    }
    if (isExists(req.body.location)) {
      valid.location = 'required';
    }
    if (isExists(req.body.category)) {
      valid.category = 'required';
    }

    const product = await dataValid(valid, req.body);

    if (product.message.length > 0) {
      return res.status(400).json({
        errors: product.message,
        message: 'Update Failed',
        data: null,
      });
    }
    const result = await Product.update(
      {
        ...product.data,
      },
      {
        where: {
          productId: product_id,
        },
      }
    );
    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Update Failed',
        data: null,
      });
    } else {
      return res.status(200).json({
        errors: [],
        message: 'Product updated successfully',
        data: product.data,
      });
    }
  } catch (error) {
    next(
      new Error(
        'controllers/productController.js:updateProduct - ' + error.message
      )
    );
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const {
      category: categoryName,
      rating: ratingFilter,
      status: statusProduct,
      title: titleFilter,
    } = req.query;

    let whereCondition = {};

    if (categoryName) {
      whereCondition = {
        ...whereCondition,
        '$category.category$': categoryName,
      };
    }

    if (ratingFilter) {
      const lowerThan = parseInt(ratingFilter, 10) + 1;
      whereCondition = {
        ...whereCondition,
        '$Product.rating$': {
          [Op.lt]: lowerThan,
          [Op.gte]: ratingFilter,
        },
      };
    }

    if (statusProduct) {
      whereCondition = {
        ...whereCondition,
        '$Product.status$': statusProduct === 'true',
      };
    }

    if (titleFilter) {
      whereCondition = {
        ...whereCondition,
        '$Product.title$': {
          [Op.like]: `%${titleFilter}%`, // Case-insensitive LIKE query
        },
      };
    }

    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ['category'], // Exclude category attributes from result
          as: 'category', // Adjust alias to match the association
          where: whereCondition,
        },
      ],
      where: whereCondition,
    });

    if (!products || products.length === 0) {
      return res.status(200).json({
        errors: ['Product not found'],
        message: 'Get All Product Failed',
        data: null,
      });
    }

    const formattedProducts = products.map((product) => ({
      productId: product.productId,
      title: product.title,
      status: product.status,
      rating: product.rating ? product.rating : 0,
      location: product.location,
      thumbnail: product.thumbnail,
      lowestPrice: product.lowestPrice,
      category: product.category.category,
    }));

    return res.status(200).json({
      errors: [],
      message: 'Get All Product Success',
      data: formattedProducts,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/productController.js:getAllProducts - ' + error.message
      )
    );
  }
};

const deleteProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const product_id = req.params.id;

    const checkBooking = await Booking.findOne({
      where: {
        productId: product_id,
      },
    });

    if (checkBooking) {
      return res.status(400).json({
        errors: ['Product has booking'],
        message: 'Delete Failed',
        data: null,
      });
    }

    const checkProduct = await Product.findByPk(product_id);

    if (!checkProduct) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Delete Failed',
        data: null,
      });
    }

    const result = await Product.destroy({
      where: {
        productId: product_id,
      },
      transaction: t,
    });

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Delete Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(201).json({
      errors: [],
      message: 'Product deleted successfully',
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/productController.js:deleteProduct - ' + error.message
      )
    );
  }
};

const setRinjani = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    description: 'required',
    duration: 'required',
    program: 'required',
    productId: 'required',
  };
  try {
    const rinjani = await dataValid(valid, req.body);
    if (rinjani.message.length > 0) {
      return res.status(400).json({
        errors: rinjani.message,
        message: 'Set Rinjani Failed',
        data: null,
      });
    }
    const product_id = req.body.productId;
    const cekProductId = await Product.findOne({
      where: {
        productId: product_id,
      },
    });
    if (!cekProductId) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Set Rinjani Failed',
        data: null,
      });
    }
    const newRinjani = await ModelRinjani.create(
      {
        ...rinjani.data,
        productId: product_id,
      },
      {
        transaction: t,
      }
    );

    if (!newRinjani) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Rinjani not found'],
        message: 'Set Rinjani Failed',
        data: null,
      });
    }

    await t.commit();
    return res.status(201).json({
      errors: [],
      message: 'Rinjani created successfully',
      data: newRinjani,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/productController.js:setRinjani - ' + error.message
      )
    );
  }
};

const getRinjaniDetail = async (req, res, next) => {
  try {
    const id_product = req.params.product_id;

    const checkRinjani = await ModelRinjani.findOne({
      where: {
        productId: id_product,
      },
    });

    if (!checkRinjani) {
      return res.status(404).json({
        errors: ['Rinjani Product not found'],
        message: 'Get Rinjani Detail Failed',
        data: null,
      });
    }

    const rinjaniResult = await Product.findOne({
      where: {
        productId: id_product,
      },
      include: [
        {
          model: ModelRinjani,
          attributes: ['description', 'duration', 'program', 'note'],
        },
        {
          model: Foto,
        },
        {
          model: Category,
        },
        {
          model: SubCategory,
        },
        {
          model: Facility,
          attributes: ['facilityName'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: AddOnsModel,
          attributes: ['addOnsName'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: Review,
          attributes: ['rating', 'messageReview', 'createdAt'],
          include: [
            {
              model: User,
              attributes: ['name', 'profilPicture', 'country'],
            },
          ],
        },
      ],
    });

    if (!rinjaniResult) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get Product Rinjani Detail Failed',
        data: null,
      });
    }

    const authHeader = req.headers['authorization'];
    let favorited;
    if (!authHeader) {
      favorited = null;
    } else {
      const token = authHeader && authHeader.split(' ')[1];
      const user = verifyAccessToken(token);
      if (!user) {
        favorited = null;
      } else {
        const tokenInfo = getUserIdFromAccessToken(token);
        const id_user = tokenInfo.userId;
        const checkFavoritedUser = await Favorites.findOne({
          where: {
            productId: id_product,
            userId: id_user,
          },
        });
        checkFavoritedUser ? (favorited = true) : (favorited = false);
      }
    }

    const favoriteCount = await Favorites.count({
      where: {
        productId: id_product,
      },
    });

    const {
      productId,
      title,
      status,
      rating,
      location,
      lowestPrice,
      thumbnail,
      createdAt,
      updatedAt,
      category,
      subCategory,
      facilities,
      ModelRinjani: RinjaniModel,
      AddOnsModels,
      Fotos,
      Reviews,
    } = rinjaniResult;

    const newFormat = {
      productId,
      title,
      status,
      rating,
      location,
      lowestPrice,
      thumbnail,
      description: RinjaniModel.description,
      duration: RinjaniModel.duration,
      program: RinjaniModel.program,
      category: category ? category.category : null,
      subCategory: subCategory ? subCategory.subCategory : null,
      favoritedCount: favoriteCount,
      userFavorited: favorited,
      facilities: facilities.map((facility) => facility.facilityName),
      addOns: AddOnsModels.map((addOns) => addOns.addOnsName),
      note: RinjaniModel.note,
      includeEndDateTime: false,
      createdAt,
      updatedAt,
      Fotos,
      Reviews: Review
        ? Reviews.map((review) => ({
            rating: review.rating,
            messageReview: review.messageReview,
            createdAt: review.createdAt,
            name: review.User.name,
            country: review.User.country,
            profilPicture: review.User.profilPicture,
          }))
        : Reviews,
    };

    return res.status(200).json({
      errors: [],
      message: 'Get Product Rinjani Detail Success',
      data: newFormat,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/productController.js:getRinjaniDetail - ' + error.message
      )
    );
  }
};

const setHomeStay = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    description: 'required',
    productId: 'required',
  };
  try {
    const homestay = await dataValid(valid, req.body);
    if (homestay.message.length > 0) {
      return res.status(400).json({
        errors: homestay.message,
        message: 'Set HomeStay Failed',
        data: null,
      });
    }
    const product_id = req.body.productId;
    const newhomestay = await HomeStay.create(
      {
        ...homestay.data,
        productId: product_id,
      },
      {
        transaction: t,
      }
    );

    if (!newhomestay) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Home Stay not found'],
        message: 'Set Home Stay Failed',
        data: null,
      });
    }

    await t.commit();
    return res.status(201).json({
      errors: [],
      message: 'Home Stay created successfully',
      data: newhomestay,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/productController.js:setHomeStay - ' + error.message
      )
    );
  }
};

const getHomeStayDetail = async (req, res, next) => {
  try {
    const id_product = req.params.product_id;

    const checkHomeStay = await HomeStay.findOne({
      where: {
        productId: id_product,
      },
    });

    if (!checkHomeStay) {
      return res.status(404).json({
        errors: ['Home Stay Product not found'],
        message: 'Get Home Stay Detail Failed',
        data: null,
      });
    }

    const homeStayResult = await Product.findOne({
      where: {
        productId: id_product,
      },
      include: [
        {
          model: HomeStay,
          attributes: ['description', 'note'],
        },
        {
          model: Foto,
        },
        {
          model: Category,
        },
        {
          model: SubCategory,
        },
        {
          model: Facility,
          attributes: ['facilityName'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: AddOnsModel,
          attributes: ['addOnsName'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: Review,
          attributes: ['rating', 'messageReview', 'createdAt'],
          include: [
            {
              model: User,
              attributes: ['name', 'profilPicture', 'country'],
            },
          ],
        },
      ],
    });

    if (!homeStayResult) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get Product HomeStay Detail Failed',
        data: null,
      });
    }

    const authHeader = req.headers['authorization'];
    let favorited;
    if (!authHeader) {
      favorited = null;
    } else {
      const token = authHeader && authHeader.split(' ')[1];
      const user = verifyAccessToken(token);
      if (!user) {
        favorited = null;
      } else {
        const tokenInfo = getUserIdFromAccessToken(token);
        const id_user = tokenInfo.userId;
        const checkFavoritedUser = await Favorites.findOne({
          where: {
            productId: id_product,
            userId: id_user,
          },
        });
        checkFavoritedUser ? (favorited = true) : (favorited = false);
      }
    }

    const favoriteCount = await Favorites.findAndCountAll({
      where: {
        productId: id_product,
      },
    });

    const {
      productId,
      title,
      status,
      location,
      rating,
      thumbnail,
      createdAt,
      updatedAt,
      category,
      subCategory,
      HomeStays,
      facilities,
      AddOnsModels,
      Fotos,
      Reviews,
    } = homeStayResult;

    const newFormat = {
      productId,
      title,
      status,
      lowestPrice: homeStayResult.lowestPrice,
      rating,
      location,
      thumbnail,
      category: category ? category.category : null,
      subCategory: subCategory ? subCategory.subCategory : null,
      description: HomeStays.length > 0 ? HomeStays[0].description : null,
      favoritedCount: favoriteCount.count,
      userFavorited: favorited,
      facilities: facilities.map((facility) => facility.facilityName),
      addOns: AddOnsModels.map((addOns) => addOns.addOnsName),
      note: HomeStays.length > 0 ? HomeStays[0].note : null,
      includeEndDateTime: true,
      createdAt,
      updatedAt,
      Fotos,
      Reviews: Review
        ? Reviews.map((review) => ({
            rating: review.rating,
            messageReview: review.messageReview,
            createdAt: review.createdAt,
            name: review.User.name,
            country: review.User.country,
            profilPicture: review.User.profilPicture,
          }))
        : Reviews,
    };

    return res.status(200).json({
      errors: [],
      message: 'Get Home Stay Product Detail Success',
      data: newFormat,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/productController.js:getHomeStayDetail - ' + error.message
      )
    );
  }
};

const setWisata = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    description: 'required',
    productId: 'required',
  };
  try {
    const wisata = await dataValid(valid, req.body);
    if (wisata.message.length > 0) {
      return res.status(400).json({
        errors: wisata.message,
        message: 'Set Wisata Failed',
        data: null,
      });
    }
    const product_id = req.body.productId;
    const cekProductId = await Product.findOne({
      where: {
        productId: product_id,
      },
    });
    if (!cekProductId) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Set Wisata Failed',
        data: null,
      });
    }
    const newWisata = await Wisata.create(
      {
        ...wisata.data,
        productId: product_id,
      },
      {
        transaction: t,
      }
    );

    if (!newWisata) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Wisata not found'],
        message: 'Set Wisata Failed',
        data: null,
      });
    }

    await t.commit();
    return res.status(201).json({
      errors: [],
      message: 'Wisata created successfully',
      data: newWisata,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error('controllers/productController.js:setWisata - ' + error.message)
    );
  }
};

const getWisataDetail = async (req, res, next) => {
  try {
    const id_product = req.params.product_id;

    const checkWisata = await Wisata.findOne({
      where: {
        productId: id_product,
      },
    });

    if (!checkWisata) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get Product Wisata Detail Failed',
        data: null,
      });
    }

    const wisataResult = await Product.findOne({
      where: {
        productId: id_product,
      },
      include: [
        {
          model: Wisata,
          attributes: ['description', 'route', 'note'],
        },
        {
          model: Foto,
        },
        {
          model: Category,
        },
        {
          model: SubCategory,
        },
        {
          model: Facility,
          attributes: ['facilityName'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: AddOnsModel,
          attributes: ['addOnsName'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: Review,
          attributes: ['rating', 'messageReview', 'createdAt'],
          include: [
            {
              model: User,
              attributes: ['name', 'profilPicture', 'country'],
            },
          ],
        },
      ],
    });

    if (!wisataResult) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get Product Wisata Detail Failed',
        data: null,
      });
    }

    const authHeader = req.headers['authorization'];
    let favorited;
    if (!authHeader) {
      favorited = null;
    } else {
      const token = authHeader && authHeader.split(' ')[1];
      const user = verifyAccessToken(token);
      if (!user) {
        favorited = null;
      } else {
        const tokenInfo = getUserIdFromAccessToken(token);
        const id_user = tokenInfo.userId;
        const checkFavoritedUser = await Favorites.findOne({
          where: {
            productId: id_product,
            userId: id_user,
          },
        });
        checkFavoritedUser ? (favorited = true) : (favorited = false);
      }
    }

    const favoriteCount = await Favorites.findAndCountAll({
      where: {
        productId: id_product,
      },
    });

    const {
      productId,
      title,
      status,
      location,
      rating,
      thumbnail,
      createdAt,
      updatedAt,
      category,
      subCategory,
      Wisata: WisataAtributs,
      Fotos,
      Reviews,
      facilities,
      AddOnsModels,
    } = wisataResult;

    const newFormat = {
      productId,
      title,
      status,
      lowestPrice: wisataResult.lowestPrice,
      rating,
      location,
      thumbnail,
      category: category ? category.category : null,
      subCategory: subCategory ? subCategory.subCategory : null,
      description:
        WisataAtributs.length > 0 ? WisataAtributs[0].description : null,
      favoritedCount: favoriteCount.count,
      userFavorited: favorited,
      facilities: facilities.map((facility) => facility.facilityName),
      addOns: AddOnsModels.map((addOns) => addOns.addOnsName),
      note: WisataAtributs.length > 0 ? WisataAtributs[0].note : null,
      route: WisataAtributs.length > 0 ? WisataAtributs[0].route : null,
      includeEndDateTime: false,
      createdAt,
      updatedAt,
      Fotos,
      Reviews: Review
        ? Reviews.map((review) => ({
            rating: review.rating,
            messageReview: review.messageReview,
            createdAt: review.createdAt,
            name: review.User.name,
            country: review.User.country,
            profilPicture: review.User.profilPicture,
          }))
        : Reviews,
    };

    return res.status(200).json({
      errors: [],
      message: 'Get Wisata Product Detail Success',
      data: newFormat,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/productController.js:getWisataDetail - ' + error.message
      )
    );
  }
};

const setEvent = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    description: 'required',
    startDate: 'required',
    endDate: 'required',
    productId: 'required',
  };
  try {
    const eventProduct = await dataValid(valid, req.body);
    if (eventProduct.message.length > 0) {
      return res.status(400).json({
        errors: eventProduct.message,
        message: 'Set Event Failed',
        data: null,
      });
    }
    const product_id = req.body.productId;
    const cekProductId = await Product.findOne({
      where: {
        productId: product_id,
      },
    });
    if (!cekProductId) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Set Event Failed',
        data: null,
      });
    }

    const newEvent = await EventModel.create(
      {
        ...eventProduct.data,
        productId: product_id,
      },
      {
        transaction: t,
      }
    );

    if (!newEvent) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Event not found'],
        message: 'Set Event Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(201).json({
      errors: [],
      message: 'Event created successfully',
      data: newEvent,
    });
  } catch (error) {
    next(
      new Error('controllers/productController.js:setEvent - ' + error.message)
    );
  }
};

const getEventDetail = async (req, res, next) => {
  try {
    const id_product = req.params.product_id;
    const eventResult = await Product.findOne({
      where: {
        productId: id_product,
      },
      include: [
        {
          model: EventModel,
          attributes: ['description', 'startDate', 'endDate', 'note'],
        },
        {
          model: Foto,
        },
        {
          model: Category,
        },
        {
          model: SubCategory,
        },
        {
          model: Facility,
          attributes: ['facilityName'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: AddOnsModel,
          attributes: ['addOnsName'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: Review,
          attributes: ['rating', 'messageReview', 'createdAt'],
          include: [
            {
              model: User,
              attributes: ['name', 'profilPicture', 'country'],
            },
          ],
        },
      ],
    });

    if (!eventResult) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get Product Event Detail Failed',
        data: null,
      });
    }

    const authHeader = req.headers['authorization'];
    let favorited;
    if (!authHeader) {
      favorited = null;
    } else {
      const token = authHeader && authHeader.split(' ')[1];
      const user = verifyAccessToken(token);
      if (!user) {
        favorited = null;
      } else {
        const tokenInfo = getUserIdFromAccessToken(token);
        const id_user = tokenInfo.userId;
        const checkFavoritedUser = await Favorites.findOne({
          where: {
            productId: id_product,
            userId: id_user,
          },
        });
        checkFavoritedUser ? (favorited = true) : (favorited = false);
      }
    }

    const favoriteCount = await Favorites.findAndCountAll({
      where: {
        productId: id_product,
      },
    });

    const {
      productId,
      title,
      status,
      location,
      rating,
      thumbnail,
      createdAt,
      updatedAt,
      category,
      subCategory,
      Events: eventData,
      Fotos,
      Reviews,
      facilities,
      AddOnsModels,
    } = eventResult;

    const newFormat = {
      productId,
      title,
      status,
      lowestPrice: eventResult.lowestPrice,
      rating,
      location,
      thumbnail,
      category: category ? category.category : null,
      subCategory: subCategory ? subCategory.subCategory : null,
      description: eventData.length > 0 ? eventData[0].description : null,
      favoritedCount: favoriteCount.count,
      userFavorited: favorited,
      facilities: facilities.map((facility) => facility.facilityName),
      addOns: AddOnsModels.map((addOns) => addOns.addOnsName),
      note: eventData.length > 0 ? eventData[0].note : null,
      startDate: eventData.length > 0 ? eventData[0].startDate : null,
      endDate: eventData.length > 0 ? eventData[0].endDate : null,
      includeEndDateTime: false,
      createdAt,
      updatedAt,
      Fotos,
      Reviews: Review
        ? Reviews.map((review) => ({
            rating: review.rating,
            messageReview: review.messageReview,
            createdAt: review.createdAt,
            name: review.User.name,
            country: review.User.country,
            profilPicture: review.User.profilPicture,
          }))
        : Reviews,
    };

    return res.status(200).json({
      errors: [],
      message: 'Get Event Product Detail Success',
      data: newFormat,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/productController.js:getEventDetail - ' + error.message
      )
    );
  }
};

const getProductDetail = async (req, res, next) => {
  try {
    const id_product = req.params.product_id;

    const checkCategory = await Product.findOne({
      attributes: ['categoryId'],
      where: {
        productId: id_product,
      },
      include: [
        {
          model: Category,
        },
      ],
    });

    if (!checkCategory) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get Product Detail Failed',
        data: null,
      });
    }

    const getCategory = checkCategory.category.category;

    if (getCategory == 'rinjani') {
      return getRinjaniDetail(req, res, next);
    } else if (getCategory == 'homestay') {
      return getHomeStayDetail(req, res, next);
    } else if (getCategory == 'culture' || getCategory == 'landscape') {
      return getWisataDetail(req, res, next);
    } else if (getCategory == 'event') {
      return getEventDetail(req, res, next);
    }
  } catch (error) {
    next(
      new Error(
        'controllers/productController.js:productDetail - ' + error.message
      )
    );
  }
};

export {
  setProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  setRinjani,
  setHomeStay,
  setWisata,
  setEvent,
  getProductDetail,
};
