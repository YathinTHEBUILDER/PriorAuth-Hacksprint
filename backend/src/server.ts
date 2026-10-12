import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import prisma from './prisma.js';

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // Validate database connection
    await prisma.$connect();
    console.log('✓ Database connected successfully.');

    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log('🏥 Prior Authorization Assistant — Backend API');
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
      console.log(`⚙️  AI Extraction Mode: ${process.env.AI_API_KEY ? 'Live API Key Configured' : 'Deterministic Clinical NLP (Demo Mode)'}`);
      console.log('====================================================');
    });

    const shutdown = async () => {
      console.log('Shutting down server gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server stopped and database disconnected.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('CRITICAL: Server initialization failed:', error);
    process.exit(1);
  }
}

startServer();
