import { Sequelize } from 'sequelize';
import 'dotenv/config';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    logging:
      process.env.NODE_ENV === 'development'
        ? (...msg) => console.log(msg)
        : false,
    logging: false,
    dialectOptions: {
      // requestTimeout: 3000000,
      // encrypt: true,
      // useUTC: false, // for reading from database
      dateStrings: true,
      typeCast(field, next) {
        // for reading from database
        if (field.type === 'DATETIME') {
          return field.string();
        }
        return next();
      },
    },
    timezone: '+08:00',
    insecureAuth: true,
  }
);

export default sequelize;

// PLANET SCALE

// const sequelize = new Sequelize(process.env.DATABASE_URL, {
//   logging:
//     process.env.NODE_ENV === 'development'
//       ? (...msg) => console.log(msg)
//       : false,
//   logging: false,
//   dialectOptions: {
//     // requestTimeout: 3000000,
//     // encrypt: true,
//     // useUTC: false, // for reading from database
//     ssl: {
//       rejectUnauthorized: true,
//     },
//     dateStrings: true,
//     typeCast(field, next) {
//       // for reading from database
//       if (field.type === 'DATETIME') {
//         return field.string();
//       }
//       return next();
//     },
//   },
//   //timezone: 'Asia/Jakarta',
//   insecureAuth: true,
// });

// sequelize
//   .authenticate()
//   .then(() => {
//     console.log('DB connection established successfully');
//   })
//   .catch((err) => {
//     console.log('Unable to connect to DB', err);
//   });

// export default sequelize;