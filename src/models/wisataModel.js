import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Product from './productModel.js';

const Wisata = sequelize.define(
  'Wisata',
  {
    wisataId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    route: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'wisata',
    underscored: true,
    timestamps: false,
  }
);

Product.hasMany(Wisata, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Wisata.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

sequelize.sync();

export default Wisata;
