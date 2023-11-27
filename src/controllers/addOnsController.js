import AddOnsModel from '../models/addOnsModel.js';
import Product from '../models/productModel.js';
import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';

const setAddOns = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    addOnsName: 'required',
  };
  try {
    const addOnsData = await dataValid(valid, req.body);
    if (addOnsData.message.length > 0) {
      return res.status(400).json({
        errors: addOnsData.message,
        message: 'AddOns Failed',
        data: null,
      });
    }

    const result = await AddOnsModel.create(
      {
        ...addOnsData.data,
      },
      {
        transaction: t,
      }
    );

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Failed to save addOns to database'],
        message: 'Update Failed',
        data: null,
      });
    } else {
      await t.commit();
      return res.status(201).json({
        errors: [],
        message: 'addOns created successfully',
        data: result,
      });
    }
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/facilityController.js:setAddOns - ' + error.message
      )
    );
  }
};

const getAllAddOns = async (req, res, next) => {
  try {
    const result = await AddOnsModel.findAll();
    if (!result) {
      return res.status(404).json({
        errors: ['AddOns not found'],
        message: 'Get AddOns Failed',
        data: null,
      });
    }
    return res.status(200).json({
      errors: [],
      message: 'Get AddOns Success',
      data: result,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/facilityController.js:getAllAddOns - ' + error.message
      )
    );
  }
};

const addAddOns = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { idproduct, idaddons } = req.body;

    const checkProduct = await Product.findOne({
      where: {
        productId: idproduct,
      },
    });

    if (!checkProduct) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get Product Failed',
        data: null,
      });
    }

    const checkAddOns = await AddOnsModel.findOne({
      where: {
        addOnsId: idaddons,
      },
    });

    if (!checkAddOns) {
      return res.status(404).json({
        errors: ['AddOns not found'],
        message: 'Get AddOns Failed',
        data: null,
      });
    }

    const checkProductAddOns = await sequelize.models.product_addons.findOne({
      where: {
        productId: idproduct,
        addOnsId: idaddons,
      },
    });

    if (checkProductAddOns) {
      return res.status(400).json({
        errors: ['AddOns already exist'],
        message: 'AddOns Failed',
        data: null,
      });
    }

    const result = await sequelize.models.product_addons.create(
      {
        productId: idproduct,
        addOnsId: idaddons,
      },
      {
        transaction: t,
      }
    );

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to save AddOns to database'],
        message: 'Update Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(201).json({
      errors: [],
      message: 'AddOns created successfully',
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/facilityController.js:addAddOns - ' + error.message
      )
    );
  }
};

const updateAddOns = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { idproduct, idaddons, updateidaddons } = req.body;

    const checkProduct = await sequelize.models.product_addons.findOne({
      where: {
        productId: idproduct,
        addOnsId: idaddons,
      },
    });

    if (!checkProduct) {
      return res.status(404).json({
        errors: ['AddOns not found'],
        message: 'Get AddOns Failed',
        data: null,
      });
    }

    const result = await sequelize.models.product_addons.destroy(
      {
        where: {
          productId: idproduct,
          addOnsId: idaddons,
        },
        transaction: t,
      }
    );

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to save addOns to database'],
        message: 'Update Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(201).json({
      errors: [],
      message: 'Update addOns successfully',
      data: result,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/facilityController.js:updateaddOns - ' + error.message
      )
    );
  }
};

const deleteAddOns = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { idproduct, idaddons } = req.body;

    const result = await sequelize.models.product_addons.destroy({
      where: {
        productId: idproduct,
        addOnsId: idaddons,
      },
      transaction: t,
    });

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to delete addOns from database'],
        message: 'Delete Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(201).json({
      errors: [],
      message: 'Delete addOns successfully',
      data: result,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/facilityController.js:deleteAddOns - ' + error.message
      )
    );
  }
};

export { setAddOns, getAllAddOns, addAddOns, updateAddOns, deleteAddOns };
