import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import Product from '../models/productModel.js';
import { isExists } from '../validation/sanitization.js';

const setProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    title: 'required',
    category: 'required',
    location: 'required',
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
    const newProduct = await Product.create(product.data, {
      transaction: t,
    });
    await t.commit();
    return res.status(201).json({
      errors: [],
      message: 'Product created successfully',
      data: newProduct,
    });
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
      new Error('controllers/productController.js:updateProduct - ' + error.message)
    );
  }
};

export { setProduct, updateProduct };
