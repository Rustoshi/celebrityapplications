import mongoose from "mongoose";
import pkg from "cloudinary";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { format } from "date-fns";

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

// ── Helpers ─────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function generateFanCardNumber() {
  const dateStr = format(new Date(), "yyyyMMdd");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rand = "";
  for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `FC-${dateStr}-${rand}`;
}

async function uploadPlaceholder(text, folder, bg = "C9A96E", fg = "050505", w = 400, h = 600) {
  const encoded = encodeURIComponent(text);
  const url = `https://placehold.co/${w}x${h}/${bg}/${fg}/png?text=${encoded}`;
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: `celebconnect/${folder}`,
      resource_type: "image",
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    console.error(`  ⚠ Upload failed: ${err.message}`);
    return null;
  }
}

// ── Schemas (inline) ────────────────────────────────────────────────
const CloudinaryImageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: { type: String, required: true } },
  { _id: false }
);

// Celebrity (read-only)
const CelebritySchema = new mongoose.Schema({
  name: String, slug: String, category: String,
}, { strict: false });
const Celebrity = mongoose.models.Celebrity || mongoose.model("Celebrity", CelebritySchema);

// FanCard
const FanCardSchema = new mongoose.Schema({
  celebrityId: { type: mongoose.Schema.Types.ObjectId, ref: "Celebrity", required: true },
  cardNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  design: { type: CloudinaryImageSchema, required: true },
  backDesign: CloudinaryImageSchema,
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "USD" },
  isLimitedEdition: { type: Boolean, default: false },
  totalIssued: { type: Number, default: 0 },
  maxIssue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
const FanCard = mongoose.models.FanCard || mongoose.model("FanCard", FanCardSchema);

// MembershipTier
const MembershipTierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  shortDescription: { type: String, maxlength: 200 },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "USD" },
  billingCycle: { type: String, required: true, default: "monthly" },
  features: { type: [String], default: [] },
  maxBookingsPerMonth: { type: Number, default: 0, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  prioritySupport: { type: Boolean, default: false },
  earlyAccess: { type: Boolean, default: false },
  exclusiveContent: { type: Boolean, default: false },
  badge: CloudinaryImageSchema,
  color: String,
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  totalMembers: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
const MembershipTier = mongoose.models.MembershipTier || mongoose.model("MembershipTier", MembershipTierSchema);

// ── Fan card templates per celebrity ────────────────────────────────
function getFanCardTemplates(celebName, celebCategory) {
  return [
    {
      title: `${celebName} - Standard Fan Card`,
      description: `Official standard fan card featuring ${celebName}. A must-have collectible for every fan. Includes digital access to exclusive content.`,
      price: 29.99,
      isLimitedEdition: false,
      maxIssue: 0,
      sortOrder: 0,
      designText: `${celebName}\\nStandard\\nFan Card`,
      bg: "C9A96E", fg: "050505",
    },
    {
      title: `${celebName} - Premium Fan Card`,
      description: `Premium collector's fan card featuring ${celebName}. Enhanced holographic design with premium materials. Includes VIP digital perks and behind-the-scenes access.`,
      price: 59.99,
      isLimitedEdition: false,
      maxIssue: 0,
      sortOrder: 1,
      designText: `${celebName}\\nPremium\\nFan Card`,
      bg: "1a1a2e", fg: "C9A96E",
    },
    {
      title: `${celebName} - Limited Edition Gold Card`,
      description: `Exclusive limited edition gold fan card featuring ${celebName}. Only 500 available worldwide. Gold-foil embossed design, individually numbered, with lifetime VIP benefits.`,
      price: 149.99,
      isLimitedEdition: true,
      maxIssue: 500,
      sortOrder: 2,
      designText: `${celebName}\\nLimited Gold\\n#/500`,
      bg: "050505", fg: "D4AF37",
    },
  ];
}

// ── Membership tier definitions ─────────────────────────────────────
const membershipTiers = [
  {
    name: "Bronze",
    slug: "bronze",
    description: "Start your CelebConnect journey with essential access to celebrity bookings and fan experiences. Perfect for casual fans who want to explore our platform.",
    shortDescription: "Essential access to celebrity bookings",
    price: 9.99,
    billingCycle: "monthly",
    features: [
      "Browse all celebrity profiles",
      "Up to 2 booking requests per month",
      "Standard customer support",
      "Access to public fan events",
      "Digital fan card eligibility",
      "Monthly newsletter with celebrity updates",
    ],
    maxBookingsPerMonth: 2,
    discountPercent: 0,
    prioritySupport: false,
    earlyAccess: false,
    exclusiveContent: false,
    color: "#CD7F32",
    sortOrder: 0,
  },
  {
    name: "Silver",
    slug: "silver",
    description: "Upgrade your experience with Silver membership. Enjoy booking discounts, priority support, and early access to new celebrity listings. Ideal for dedicated fans.",
    shortDescription: "Enhanced bookings with discounts & priority support",
    price: 29.99,
    billingCycle: "monthly",
    features: [
      "Everything in Bronze",
      "Up to 5 booking requests per month",
      "5% discount on all bookings",
      "Priority customer support",
      "Early access to new celebrity listings",
      "Exclusive Silver member events",
      "Priority fan card ordering",
      "Quarterly virtual meet-and-greets",
    ],
    maxBookingsPerMonth: 5,
    discountPercent: 5,
    prioritySupport: true,
    earlyAccess: true,
    exclusiveContent: false,
    color: "#C0C0C0",
    sortOrder: 1,
  },
  {
    name: "Gold",
    slug: "gold",
    description: "Experience CelebConnect at its finest with Gold membership. Generous discounts, unlimited bookings, exclusive content, and VIP access to celebrity events.",
    shortDescription: "VIP access with generous discounts & exclusive content",
    price: 79.99,
    billingCycle: "monthly",
    features: [
      "Everything in Silver",
      "Up to 15 booking requests per month",
      "10% discount on all bookings",
      "24/7 VIP concierge support",
      "Early access to all new features",
      "Exclusive behind-the-scenes content",
      "Complimentary limited edition fan cards",
      "Monthly virtual meet-and-greets",
      "Priority event seating",
      "Birthday surprise from favorite celebrity",
    ],
    maxBookingsPerMonth: 15,
    discountPercent: 10,
    prioritySupport: true,
    earlyAccess: true,
    exclusiveContent: true,
    color: "#FFD700",
    sortOrder: 2,
  },
  {
    name: "Platinum",
    slug: "platinum",
    description: "The ultimate CelebConnect experience. Unlimited bookings, maximum discounts, personal concierge, and first access to everything. For the most dedicated fans and industry professionals.",
    shortDescription: "Ultimate unlimited access with personal concierge",
    price: 199.99,
    billingCycle: "monthly",
    features: [
      "Everything in Gold",
      "Unlimited booking requests",
      "20% discount on all bookings",
      "Dedicated personal concierge",
      "First access to all new celebrities & features",
      "All exclusive content & backstage passes",
      "Complimentary annual VIP event pass",
      "Free limited edition fan cards (all new releases)",
      "Weekly insider celebrity news briefing",
      "Priority booking confirmation",
      "Personalized celebrity recommendations",
      "Annual Platinum member gala invitation",
    ],
    maxBookingsPerMonth: 0, // 0 = unlimited
    discountPercent: 20,
    prioritySupport: true,
    earlyAccess: true,
    exclusiveContent: true,
    color: "#E5E4E2",
    sortOrder: 3,
  },
];

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(env.MONGODB_URI);
  console.log("✅ Connected!\n");

  // ── 1. Seed Membership Tiers ──────────────────────────────────────
  console.log("═══ MEMBERSHIP TIERS ═══\n");
  for (const tierData of membershipTiers) {
    const existing = await MembershipTier.findOne({ slug: tierData.slug });
    if (existing) {
      console.log(`⏭  ${tierData.name} tier already exists, skipping.`);
      continue;
    }

    // Upload badge placeholder
    console.log(`🏅 Creating ${tierData.name} tier...`);
    const badge = await uploadPlaceholder(
      tierData.name, "membership-badges",
      tierData.color.replace("#", ""), "FFFFFF", 200, 200
    );

    const tier = new MembershipTier({
      ...tierData,
      badge: badge || undefined,
    });
    await tier.save();
    console.log(`  ✅ Created: ${tierData.name} - $${tierData.price}/mo`);
  }

  // ── 2. Seed Fan Cards for each Celebrity ──────────────────────────
  console.log("\n═══ FAN CARDS ═══\n");
  const celebrities = await Celebrity.find({}).lean();

  if (celebrities.length === 0) {
    console.log("❌ No celebrities found in database. Seed celebrities first.");
  } else {
    console.log(`Found ${celebrities.length} celebrities.\n`);
  }

  for (const celeb of celebrities) {
    console.log(`🎬 ${celeb.name} (${celeb.category})`);

    // Check if fan cards already exist for this celeb
    const existingCards = await FanCard.countDocuments({ celebrityId: celeb._id });
    if (existingCards > 0) {
      console.log(`  ⏭  Already has ${existingCards} fan cards, skipping.`);
      continue;
    }

    const templates = getFanCardTemplates(celeb.name, celeb.category);

    for (const tmpl of templates) {
      const cardNumber = generateFanCardNumber();

      // Upload design image placeholder
      const design = await uploadPlaceholder(
        tmpl.designText, "fan-cards", tmpl.bg, tmpl.fg
      );

      if (!design) {
        console.log(`  ⚠ Skipping "${tmpl.title}" — design upload failed.`);
        continue;
      }

      const card = new FanCard({
        celebrityId: celeb._id,
        cardNumber,
        title: tmpl.title,
        description: tmpl.description,
        design,
        price: tmpl.price,
        isLimitedEdition: tmpl.isLimitedEdition,
        maxIssue: tmpl.maxIssue,
        isActive: true,
        sortOrder: tmpl.sortOrder,
      });

      await card.save();
      console.log(`  ✅ ${tmpl.title} — $${tmpl.price}${tmpl.isLimitedEdition ? ` (Limited: ${tmpl.maxIssue})` : ""}`);

      // Small delay to avoid rate limits on placehold.co
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log("\n\n🎉 Seed complete!");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
