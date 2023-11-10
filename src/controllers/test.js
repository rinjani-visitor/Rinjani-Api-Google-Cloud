import Foto from "../models/fotoModel.js"

const test = async (req, res, next) => {
  const id = req.params.id;
  console.log(`id product : ${id}`);
  const data = await Foto.findAll({
    where: {
      productId: id
    }
  });

  return res.status(200).json({
    errors: [],
    message: 'Success',
    data: data,
  });
};

export default test;