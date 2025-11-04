import { env } from './config/env.js';
import { connectDB } from './db/connection.js';
import { createServer } from './server.js';

async function main() {
  await connectDB();
  const { server } = createServer();
  server.listen(env.PORT, () => console.log(`API on http://localhost:${env.PORT}`));
}

main();
