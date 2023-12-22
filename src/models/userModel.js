import sequelize from '../utils/db.js';
import { Sequelize } from 'sequelize';
import { encript } from '../utils/bcrypt.js';
import moment from 'moment-timezone';
import 'dotenv/config';

const User = sequelize.define(
  'User',
  {
    userId: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(value) {
        this.setDataValue('email', value.toLowerCase());
      },
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      set(value) {
        this.setDataValue('password', encript(value));
      },
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    expireTime: {
      type: Sequelize.DATE,
      defaultValue: moment()
        .tz('Asia/Singapore')
        .add(1, 'hours')
        .format('YYYY-MM-DD HH:mm:ss'),
    },
    country: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    profilPicture: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: process.env.USER_PROFILE_PICTURE,
    },
  },
  {
    tableName: 'user',
    underscored: true,
    timestamps: true,
  }
);

sequelize.sync();

export default User;
