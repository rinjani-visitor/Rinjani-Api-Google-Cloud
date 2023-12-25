import sequelize from '../utils/db.js';
import { dataValid } from '../validation/dataValidation.js';
import Category from '../models/categoryModel.js';
import SubCategory from '../models/subCategoryModel.js';

const setCategory = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    category: 'required',
  };
  try {
    const category = await dataValid(valid, req.body);
    if (category.message.length > 0) {
      return res.status(400).json({
        errors: category.message,
        message: 'Category Failed',
        data: null,
      });
    }

    const result = await Category.create(
      {
        ...category.data,
      },
      {
        transaction: t,
      }
    );

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Failed to save category to database'],
        message: 'Update Failed',
        data: null,
      });
    } else {
      await t.commit();
      return res.status(201).json({
        errors: [],
        message: 'Category created successfully',
        data: result,
      });
    }
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/categoryController.js:setCategory - ' + error.message
      )
    );
  }
};

const updateCategory = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    category: 'required',
  };
  try {
    const id = req.body.categoryId;

    const category = await dataValid(valid, req.body);

    const checkCategoryId = await Category.findOne({
      where: {
        categoryId: id,
      },
    });

    if (!checkCategoryId) {
      return res.status(404).json({
        errors: ['Category not found'],
        message: 'Update Failed',
        data: null,
      });
    }

    const result = await Category.update(
      {
        category: category.data.category,
      },
      {
        where: {
          categoryId: id,
        },
        transaction: t,
      }
    );

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Category not found'],
        message: 'Update Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(200).json({
      errors: [],
      message: 'Category updated successfully',
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/categoryController.js:updateCategory - ' + error.message
      )
    );
  }
};

const deleteCategory = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const id = req.body.categoryId;
    const checkCategoryId = await Category.findOne({
      where: {
        categoryId: id,
      },
    });

    if (!checkCategoryId) {
      return res.status(404).json({
        errors: ['Category not found'],
        message: 'Update Failed',
        data: null,
      });
    }

    const result = await Category.destroy({
      where: {
        categoryId: id,
      },
    });

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Category not found'],
        message: 'Update Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(200).json({
      errors: [],
      message: 'Category deleted successfully',
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/categoryController.js:deleteCategory - ' + error.message
      )
    );
  }
};

const setSubCategory = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    subCategory: 'required',
  };
  try {
    const id = req.body.categoryId;
    const checkCategoryId = await Category.findOne({
      where: {
        categoryId: id,
      },
    });
    if (!checkCategoryId) {
      return res.status(404).json({
        errors: ['Category not found'],
        message: 'Update Failed',
        data: null,
      });
    }
    const subCategory = await dataValid(valid, req.body);
    if (subCategory.message.length > 0) {
      return res.status(400).json({
        errors: subCategory.message,
        message: 'Sub Category Failed',
        data: null,
      });
    }

    const result = await SubCategory.create(
      {
        ...subCategory.data,
        categoryId: id,
      },
      {
        transaction: t,
      }
    );

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Failed to save sub category to database'],
        message: 'Update Failed',
        data: null,
      });
    } else {
      await t.commit();
      return res.status(201).json({
        errors: [],
        message: 'Sub category created successfully',
        data: result,
      });
    }
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/categoryController.js:setSubCategory - ' + error.message
      )
    );
  }
};

const getAllCategoriesandSubCategories = async (req, res, next) => {
  try {
    const result = await Category.findAll({
      include: [
        {
          model: SubCategory,
          as: 'SubCategories',
          attributes: ['subCategory', 'subCategoryId'],
        },
      ],
    });

    const formatted = result.map((category) => ({
      categoryId: category.categoryId,
      category: category.category,
      subCategories: category.SubCategories
        ? category.SubCategories.map((item) => ({
            subCategoryId: item.subCategoryId,
            subCategory: item.subCategory,
          }))
        : [],
    }));

    return res.status(200).json({
      errors: [],
      message: 'Get all categories and sub categories successfully',
      data: formatted,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/categoryController.js:setSubCategory - ' + error.message
      )
    );
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const result = await Category.findAll();
    return res.status(200).json({
      errors: [],
      message: 'Get all categories successfully',
      data: result,
    });
  } catch (error) {
    next(
      new Error('controllers/categoryController.js:getAllCategories - ' + error)
    );
  }
}

const getAllSubCategories = async (req, res, next) => {
  try {
    const result = await SubCategory.findAll();
    return res.status(200).json({
      errors: [],
      message: 'Get all sub categories successfully',
      data: result,
    });
  } catch (error) {
    next(
      new Error('controllers/categoryController.js:getAllSubCategories - ' + error)
    );
  }
}

const updateSubCategory = async (req, res, next) => {
  const t = await sequelize.transaction();
  const valid = {
    subCategory: 'required',
  };
  try {
    const id = req.body.subCategoryId;
    const checkSubCategoryId = await SubCategory.findOne({
      where: {
        subCategoryId: id,
      },
    });

    if (!checkSubCategoryId) {
      return res.status(404).json({
        errors: ['Sub Category not found'],
        message: 'Update Failed',
        data: null,
      });
    }

    const subCategory = await dataValid(valid, req.body);

    if (subCategory.message.length > 0) {
      return res.status(400).json({
        errors: subCategory.message,
        message: 'Sub Category Failed',
        data: null,
      });
    }

    const result = await SubCategory.update(
      {
        subCategory: subCategory.data.subCategory,
      },
      {
        where: {
          subCategoryId: id,
        },
        transaction: t,
      }
    );

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Failed to update sub category to database'],
        message: 'Update Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(200).json({
      errors: [],
      message: 'Sub category updated successfully',
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/categoryController.js:updateSubCategory - ' + error.message
      )
    );
  }
};

const deleteSubCategory = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const id = req.body.subCategoryId;
    const checkSubCategoryId = await SubCategory.findOne({
      where: {
        subCategoryId: id,
      },
    });

    if (!checkSubCategoryId) {
      return res.status(404).json({
        errors: ['Sub Category not found'],
        message: 'Update Failed',
        data: null,
      });
    }

    const result = await SubCategory.destroy({
      where: {
        subCategoryId: id,
      },
    });

    if (result[0] == 0) {
      await t.rollback();
      return res.status(404).json({
        errors: ['Sub Category not found'],
        message: 'Update Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(200).json({
      errors: [],
      message: 'Sub Category deleted successfully',
      data: result,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/categoryController.js:deleteSubCategory - ' + error.message
      )
    );
  }
};

export {
  setCategory,
  updateCategory,
  deleteCategory,
  setSubCategory,
  getAllCategoriesandSubCategories,
  getAllCategories,
  getAllSubCategories,
  updateSubCategory,
  deleteSubCategory,
};
