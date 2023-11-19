import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Product from './productModel.js';
import User from './userModel.js';

const Booking = sequelize.define(
  'Booking',
  {
    bookingId: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    startDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    endDateTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    offeringPrice: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    addOns: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    totalPersons: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    bookingStatus: {
      type: Sequelize.STRING,
      defaultValue: 'Offering',
      allowNull: false,
    },
    adminMessage: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'booking',
    underscored: true,
    timestamps: true,
  }
);

Product.hasMany(Booking, {
  foreignKey: 'productId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

Booking.belongsTo(Product, {
  foreignKey: 'productId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

User.hasMany(Booking, {
  foreignKey: 'userId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});

Booking.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
})

sequelize.sync();

export default Booking;
