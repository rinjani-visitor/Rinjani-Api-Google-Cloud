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
    dialectOptions: {
      requestTimeout: 3000000,
      encrypt: true,
      useUTC: false, // for reading from database
      dateStrings: true,
      typeCast(field, next) {
        // for reading from database
        if (field.type === 'DATETIME') {
          return field.string();
        }
        return next();
      },
    },
    // timezone: 'Asia/Makassar',
    insecureAuth: true,
  }
);

export default sequelize;

// const sequelize = new Sequelize({
//   dialect: process.env.DB_DIALECT, 
//   host: process.env.DB_HOST,    
//   username: process.env.DB_USER,
//   password: process.env.DB_PASSWORD, 
//   database: process.env.DB_NAME, 
//   port: process.env.DB_PORT,           
//   define: {
//     timestamps: true,    
//     underscored: true,   
//   },
//   dialectOptions: {
//     requestTimeout: 3000000,
//     encrypt: true, 
//     dateStrings: true,
//     typeCast(field, next) {
//       // for reading from database
//       if (field.type === 'DATETIME') {
//         return field.string();
//       }
//       return next();
//     },
//   }
// });

// export default sequelize;