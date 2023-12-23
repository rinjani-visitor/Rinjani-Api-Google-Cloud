import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Product from './productModel.js';

const Foto = sequelize.define(
  'Foto',
  {
    fotoId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    url: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    originalName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'foto',
    underscored: true,
    timestamps: false,
  }
);

Product.hasMany(Foto, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

Foto.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

sequelize.sync();

export default Foto;