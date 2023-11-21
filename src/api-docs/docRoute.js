import express, { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './apiRinjaniSpec.json' assert { type: 'json' };

const docRoute = express.Router();

const options = {
  explorer: true,
};

docRoute.use('/docs', swaggerUi.serve);
docRoute.get('/docs', swaggerUi.setup(swaggerDocument, options));

export default docRoute;