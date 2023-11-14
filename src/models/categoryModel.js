import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';

const Category = sequelize.define(
  'category',
  {
    categoryId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    category: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'category',
    underscored: true,
    timestamps: false,
  }
);

sequelize.sync();

export default Category;
