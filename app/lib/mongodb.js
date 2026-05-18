// app/lib/mongodb.js - FINAL WORKING VERSION
import mongoose from 'mongoose';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

// Use the correct replica set name from discovery: atlas-r8h6ge-shard-0
const MONGODB_URI = "mongodb://sabbirus183023:sabbir183023@ac-hnno5a6-shard-00-00.z2nzcwr.mongodb.net:27017,ac-hnno5a6-shard-00-01.z2nzcwr.mongodb.net:27017,ac-hnno5a6-shard-00-02.z2nzcwr.mongodb.net:27017/LizasCollection?ssl=true&replicaSet=atlas-r8h6ge-shard-0&authSource=admin&retryWrites=true&w=majority";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    console.log('📦 Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      family: 4,
      tls: true,
      retryWrites: true,
      retryReads: true,
    };

    console.log('🔄 Connecting to MongoDB Atlas...');
    console.log('📍 Cluster: ac-hnno5a6');
    console.log('📍 Replica Set: atlas-r8h6ge-shard-0');
    console.log('📍 Database: LizasCollection');
    
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully!');
        console.log('📊 Connection state:', mongoose.connection.readyState);
        console.log('📚 Database:', mongoose.connection.name);
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function withPrimaryWrite(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if ((error.code === 10107 || error.message?.includes('not primary')) && i < maxRetries - 1) {
        console.log(`⚠️ Not primary, retrying (${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}