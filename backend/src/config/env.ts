import 'dotenv/config';

export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  MONGO_URI: process.env.MONGO_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
