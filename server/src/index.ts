import 'module-alias/register'; // Resolve relative references with '@'
import express from 'express';
import bodyParser from 'body-parser';
import financeController from '@/controllers/financeController';
import cors from 'cors';
import morgan from 'morgan';
import { runMigrations } from '@/context/migrations';
import { errorHandler } from '@/middleware/errorHandler';

const app = express();
const port = process.env.SERVER_PORT || 3000;

async function start() {
  // Schema first: the routes below assume columns that a migration may still
  // have to add, so a failure here must stop the boot rather than surface as a
  // stream of query errors at runtime.
  await runMigrations();

  app.use(cors());
  app.use(bodyParser.json());
  // Logging is registered before the router - behind it, it never sees a request.
  app.use(morgan('common'));

  // The running version, so a deploy can be confirmed without opening a shell
  // on the host: the released image writes it into package.json.
  const { version } = require('../package.json');

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', version });
  });
  app.use('/api', financeController);

  // Last: only reached once no route has handled the request.
  app.use(errorHandler);

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}

start().catch((error) => {
  console.error('Error during server initialization:', error);
  process.exit(1);
});
