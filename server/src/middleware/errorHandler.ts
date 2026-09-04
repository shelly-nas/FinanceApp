import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Terminal error handler.
 *
 * Routes used to return the raw pg error object, which carries the failed query,
 * column names and constraint names straight to the browser. The full error
 * belongs in the server log; the client gets a fixed message and a reference it
 * can quote, which is enough to find the logged entry.
 */
export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  const reference = crypto.randomBytes(4).toString('hex');

  console.error(`[${reference}]`, error);

  // A streamed response may already have started; overwriting its status here
  // would corrupt what the client has.
  if (res.headersSent) return;

  res.status(500).json({
    error: 'Something went wrong on the server. Try again.',
    reference,
  });
}
