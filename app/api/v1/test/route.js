// app/api/v1/test/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get connection status
    const state = mongoose.connection.readyState;
    const stateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][state];
    
    // Try to ping the database
    let pingSuccess = false;
    try {
      await mongoose.connection.db.admin().command({ ping: 1 });
      pingSuccess = true;
    } catch (err) {
      console.log('Ping failed:', err.message);
    }
    
    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful!",
      details: {
        connectionState: stateText,
        databaseName: mongoose.connection.name || 'unknown',
        pingSuccessful: pingSuccess,
        host: mongoose.connection.host || 'unknown',
        models: mongoose.modelNames()
      }
    });
    
  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}