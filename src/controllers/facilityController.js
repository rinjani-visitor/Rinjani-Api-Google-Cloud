import Facility from '../models/facilityModel.js';
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
    if(!result){
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
    })
  } catch (error) {
    next(
      new Error(
        'controllers/facilityController.js:setFacility - ' + error.message
      )
    );
  }
};

export {setFacility, getAllFacility};
