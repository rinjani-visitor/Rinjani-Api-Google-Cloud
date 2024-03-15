import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
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
import { bucket } from '../middleware/multer_firebase.js';
import { status } from './bookingController.js';

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

    const thumbnail = req.file;

    if (!thumbnail) {
      return res.status(400).json({
        errors: ['Thumbnail is required'],
        message: 'Product Failed',
        data: null,
      });
    } else {
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

      let url;
      blobStream.on('finish', async () => {
        url = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(filePath)}?alt=media`;
      });

      const blobStreamEnd = promisify(blobStream.end).bind(blobStream);

      await blobStreamEnd(req.file.buffer);

      const result = await Product.create(
        {
          ...product.data,
          subCategoryId,
          thumbnail: url,
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

const setProductJson = async (req, res, next) => {
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

    const productDataFormat = {
      ...product.data,
    };

    if (isExists(req.body.thumbnail)) {
      productDataFormat.thumbnail = req.body.thumbnail;
    }

    const result = await Product.create(
      productDataFormat,
      {
        subCategoryId,
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
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/productController.js:setProductJson - ' + error.message
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

    if (isExists(req.body.thumbnail)) {
      product.data.thumbnail = req.body.thumbnail;
    }

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
        {
          model: SubCategory,
          attributes: ['subCategory'], // Exclude category attributes from result
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

    const getModelByCategory = async (product) => {
      switch (product.category.category) {
        case 'rinjani':
          return await ModelRinjani.findOne({
            where: { productId: product.productId },
          });
        case 'event':
          return await EventModel.findOne({
            where: { productId: product.productId },
          });
        case 'homestay':
          return await HomeStay.findOne({
            where: { productId: product.productId },
          });
        case 'landscape':
        case 'culture':
          return await Wisata.findOne({
            where: { productId: product.productId },
          });
        default:
          return null;
      }
    };

    for (const product of products) {
      const isHaveDetail = await getModelByCategory(product);

      // Check if isHaveDetail is true and the category is 'event'
      if (isHaveDetail && product.category.category === 'event') {
        const eventModel = await EventModel.findOne({
          where: { productId: product.productId },
        });
        product.dataValues.eventModel = eventModel;
      }

      product.dataValues.isHaveDetail = !!isHaveDetail;
    }

    const formattedProducts = products.map((product) => ({
      productId: product.productId,
      title: product.title,
      status: product.status,
      rating: product.rating || 0,
      location: product.location,
      thumbnail: product.thumbnail,
      lowestPrice: product.lowestPrice,
      category: product.category.category,
      categoryId: product.categoryId,
      subCategory: product.subCategory.subCategory,
      subCategoryId: product.subCategoryId,
      isHaveDetail: product.dataValues.isHaveDetail,
      startDate: product.dataValues.eventModel?.startDate,
      endDate: product.dataValues.eventModel?.endDate,
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
    const productId = req.params.id; // Menggunakan camelCase untuk penamaan variabel
    const product = await Product.findByPk(productId); // Menggunakan nama variabel yang lebih deskriptif

    if (!product) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Delete Failed',
        data: null,
      });
    }

    const booking = await Booking.findOne({
      where: {
        productId: productId,
        bookingStatus: {
          [Op.or]: [status[0], status[1], status[3], status[4]],
        },
      },
    });

    if (booking) {
      return res.status(400).json({
        errors: ['Product has booking'],
        message: 'Delete Failed',
        data: null,
      });
    }

    const result = await Product.destroy({
      where: {
        productId: productId,
      },
      transaction: t,
    });

    if (result === 0) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Delete Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(200).json({
      // Mengubah status response menjadi 200
      errors: [],
      message: 'Product deleted successfully',
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(new Error(`Failed to delete product: ${error.message}`)); // Pesan kesalahan yang lebih spesifik
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

const updateRinjani = async (req, res, next) => {
  try {
    const product_id = req.params.productId;
    const valid = {};
    if (isExists(req.body.description)) {
      valid.description = 'required';
    }
    if (isExists(req.body.duration)) {
      valid.duration = 'required';
    }
    if (isExists(req.body.program)) {
      valid.program = 'required';
    }
    if (isExists(req.body.note)) {
      valid.note = 'required';
    }

    const product = await dataValid(valid, req.body);

    if (product.message.length > 0) {
      return res.status(400).json({
        errors: product.message,
        message: 'Update Failed',
        data: null,
      });
    }
    const result = await ModelRinjani.update(
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
        errors: ['Rinjani not found'],
        message: 'Update Failed',
        data: null,
      });
    } else {
      return res.status(200).json({
        errors: [],
        message: 'Rinjani updated successfully',
        data: product.data,
      });
    }
  } catch (error) {
    next(
      new Error(
        'controllers/productController.js:updateRinjani - ' + error.message
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
          attributes: ['facilityName', 'facilityId'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: AddOnsModel,
          attributes: ['addOnsName', 'addOnsId'],
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
      facilitiesId: facilities.map((facility) => facility.facilityId),
      addOns: AddOnsModels.map((addOns) => addOns.addOnsName),
      addOnsId: AddOnsModels.map((addOns) => addOns.addOnsId),
      note: RinjaniModel.note,
      includeEndDateTime: false,
      createdAt,
      updatedAt,
      fotos: Fotos,
      reviews: Review
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

const updateHomeStay = async (req, res, next) => {
  try {
    const product_id = req.params.productId;
    const valid = {};
    if (isExists(req.body.description)) {
      valid.description = 'required';
    }
    if (isExists(req.body.note)) {
      valid.note = 'required';
    }

    const product = await dataValid(valid, req.body);

    if (product.message.length > 0) {
      return res.status(400).json({
        errors: product.message,
        message: 'Update Failed',
        data: null,
      });
    }
    const result = await HomeStay.update(
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
        errors: ['HomeStay not found'],
        message: 'Update Failed',
        data: null,
      });
    } else {
      return res.status(200).json({
        errors: [],
        message: 'HomeStay updated successfully',
        data: product.data,
      });
    }
  } catch (error) {
    next(
      new Error(
        'controllers/productController.js:updateHomeStay - ' + error.message
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
          attributes: ['facilityName', 'facilityId'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: AddOnsModel,
          attributes: ['addOnsName', 'addOnsId'],
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
      facilitiesId: facilities.map((facility) => facility.facilityId),
      addOns: AddOnsModels.map((addOns) => addOns.addOnsName),
      addOnsId: AddOnsModels.map((addOns) => addOns.addOnsId),
      note: HomeStays.length > 0 ? HomeStays[0].note : null,
      includeEndDateTime: true,
      createdAt,
      updatedAt,
      fotos: Fotos,
      reviews: Review
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

const updateWisata = async (req, res, next) => {
  try {
    const product_id = req.params.productId;
    const valid = {};
    if (isExists(req.body.description)) {
      valid.description = 'required';
    }
    if (isExists(req.body.route)) {
      valid.route = 'required';
    }
    if (isExists(req.body.note)) {
      valid.note = 'required';
    }

    const product = await dataValid(valid, req.body);

    if (product.message.length > 0) {
      return res.status(400).json({
        errors: product.message,
        message: 'Update Failed',
        data: null,
      });
    }
    const result = await Wisata.update(
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
        errors: ['Wisata not found'],
        message: 'Update Failed',
        data: null,
      });
    } else {
      return res.status(200).json({
        errors: [],
        message: 'Wisata updated successfully',
        data: product.data,
      });
    }
  } catch (error) {
    next(
      new Error(
        'controllers/productController.js:updateWisata - ' + error.message
      )
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
          attributes: ['facilityName', 'facilityId'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: AddOnsModel,
          attributes: ['addOnsName', 'addOnsId'],
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
      facilitiesId: facilities.map((facility) => facility.facilityId),
      addOns: AddOnsModels.map((addOns) => addOns.addOnsName),
      addOnsId: AddOnsModels.map((addOns) => addOns.addOnsId),
      note: WisataAtributs.length > 0 ? WisataAtributs[0].note : null,
      route: WisataAtributs.length > 0 ? WisataAtributs[0].route : null,
      includeEndDateTime: false,
      createdAt,
      updatedAt,
      fotos: Fotos,
      reviews: Review
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

const updateEvent = async (req, res, next) => {
  try {
    const product_id = req.params.productId;
    const valid = {};
    if (isExists(req.body.description)) {
      valid.description = 'required';
    }
    if (isExists(req.body.startDate)) {
      valid.startDate = 'required';
    }
    if (isExists(req.body.endDate)) {
      valid.endDate = 'required';
    }
    if (isExists(req.body.note)) {
      valid.note = 'required';
    }

    const product = await dataValid(valid, req.body);

    if (product.message.length > 0) {
      return res.status(400).json({
        errors: product.message,
        message: 'Update Failed',
        data: null,
      });
    }
    const result = await EventModel.update(
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
        errors: ['Event not found'],
        message: 'Update Failed',
        data: null,
      });
    } else {
      return res.status(200).json({
        errors: [],
        message: 'Event updated successfully',
        data: product.data,
      });
    }
  } catch (error) {
    next(
      new Error(
        'controllers/productController.js:updateEvent - ' + error.message
      )
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
          attributes: ['facilityName', 'facilityId'],
          through: { attributes: [] }, // Exclude join table attributes
        },
        {
          model: AddOnsModel,
          attributes: ['addOnsName', 'addOnsId'],
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
      facilitiesId: facilities.map((facility) => facility.facilityId),
      addOns: AddOnsModels.map((addOns) => addOns.addOnsName),
      addOnsId: AddOnsModels.map((addOns) => addOns.addOnsId),
      note: eventData.length > 0 ? eventData[0].note : null,
      startDate: eventData.length > 0 ? eventData[0].startDate : null,
      endDate: eventData.length > 0 ? eventData[0].endDate : null,
      includeEndDateTime: false,
      createdAt,
      updatedAt,
      fotos: Fotos,
      reviews: Review
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
  setProductJson,
  updateProduct,
  deleteProduct,
  getAllProducts,
  setRinjani,
  updateRinjani,
  setHomeStay,
  updateHomeStay,
  setWisata,
  updateWisata,
  setEvent,
  updateEvent,
  getProductDetail,
};
