import express from 'express';
import 'dotenv/config';
import appMiddleware from './src/middleware/index.js';
import bodyParser from 'body-parser';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import path from 'path';
import url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const app = express();
const PORT = process.env.PORT || 9000;
const serverRun = process.env.BASE_URL || 'localhost';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/images', express.static(path.join(__dirname, './public/images')));

//open API docs
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rinjani API',
      version: '1.0.0',
    },
    servers: [
      {
        url: `https://${process.env.GOOGLE_CLOUD_RUN_EXTERNAL_URL}`,
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const options2 = {
  explorer: true,
};

const specs = swaggerJsDoc(options);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs, options2));

//route utama
app.use(appMiddleware);

//FOR DEV

app.listen(PORT, () => {
  console.log(`Server running on ${serverRun}:${PORT}`);
});

//FOR PROD
// http.createServer(app).listen(PORT);
