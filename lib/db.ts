import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/** MongoDB connection URI from environment variables */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

/** Global cache interface for mongoose connection */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/** Declare global cache to prevent multiple connections in development */
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

/** Cached connection object */
const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Connects to MongoDB using Mongoose with connection caching.
 * Prevents multiple connections in development due to hot reloading.
 * Auto-seeds default admin user if none exists.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("✅ MongoDB connected successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    
    // Auto-seed admin user after successful connection
    await seedAdminUser();
    
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

/**
 * Seeds a default admin user if no admin exists in the database.
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD from environment variables.
 */
async function seedAdminUser(): Promise<void> {
  try {
    // Import Admin model dynamically to avoid circular dependencies
    const { Admin } = await import("@/lib/models");
    
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin seed");
      return;
    }

    // Check if any admin exists
    const existingAdmin = await Admin.findOne({});
    
    if (!existingAdmin) {
      // Hash the password with 12 rounds
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      // Create default admin
      await Admin.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: "Super",
        lastName: "Admin",
        role: "super_admin",
        isActive: true,
      });
      
      console.log("🌱 Default admin seeded successfully");
    }
  } catch (error) {
    // Silently fail if models aren't ready yet (first run)
    // This will succeed on subsequent connections
    if (error instanceof Error && !error.message.includes("Cannot find module")) {
      console.error("❌ Error seeding admin:", error);
    }
  }
}

/**
 * Disconnects from MongoDB. Useful for cleanup in tests or serverless functions.
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log("🔌 MongoDB disconnected");
  }
}

export default connectDB;
