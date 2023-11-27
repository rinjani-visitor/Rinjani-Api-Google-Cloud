import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Product from './productModel.js';

const ModelRinjani = sequelize.define(
  'ModelRinjani',
  {
    rinjaniId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    duration: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    program: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'modelRinjani',
    underscored: true,
    timestamps: false,
  }
);

Product.hasOne(ModelRinjani, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'RESTRICT',
});

ModelRinjani.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'RESTRICT',
});

sequelize.sync();

export default ModelRinjani;
