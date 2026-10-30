const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // 1. Check if user configured MongoDB Atlas
  if (uri && (uri.startsWith('mongodb+srv://') || (!uri.includes('localhost') && !uri.includes('127.0.0.1')))) {
    // Check for unreplaced placeholders like <username> or <password>
    if (uri.includes('<username>') || uri.includes('<password>') || uri.includes('<cluster>')) {
      console.warn('⚠️ MongoDB Atlas URI detected, but contains placeholder values (<username>, <password>).');
      console.warn('👉 Please update server/.env with your actual MongoDB Atlas credentials.');
    } else {
      try {
        console.log('🔄 Connecting to MongoDB Atlas cluster...');
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 8000
        });
        console.log(`🍃 Connected to MongoDB Atlas: ${conn.connection.host}`);
        console.log(`🗄️ Database Name: ${conn.connection.name}`);
        return;
      } catch (error) {
        console.error(`❌ MongoDB Atlas Connection Failed: ${error.message}`);
        console.error('👉 Check that:');
        console.error('   1. Your Atlas Database User and Password in server/.env are correct.');
        console.error('   2. Network Access in MongoDB Atlas allows IP 0.0.0.0/0 (or your current IP).');
      }
    }
  }

  // 2. Try connecting to local MongoDB (if running)
  const localURI = uri && (uri.includes('localhost') || uri.includes('127.0.0.1'))
    ? uri
    : 'mongodb://127.0.0.1:27017/banana_classroom';

  try {
    const conn = await mongoose.connect(localURI, { serverSelectionTimeoutMS: 2000 });
    console.log(`✅ MongoDB Connected locally: ${conn.connection.host}:${conn.connection.port}`);
    return;
  } catch (localError) {
    console.log('ℹ️ Local MongoDB daemon not detected at port 27017.');
  }

  // 3. Fallback: Launch Embedded MongoDB Development Server
  try {
    console.log('🚀 Starting temporary embedded MongoDB Development Server...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memoryURI = mongodInstance.getUri();
    
    const conn = await mongoose.connect(memoryURI);
    console.log(`✅ Connected to Embedded MongoDB at: ${memoryURI}`);
    console.log('💡 When you are ready, paste your MongoDB Atlas URI in server/.env to persist data to the cloud.');
  } catch (memError) {
    console.error(`❌ Could not start database: ${memError.message}`);
  }
};

// Graceful cleanup on process exit
process.on('SIGINT', async () => {
  if (mongodInstance) {
    await mongodInstance.stop();
  }
  process.exit(0);
});

module.exports = connectDB;
