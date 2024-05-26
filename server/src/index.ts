import 'module-alias/register'; // Resolve relative references with '@'
import express from 'express';
import bodyParser from 'body-parser';
import jointAccountController from '@/controllers/jointAccountController';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const port = process.env.SERVER_PORT;

try {
  app.use(cors());
	// app.use(express.json());
  app.use(bodyParser.json());
  // app.use(bodyParser.urlencoded({ extended: false }));
  app.use('/api', jointAccountController);
	// app.use(helmet());
	app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
	// app.use(morgan("common"));
	// app.use(cors({
	// 	origin: 'http://localhost:5173', // Allow only this origin
	// 	methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
	// 	credentials: true, // Allow cookies to be sent
	// }));
	
    
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
} catch (error) {
  console.error('Error during server initialization:', error);
}
