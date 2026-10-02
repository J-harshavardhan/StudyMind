import app from './app.js';
import { connectDb, closeDb } from './utils/db.js';
import { env } from './config/env.js';

const startServer = async () => {
  await connectDb();
  const server = app.listen(env.PORT, () => {
    console.log(`StudyMind API running on port ${env.PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { app };
export default app;
