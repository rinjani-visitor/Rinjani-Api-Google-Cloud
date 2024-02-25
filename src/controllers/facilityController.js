import Facility from '../models/facilityModel.js';
import Product from '../models/productModel.js';
import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';

const setFacility = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    facilityName: 'required',
  };
  try {
    const facility = await dataValid(valid, req.body);
    if (facility.message.length > 0) {
      return res.status(400).json({
        errors: facility.message,
        message: 'Facility Failed',
        data: null,
      });
    }

    const result = await Facility.create(
      {
        ...facility.data,
      },
      {
        transaction: t,
      }
    );

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Failed to save facility to database'],
        message: 'Update Failed',
        data: null,
      });
    } else {
      await t.commit();
      return res.status(201).json({
        errors: [],
        message: 'Facility created successfully',
        data: result,
      });
    }
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/facilityController.js:setFacility - ' + error.message
      )
    );
  }
};

const getAllFacility = async (req, res, next) => {
  try {
    const result = await Facility.findAll();
    if (!result) {
      return res.status(404).json({
        errors: ['Facility not found'],
        message: 'Get Facility Failed',
        data: null,
      });
    }
    return res.status(200).json({
      errors: [],
      message: 'Get Facility Success',
      data: result,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/facilityController.js:getAllFacility - ' + error.message
      )
    );
  }
};

const addFacility = async (req, res, next) => {
  let t;
  try {
    t = await sequelize.transaction();

    let { idfacilities } = req.body;
    const idproduct = req.params.productId;

    // Ensure idfacilities is an array
    if (!Array.isArray(idfacilities)) {
      idfacilities = [idfacilities];
    }

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

    // Check each facility in the array
    for (const facilityId of idfacilities) {
      const checkFacility = await Facility.findOne({
        where: {
          facilityId: facilityId,
        },
      });

      if (!checkFacility) {
        return res.status(404).json({
          errors: ['Facility not found'],
          message: 'Get Facility Failed',
          data: null,
        });
      }

      const checkProductFacility =
        await sequelize.models.product_facility.findOne({
          where: {
            productId: idproduct,
            facilityId: facilityId,
          },
        });

      if (checkProductFacility) {
        return res.status(400).json({
          errors: ['Facility already exists'],
          message: 'Update Failed',
          data: null,
        });
      }

      // Create product facility
      await sequelize.models.product_facility.create(
        {
          productId: idproduct,
          facilityId: facilityId,
        },
        {
          transaction: t,
        }
      );
    }

    // Commit transaction
    await t.commit();

    return res.status(201).json({
      errors: [],
      message: 'Facility created successfully',
      data: null,
    });
  } catch (error) {
    // Rollback transaction if an error occurs
    if (t) {
      await t.rollback();
    }
    next(
      new Error(
        'controllers/facilityController.js:addFacility - ' + error.message
      )
    );
  }
};

const updateFacility = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { idfacility, updateidfacility } = req.body;
    const idproduct = req.params.productId;

    const result = await sequelize.models.product_facility.update(
      {
        productId: idproduct,
        facilityId: updateidfacility,
      },
      {
        where: {
          productId: idproduct,
          facilityId: idfacility,
        },
        transaction: t,
      }
    );

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to save facility to database'],
        message: 'Update Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(201).json({
      errors: [],
      message: 'Update facility successfully',
      data: result,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/facilityController.js:updateFacility - ' + error.message
      )
    );
  }
};

const deleteFacility = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { idfacilities } = req.body;
    const idproduct = req.params.productId;

    // Ensure idfacilities is an array
    if (!Array.isArray(idfacilities)) {
      idfacilities = [idfacilities];
    }

    const results = [];

    for (const idfacility of idfacilities) {
      const result = await sequelize.models.product_facility.destroy({
        where: {
          productId: idproduct,
          facilityId: idfacility,
        },
        transaction: t,
      });
      results.push(result);
    }

    // Check if any facility was deleted
    if (results.every((result) => result === 0)) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to delete facility from database'],
        message: 'Delete Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(201).json({
      errors: [],
      message: 'Delete facility successfully',
      data: null,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/facilityController.js:deleteFacility - ' + error.message
      )
    );
  }
};

const deleteFacilityList = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { idfacility } = req.body;

    const result = await sequelize.models.facility.destroy({
      where: {
        facilityId: idfacility,
      },
      transaction: t,
    });

    if(result === 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to delete facility from database'],
        message: 'Delete Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(201).json({
      errors: [],
      message: 'Delete facility successfully',
      data: null,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/facilityController.js:deleteFacilityList - ' +
          error.message
      )
    );
  }
};

export {
  setFacility,
  getAllFacility,
  addFacility,
  updateFacility,
  deleteFacility,
  deleteFacilityList,
};
