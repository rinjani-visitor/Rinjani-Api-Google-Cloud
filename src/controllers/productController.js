import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import Product from '../models/productModel.js';
import { isExists } from '../validation/sanitization.js';
import Rinjani from '../models/rinjaniModel.js';
import Foto from '../models/fotoModel.js';
import HomeStay from '../models/HomeStayModel.js';
import Favorites from '../models/favoritesModel.js';
import Category from '../models/categoryModel.js';
import SubCategory from '../models/subCategoryModel.js';
import Facility from '../models/facilityModel.js';
import Booking from '../models/bookingModel.js';
import Wisata from '../models/wisataModel.js';

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
      const finalName = process.env.BASE_URL + '/images/thumbnail/' + thumbnail;
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
    const categoryName = req.query.category;

    let products;

    if (categoryName) {
      products = await Product.findAll({
        include: [
          {
            model: Category,
            where: {
              category: categoryName,
            },
          },
        ],
      });
    } else {
      products = await Product.findAll();
    }

    if (!products) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get All Product Failed',
        data: null,
      });
    }

    const formattedProducts = products.map((product) => ({
      productId: product.productId,
      title: product.title,
      status: product.status,
      rating: product.rating ? product.rating : 'no ratings yet',
      location: product.location,
      thumbnail: product.thumbnail,
      lowestPrice: product.lowestPrice,
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
    };

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
    })
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
    porter: 'required',
    guide: 'required',
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
    const newRinjani = await Rinjani.create(
      {
        ...rinjani.data,
        productId: req.body.productId,
      },
      {
        transaction: t,
      }
    );
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
    const product_id = req.params.product_id;
    const rinjaniResult = await Product.findOne({
      where: {
        productId: product_id,
      },
      include: [
        {
          model: Rinjani,
          attributes: [
            'description',
            'duration',
            'program',
            'porter',
            'guide',
            'note',
          ],
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
      ],
    });

    if (!rinjaniResult) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get Product Rinjani Detail Failed',
        data: null,
      });
    }

    const favoriteCount = await Favorites.findAndCountAll({
      where: {
        productId: product_id,
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
      Fotos,
      category,
      subCategory,
      facilities,
    } = rinjaniResult;

    const newFormat = {
      productId,
      title,
      status,
      rating,
      location,
      lowestPrice,
      thumbnail,
      description: rinjaniResult.Rinjani?.description || null,
      duration: rinjaniResult.Rinjani?.duration || null,
      program: rinjaniResult.Rinjani?.program || null,
      porter: rinjaniResult.Rinjani?.porter || null,
      guide: rinjaniResult.Rinjani?.guide || null,
      category: category ? category.category : null,
      subCategory: subCategory ? subCategory.subCategory : null,
      favoritedCount: favoriteCount ? favoriteCount.count : 0,
      facilities: facilities.map((facility) => facility.facilityName),
      note: rinjaniResult.Rinjani?.note || null,
      Fotos,
      createdAt,
      updatedAt,
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
    const newhomestay = await HomeStay.create(
      {
        ...homestay.data,
        productId: req.body.productId,
      },
      {
        transaction: t,
      }
    );
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
    const id = req.params.product_id;
    const homeStayResult = await Product.findOne({
      where: {
        productId: id,
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
      ],
    });

    if (!homeStayResult) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get Product HomeStay Detail Failed',
        data: null,
      });
    }

    const favoriteCount = await Favorites.findAndCountAll({
      where: {
        productId: id,
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
      Fotos,
      facilities,
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
      favoritedCount: favoriteCount ? favoriteCount.count : 0,
      facilities: facilities.map((facility) => facility.facilityName),
      note: HomeStays.length > 0 ? HomeStays[0].note : null,
      fotos: Fotos,
      createdAt,
      updatedAt,
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
        productId: req.body.productId,
      },
      {
        transaction: t,
      }
    );
    await t.commit();
    return res.status(201).json({
      errors: [],
      message: 'Wisata created successfully',
      data: newWisata,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/productController.js:setWisata - ' + error.message
      )
    );
  }
};

const getWisataDetail = async (req, res, next) => {
  try {
    const id = req.params.product_id;
    const wisataResult = await Product.findOne({
      where: {
        productId: id,
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
      ],
    });

    if (!wisataResult) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get Product Wisata Detail Failed',
        data: null,
      });
    }

    const favoriteCount = await Favorites.findAndCountAll({
      where: {
        productId: id,
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
      facilities,
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
      description: WisataAtributs.length > 0 ? WisataAtributs[0].description : null,
      favoritedCount: favoriteCount ? favoriteCount.count : 0,
      facilities: facilities.map((facility) => facility.facilityName),
      note: WisataAtributs.length > 0 ? WisataAtributs[0].note : null,
      route: WisataAtributs.length > 0 ? WisataAtributs[0].route : null,
      fotos: Fotos,
      createdAt,
      updatedAt,
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

export {
  setProduct,
  updateProduct,
  setRinjani,
  getAllProducts,
  deleteProduct,
  getRinjaniDetail,
  setHomeStay,
  getHomeStayDetail,
  setWisata,
  getWisataDetail
};
