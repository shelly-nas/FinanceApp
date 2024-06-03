import 'module-alias/register'; // Resolve relative references with '@'
import express from 'express';
import bodyParser from 'body-parser';
import financeController from '@/controllers/financeController';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const port = process.env.SERVER_PORT;

try {
  app.use(cors());
	// app.use(express.json());
  app.use(bodyParser.json());
  // app.use(bodyParser.urlencoded({ extended: false }));
  app.use('/api', financeController);
	app.use(morgan("common"));
	
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
} catch (error) {
  console.error('Error during server initialization:', error);
}
