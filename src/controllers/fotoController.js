import sequelize from '../utils/db.js';
import Product from '../models/productModel.js';
import Foto from '../models/fotoModel.js';

const setFotoProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const product_id = req.params.product_id;
    const product = await Product.findOne({
      where: {
        productId: product_id,
      },
    });

    if (!product) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Foto failed to upload',
        data: null,
      });
    }

    const uploadedFiles = req.files;

    if (uploadedFiles && uploadedFiles.length > 0) {
      const uploadedFilesData = [];

      for (const file of uploadedFiles) {
        const suffixName = file.filename;
        const originalName = file.originalname;
        const finalName =
          process.env.BASE_URL + '/images/fotoproduct/' + suffixName;

        uploadedFilesData.push({
          url: finalName,
          originalName: originalName,
          productId: product_id,
        });
      }

      if (uploadedFilesData.length > 0) {
        const newFotos = await Foto.bulkCreate(uploadedFilesData, {
          transaction: t,
        });

        if (!newFotos) {
          return res.status(404).json({
            errors: ['Fotos not created in the database'],
            message: 'Fotos failed to upload',
            data: null,
          });
        }

        await t.commit();
        return res.status(201).json({
          errors: [],
          message: 'Fotos uploaded successfully',
          data: newFotos,
        });
      } else {
        return res.status(400).json({
          errors: ['No files were uploaded'],
          message: 'No files were uploaded',
          data: null,
        });
      }
    } else {
      return res.status(400).json({
        errors: ['No files were uploaded'],
        message: 'No files were uploaded',
        data: null,
      });
    }
  } catch (error) {
    next(
      new Error(
        'controllers/fotoController.js:setFotoProduct - ' + error.message
      )
    );
  }
};

const updateFotoProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const product_id = req.params.product_id;
    const product = await Foto.findAll({
      where: {
        productId: product_id,
      },
    });

    if (!product) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Update Foto Failed',
        data: null,
      });
    }

    const foto_id = req.params.foto_id;

    const foto = await Foto.findOne({
      where: {
        fotoId: foto_id,
      },
    });

    if (!foto) {
      return res.status(404).json({
        errors: ['Foto not found'],
        message: 'Update Foto Failed',
        data: null,
      });
    };

    const uploadedFileName = req.file.filename;
    if (uploadedFileName) {
      const finalName = process.env.BASE_URL + '/images/fotoproduct/' + uploadedFileName;
      const result = await Foto.update(
        {
          url: finalName,
          originalName: req.file.originalname,
        },
        {
          where: {
            fotoId: foto_id,
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
        await t.commit();
        const updatedFoto = await Foto.findOne({
          where: {
            fotoId: foto_id,
          },
        })
        return res.status(200).json({
          errors: [],
          message: 'Foto updated successfully',
          data: updatedFoto,
        });
      }
    }
  } catch (error) {
    next(
      new Error('controllers/fotoController.js:updateFotoProduct - ' + error.message)
    );
  }
};

export { setFotoProduct, updateFotoProduct };
