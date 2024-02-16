import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import sequelize from '../utils/db.js';
import Product from '../models/productModel.js';
import Foto from '../models/fotoModel.js';
import { bucket } from '../middleware/multer_firebase.js';

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

      const allowedImageFormats = ['image/jpeg', 'image/jpg', 'image/png'];

      for (const file of uploadedFiles) {
        if (!allowedImageFormats.includes(file.mimetype)) {
          return res.status(400).json({
            errors: [
              'Invalid file format. Only JPEG, JPG, and PNG images are allowed.',
            ],
            message: 'Update Avatar Failed',
            data: null,
          });
        }

        const folderName = 'fotoproduct-rinjani';
        const fileName = `${uuidv4()}-${file.originalname}`;
        const filePath = `${folderName}/${fileName}`;

        const metadata = {
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
          },
          contentType: file.mimetype,
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

        let urlphoto;
        blobStream.on('finish', async () => {
          urlphoto = `https://firebasestorage.googleapis.com/v0/b/${
            bucket.name
          }/o/${encodeURIComponent(filePath)}?alt=media`;
        });

        const blobStreamEnd = promisify(blobStream.end).bind(blobStream);

        await blobStreamEnd(file.buffer);

        const filePhotoName = file.originalname;

        uploadedFilesData.push({
          url: urlphoto,
          originalName: filePhotoName,
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
    await t.rollback();
    next(
      new Error(
        'controllers/fotoController.js:setFotoProduct - ' + error.message
      )
    );
  }
};

const setFotoProductJson = async (req, res, next) => {
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

    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        errors: ['No image URLs provided'],
        message: 'Update Avatar Failed',
        data: null,
      });
    }

    const uploadedFilesData = [];
    for (const url of urls) {
      const fileName = uuidv4();
      const newFoto = await Foto.create(
        {
          url: url,
          originalName: fileName,
          productId: product_id,
        },
        {
          transaction: t,
        }
      );

      if (!newFoto) {
        return res.status(404).json({
          errors: ['Foto not created in the database'],
          message: 'Foto failed to upload',
          data: null,
        });
      }

      uploadedFilesData.push(newFoto);
    }

    await t.commit();
    return res.status(201).json({
      errors: [],
      message: 'Fotos uploaded successfully',
      data: uploadedFilesData,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/fotoController.js:setFotoProductJson - ' + error.message
      )
    );
  }
};

const getAllFotoProduct = async (req, res, next) => {
  try {
    const product_id = req.params.product_id;
    const product = await Foto.findAll({
      where: {
        productId: product_id,
      },
    });

    if(!product) {
      return res.status(404).json({
        errors: ['Product not found'],
        message: 'Get All Foto Failed',
        data: null,
      });
    }

    res.status(200).json({
      errors: [],
      message: 'Fotos retrieved successfully',
      data: product,
    });
  } catch (error) {
    next(
      new Error(
        'controllers/fotoController.js:getAllFotoProduct - ' + error.message
      )
    );
  }
}

const updateFotoProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const product_id = req.params.product_id;
    const product = await Foto.findOne({
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
    }

    const uploadedFileName = req.file;

    if (uploadedFileName) {
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

      const folderName = 'fotoproduct-rinjani';
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

      let urlphoto;
      blobStream.on('finish', async () => {
        urlphoto = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(filePath)}?alt=media`;
      });

      const blobStreamEnd = promisify(blobStream.end).bind(blobStream);

      await blobStreamEnd(req.file.buffer);

      const result = await Foto.update(
        {
          url: urlphoto,
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
        });
        return res.status(200).json({
          errors: [],
          message: 'Foto updated successfully',
          data: updatedFoto,
        });
      }
    }
  } catch (error) {
    next(
      new Error(
        'controllers/fotoController.js:updateFotoProduct - ' + error.message
      )
    );
  }
};

const updateFotoProductJson = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const product_id = req.params.product_id;
    const product = await Foto.findOne({
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
    }

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        errors: ['No image URL provided'],
        message: 'No image URL provided',
        data: null,
      });
    }

    const result = await Foto.update(
      {
        url: url,
      },
      {
        where: {
          fotoId: foto_id,
        },
      }
    );

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Failed to update photo URL in the database'],
        message: 'Update Failed',
        data: null,
      });
    }

    await t.commit();
    const updatedFoto = await Foto.findOne({
      where: {
        fotoId: foto_id,
      },
    });
    return res.status(200).json({
      errors: [],
      message: 'Foto updated successfully',
      data: updatedFoto,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/fotoController.js:updateFotoProductJson - ' + error.message
      )
    );
  }
};

const deleteFotoProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const product_id = req.params.product_id;
    const product = await Foto.findOne({
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
    }

    const result = await Foto.destroy({
      where: {
        fotoId: foto_id,
      },
    });

    if (result[0] == 0) {
      return res.status(404).json({
        errors: ['Failed to delete photo in the database'],
        message: 'Delete Failed',
        data: null,
      });
    }

    await t.commit();

    return res.status(200).json({
      errors: [],
      message: 'Foto deleted successfully',
      data: null,
    });
  } catch (error) {
    await t.rollback();
    next(
      new Error(
        'controllers/fotoController.js:deleteFotoProduct - ' + error.message
      )
    );
  }
};

export {
  setFotoProduct,
  setFotoProductJson,
  getAllFotoProduct,
  updateFotoProduct,
  updateFotoProductJson,
  deleteFotoProduct,
};
