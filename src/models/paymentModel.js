import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import Booking from './bookingModel.js';
import 'dotenv/config';

const Payment = sequelize.define(
  'Payment',
  {
    paymentId: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tax: {
      type: Sequelize.INTEGER,
      defaultValue: process.env.TAX,
      allowNull: false,
    },
    subTotal: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    total: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    method: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    paymentStatus: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Pending',
    },
    bookingId: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'payment',
    underscored: true,
    timestamps: true,
  }
);

Booking.hasOne(Payment, {
  foreignKey: 'bookingId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Payment.belongsTo(Booking, {
  foreignKey: 'bookingId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

sequelize.sync();

export default Payment;
