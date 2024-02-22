import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Category from './categoryModel.js';

const SubCategory = sequelize.define(
  'subCategory',
  {
    subCategoryId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    subCategory: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'subCategory',
    underscored: true,
    timestamps: false,
  }
);

Category.hasMany(SubCategory, {
  as: 'SubCategories',
  foreignKey: 'categoryId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

SubCategory.belongsTo(Category, {
  foreignKey: 'categoryId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

sequelize.sync();

export default SubCategory;
