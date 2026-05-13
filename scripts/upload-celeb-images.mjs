import mongoose from "mongoose";
import pkg from "cloudinary";
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local
const envPath = resolve(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").trim();
});

const cloudinary = pkg.v2;
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Temp dir for downloaded images
const tmpDir = join(__dirname, ".tmp-images");
if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

// ── Celebrity Schema (inline) ───────────────────────────────────────
const CloudinaryImageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: { type: String, required: true } },
  { _id: false }
);
const CelebrityServiceSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    basePrice: { type: Number, required: true, min: 0 },
    description: String,
    requirements: String,
  },
  { _id: false }
);
const SocialLinksSchema = new mongoose.Schema(
  { instagram: String, twitter: String, tiktok: String, youtube: String, facebook: String, linkedin: String, spotify: String, soundcloud: String },
  { _id: false }
);
const CelebritySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    bio: String,
    shortBio: { type: String, maxlength: 300 },
    category: { type: String, required: true },
    subcategories: [String],
    profileImage: CloudinaryImageSchema,
    coverImage: CloudinaryImageSchema,
    gallery: [{ url: String, publicId: String, caption: String }],
    nationality: String,
    knownFor: String,
    achievements: [String],
    languages: [String],
    socialLinks: SocialLinksSchema,
    availableServices: { type: [CelebrityServiceSchema], default: [] },
    concertEnabled: { type: Boolean, default: false },
    managerName: String, managerEmail: String, managerPhone: String, agencyName: String,
    internalNotes: String,
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true }
);
const Celebrity = mongoose.models.Celebrity || mongoose.model("Celebrity", CelebritySchema);

// ── Download with proper headers ────────────────────────────────────
async function downloadImage(url, filename) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "CelebConnectBot/1.0 (https://celebconnect.com; admin@celebconnect.com)",
      Accept: "image/*",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const filePath = join(tmpDir, filename);
  writeFileSync(filePath, buffer);
  return filePath;
}

// ── Upload local file to Cloudinary ─────────────────────────────────
async function uploadToCloudinary(filePath, folder) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `celebconnect/${folder}`,
    resource_type: "image",
    transformation: [{ quality: "auto:best" }, { fetch_format: "auto" }],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

// ── Delay helper ────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Image URLs for each celebrity ───────────────────────────────────
// Using Wikimedia Commons direct file URLs and other public sources
const imageMap = {
  "rick-lagina": {
    profile: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Oak_Island_South_Shore.jpg",
    cover: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Oak_Island_South_Shore.jpg",
  },
  "morgan-wallen": {
    profile: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Morgan_Wallen_%28cropped%29.jpg",
    cover: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Morgan_Wallen_Concert_November_13_landscape.jpg",
  },
  "travis-taylor": {
    profile: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Skinwalker_Ranch.jpg",
    cover: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Skinwalker_Ranch.jpg",
  },
  "john-wick": {
    profile: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Hollywood_Sign_%28Zuschnitt%29.jpg",
    cover: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Hollywood_Sign_%28Zuschnitt%29.jpg",
  },
  "darryl-jones": {
    profile: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Darryljones_%28cropped%29.jpg",
    cover: "https://upload.wikimedia.org/wikipedia/commons/7/7d/The_Rolling_Stones_with_Chuck_Leavell_and_Darryl_Jones_2013.jpg",
  },
  "darryl-worley": {
    profile: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Darryl_Worley_by_Gage_Skidmore.jpg",
    cover: "https://upload.wikimedia.org/wikipedia/commons/6/64/Grand_Ole_Opry_in_Ryman_Auditorium.jpg",
  },
};

async function main() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(env.MONGODB_URI);
  console.log("✅ Connected!\n");

  const slugs = Object.keys(imageMap);

  for (const slug of slugs) {
    const celeb = await Celebrity.findOne({ slug });
    if (!celeb) {
      console.log(`⏭  ${slug} not found in DB, skipping.`);
      continue;
    }

    // Skip if already has images
    if (celeb.profileImage?.url && celeb.coverImage?.url) {
      console.log(`⏭  ${celeb.name} already has images, skipping.`);
      continue;
    }

    const urls = imageMap[slug];
    console.log(`\n🎬 ${celeb.name}`);

    try {
      // Download profile
      if (!celeb.profileImage?.url && urls.profile) {
        console.log("  📥 Downloading profile image...");
        const localPath = await downloadImage(urls.profile, `${slug}-profile.jpg`);
        await delay(1000); // respect rate limits
        console.log("  ☁️  Uploading to Cloudinary...");
        const uploaded = await uploadToCloudinary(localPath, "celebrities/profiles");
        celeb.profileImage = uploaded;
        console.log(`  ✅ Profile: ${uploaded.url}`);
        try { unlinkSync(localPath); } catch {}
      }

      await delay(2000); // wait between downloads

      // Download cover
      if (!celeb.coverImage?.url && urls.cover) {
        console.log("  📥 Downloading cover image...");
        const localPath = await downloadImage(urls.cover, `${slug}-cover.jpg`);
        await delay(1000);
        console.log("  ☁️  Uploading to Cloudinary...");
        const uploaded = await uploadToCloudinary(localPath, "celebrities/covers");
        celeb.coverImage = uploaded;
        console.log(`  ✅ Cover: ${uploaded.url}`);
        try { unlinkSync(localPath); } catch {}
      }

      await celeb.save();
      console.log(`  💾 Saved to DB!`);
    } catch (err) {
      console.error(`  ❌ Error for ${celeb.name}: ${err.message}`);
    }

    await delay(3000); // wait between celebrities
  }

  // Cleanup temp dir
  try {
    const { rmSync } = await import("fs");
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  console.log("\n\n🎉 Image upload complete!");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
