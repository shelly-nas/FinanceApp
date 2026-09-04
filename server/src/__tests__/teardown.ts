import dbContext from '@/context/dbContext';

// The pool is shared by every test file, so it can only be closed once they have
// all finished - a per-file teardown cancels whatever another file still has in
// flight. Registered as a process-level hook instead.
process.on('beforeExit', () => {
  dbContext.pool.end().catch(() => undefined);
});
