import mongoose from "mongoose";
import pkg from "cloudinary";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
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

// ── Celebrity Schema (inline to avoid TS alias issues) ──────────────
const CloudinaryImageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: { type: String, required: true } },
  { _id: false }
);

const CelebrityServiceSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    basePrice: { type: Number, required: true, min: 0 },
    description: { type: String },
    requirements: { type: String },
  },
  { _id: false }
);

const SocialLinksSchema = new mongoose.Schema(
  {
    instagram: String, twitter: String, tiktok: String,
    youtube: String, facebook: String, linkedin: String,
    spotify: String, soundcloud: String,
  },
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
    managerName: String,
    managerEmail: String,
    managerPhone: String,
    agencyName: String,
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

const Celebrity =
  mongoose.models.Celebrity || mongoose.model("Celebrity", CelebritySchema);

// ── Upload helper ───────────────────────────────────────────────────
async function uploadFromUrl(url, folder) {
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: `celebconnect/${folder}`,
      resource_type: "image",
      transformation: [{ quality: "auto:best" }, { fetch_format: "auto" }],
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    console.error(`  ⚠ Upload failed for ${url}: ${err.message}`);
    return null;
  }
}

// ── Slug helper ─────────────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Celebrity data ──────────────────────────────────────────────────
const celebrities = [
  {
    name: "Rick Lagina",
    slug: "rick-lagina",
    category: "Reality Star",
    shortBio:
      "Television personality and treasure hunter from The Curse of Oak Island on History Channel.",
    bio: "Rick Lagina is an American television personality, treasure hunter, and executive producer best known for his central role on the History Channel reality series The Curse of Oak Island. A retired U.S. postal worker from Kingsford, Michigan, Rick became fascinated with Oak Island after reading about it in a 1965 issue of Reader's Digest as a child. Together with his brother Marty, he purchased a portion of Oak Island in 2005 and has since led one of the longest-running treasure hunts in history. His unwavering dedication, blue-collar work ethic, and signature catchphrase 'Once in, forever in!' have made him a fan favorite across twelve seasons of the show. Beyond Oak Island, Rick has appeared in the spin-off series Beyond Oak Island and continues to inspire treasure-hunting enthusiasts worldwide.",
    nationality: "American",
    knownFor:
      "The Curse of Oak Island, Beyond Oak Island, Oak Island treasure hunt",
    achievements: [
      "Executive producer of The Curse of Oak Island",
      "12+ seasons on History Channel",
      "Co-owner of Oak Island Tours Inc.",
    ],
    languages: ["English"],
    socialLinks: {},
    tags: ["reality-tv", "treasure-hunter", "history-channel", "oak-island"],
    featured: true,
    availableServices: [
      { type: "private_event", isActive: true, basePrice: 50000, description: "Private appearance and treasure-hunting talk" },
      { type: "corporate_event", isActive: true, basePrice: 75000, description: "Corporate keynote and meet-and-greet" },
      { type: "video_call", isActive: true, basePrice: 2000, description: "Personal video call with fans" },
    ],
    images: {
      profile: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Oak_Island_South_Shore.jpg",
      cover: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Oak_Island_South_Shore.jpg",
    },
  },
  {
    name: "Morgan Wallen",
    slug: "morgan-wallen",
    category: "Singer",
    shortBio:
      "Multi-platinum country music superstar behind Last Night, One Thing at a Time, and record-breaking stadium tours.",
    bio: "Morgan Cole Wallen is an American country music singer and songwriter from Sneedville, Tennessee. He first gained national attention as a contestant on Season 6 of The Voice in 2014 and has since become one of the biggest artists in all of music. His album Dangerous: The Double Album spent ten consecutive weeks at #1 on the Billboard 200, a record for a country album. His follow-up One Thing at a Time debuted at #1 with the largest streaming week ever for a country album and produced the smash hit Last Night, which topped the Billboard Hot 100 for multiple weeks. His 2025 album I'm the Problem continued his chart dominance. Wallen's One Night at a Time World Tour sold out stadiums across North America, Europe, and Australia. He is a 19-time Billboard Music Award winner and one of the most-streamed artists on Spotify globally. He also owns Nashville's Morgan Wallen's This Bar & Tennessee Kitchen.",
    nationality: "American",
    knownFor:
      "Last Night, One Thing at a Time, Dangerous: The Double Album, Thought You Should Know, I'm the Problem",
    achievements: [
      "19 Billboard Music Awards",
      "10 consecutive weeks at #1 on Billboard 200",
      "Largest streaming week for a country album",
      "Multiple #1 singles on Billboard Hot 100",
      "Sold-out stadium world tour",
    ],
    languages: ["English"],
    socialLinks: {
      instagram: "https://www.instagram.com/morganwallen",
      twitter: "https://www.x.com/MorganWallen",
      youtube: "https://www.youtube.com/@MorganWallen",
      spotify:
        "https://open.spotify.com/artist/4oUHIQIBe0LHzYfvXNW4QM",
    },
    tags: [
      "country", "stadium-tours", "platinum", "billboard", "nashville", "singer-songwriter",
    ],
    featured: true,
    availableServices: [
      { type: "live_performance", isActive: true, basePrice: 1500000, description: "Full concert performance" },
      { type: "private_event", isActive: true, basePrice: 800000, description: "Private event appearance with acoustic set" },
      { type: "corporate_event", isActive: true, basePrice: 1000000, description: "Corporate event performance" },
      { type: "brand_endorsement", isActive: true, basePrice: 600000, description: "Brand partnership and endorsement" },
    ],
    images: {
      profile:
        "https://upload.wikimedia.org/wikipedia/commons/a/a7/Morgan_Wallen_%28cropped%29.jpg",
      cover:
        "https://upload.wikimedia.org/wikipedia/commons/4/4b/Morgan_Wallen_Concert_November_13_landscape.jpg",
    },
  },
  {
    name: "Travis Taylor",
    slug: "travis-taylor",
    category: "TV Personality",
    shortBio:
      "Astrophysicist, aerospace engineer, and lead investigator on The Secret of Skinwalker Ranch.",
    bio: "Travis Shane Taylor, Ph.D., is an American aerospace engineer, optical scientist, science fiction author, and television personality. Born in 1968 in Decatur, Alabama, he holds five advanced degrees including a Ph.D. in Optical Science and Engineering and a Ph.D. in Aerospace Systems Engineering. He has spent over 25 years working on classified programs for the U.S. Department of Defense and NASA, contributing to weapons development, space exploration, and advanced propulsion research. Taylor is best known as the lead investigator and chief scientist on the History Channel series The Secret of Skinwalker Ranch, where he applies rigorous scientific methodology to investigate the anomalous phenomena reported on the 512-acre property in Utah. He has also appeared on Rocket City Rednecks, Ancient Aliens, and NASA's Unexplained Files. He is the author of over 20 science fiction novels and several nonfiction books on advanced physics and space warfare.",
    nationality: "American",
    knownFor:
      "The Secret of Skinwalker Ranch, Rocket City Rednecks, NASA & DoD research, Ancient Aliens",
    achievements: [
      "5 advanced degrees including 2 Ph.D.s",
      "25+ years with NASA and Department of Defense",
      "Lead scientist on The Secret of Skinwalker Ranch",
      "Author of 20+ books",
      "Host of Rocket City Rednecks",
    ],
    languages: ["English"],
    socialLinks: {},
    tags: [
      "scientist", "astrophysicist", "history-channel", "skinwalker-ranch",
      "nasa", "author", "tv-personality",
    ],
    featured: true,
    availableServices: [
      { type: "corporate_event", isActive: true, basePrice: 80000, description: "Scientific keynote and presentation" },
      { type: "private_event", isActive: true, basePrice: 50000, description: "Private appearance and Q&A session" },
      { type: "video_call", isActive: true, basePrice: 2500, description: "Personal video call consultation" },
    ],
    images: {
      profile: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Skinwalker_Ranch.jpg",
      cover: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Skinwalker_Ranch.jpg",
    },
  },
  {
    name: "John Wick",
    slug: "john-wick",
    category: "Actor",
    shortBio:
      "Iconic action film character and franchise brand, portrayed by Keanu Reeves across four blockbuster films.",
    bio: "John Wick is one of the most iconic action film franchises in cinematic history, starring Keanu Reeves as the legendary retired hitman John Wick. The franchise spans four critically acclaimed and commercially successful films — John Wick (2014), John Wick: Chapter 2 (2017), John Wick: Chapter 3 – Parabellum (2019), and John Wick: Chapter 4 (2023) — collectively grossing over $1 billion worldwide. The franchise has expanded to include the spin-off film Ballerina (2025) and the prequel television series The Continental. Known for its breathtaking choreography, stylish world-building, and Keanu Reeves' iconic performance, the John Wick brand has become a cultural phenomenon in action entertainment. Note: This entry represents the franchise brand for promotional appearances, themed events, and brand partnerships.",
    nationality: "American",
    knownFor:
      "John Wick film franchise, Ballerina, The Continental, action cinema",
    achievements: [
      "Over $1 billion worldwide box office",
      "4 mainline films",
      "Spawned spin-off film and TV series",
      "Redefined modern action cinema",
    ],
    languages: ["English"],
    socialLinks: {},
    tags: [
      "action", "film-franchise", "keanu-reeves", "blockbuster",
      "entertainment-brand", "iconic",
    ],
    featured: false,
    availableServices: [
      { type: "brand_endorsement", isActive: true, basePrice: 500000, description: "John Wick franchise brand partnership" },
      { type: "private_event", isActive: true, basePrice: 300000, description: "Themed event appearance" },
      { type: "corporate_event", isActive: true, basePrice: 400000, description: "Corporate event themed experience" },
    ],
    images: {
      profile: "https://upload.wikimedia.org/wikipedia/commons/3/33/Nicolas_Cage_-_66%C3%A8me_Festival_de_Venise_%28Mostra%29.jpg",
      cover: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Hollywood_Sign_%28Zuschnitt%29.jpg",
    },
  },
  {
    name: "Darryl Jones",
    slug: "darryl-jones",
    category: "Musician",
    shortBio:
      "Legendary bassist for The Rolling Stones since 1993, former Miles Davis band member.",
    bio: "Darryl Jones is an American bassist who has been recording and touring with The Rolling Stones since 1993, replacing founding member Bill Wyman. Born on December 11, 1961, on the south side of Chicago, Jones grew up in a musical household and began playing bass at age ten. Before joining the Stones, he played in Miles Davis's band during the trumpeter's final years, contributing to albums like Decoy and You're Under Arrest — a credential that places him among the elite musicians in jazz and rock history. He has also collaborated with Sting, Peter Gabriel, Herbie Hancock, Madonna, and many others. With The Rolling Stones, Jones has performed on every studio album and world tour since Voodoo Lounge (1994), including the recent Hackney Diamonds album and the Hackney Diamonds Tour. Despite being the longest-serving non-official member, his thunderous bass lines and stage presence are integral to the Stones' legendary live sound.",
    nationality: "American",
    knownFor:
      "The Rolling Stones, Miles Davis band, Voodoo Lounge, Hackney Diamonds",
    achievements: [
      "30+ years touring with The Rolling Stones",
      "Former Miles Davis band member",
      "Performed on every Stones album since Voodoo Lounge",
      "Collaborated with Sting, Peter Gabriel, Herbie Hancock",
      "Hackney Diamonds Tour (2024-2025)",
    ],
    languages: ["English"],
    socialLinks: {
      instagram: "https://www.instagram.com/darryljonesbassist",
    },
    tags: [
      "rolling-stones", "bassist", "jazz", "rock", "miles-davis",
      "legendary", "touring-musician", "chicago",
    ],
    featured: true,
    availableServices: [
      { type: "live_performance", isActive: true, basePrice: 200000, description: "Live bass performance or session" },
      { type: "private_event", isActive: true, basePrice: 120000, description: "Private event performance" },
      { type: "corporate_event", isActive: true, basePrice: 150000, description: "Corporate event appearance and performance" },
      { type: "video_call", isActive: true, basePrice: 1500, description: "Personal video call with fans" },
    ],
    images: {
      profile:
        "https://upload.wikimedia.org/wikipedia/commons/c/c9/Darryljones_%28cropped%29.jpg",
      cover:
        "https://upload.wikimedia.org/wikipedia/commons/7/7d/The_Rolling_Stones_with_Chuck_Leavell_and_Darryl_Jones_2013.jpg",
    },
  },
  {
    name: "Darryl Worley",
    slug: "darryl-worley",
    category: "Singer",
    shortBio:
      "Award-winning country singer-songwriter known for Have You Forgotten? and I Miss My Friend.",
    bio: "Darryl Worley is an American country music singer and songwriter from Pyburn, Tennessee. He signed with DreamWorks Nashville in 1999 and has since released multiple albums and charted numerous singles on the Billboard Hot Country Songs chart. His most iconic song, Have You Forgotten?, written in response to the September 11 attacks after a visit to troops in Afghanistan, topped the Billboard Hot Country Songs and Hot 100 charts simultaneously in 2003 and became an anthem of patriotic resilience. Other major hits include I Miss My Friend, Awful Beautiful Life, and A Good Day to Run. Worley is a three-time nominee for the Academy of Country Music's Top New Male Vocalist and has been honored with the USO Merit Award for his extensive work entertaining U.S. troops overseas. He continues to tour and perform at major country music festivals and venues, maintaining a loyal and dedicated fanbase rooted in traditional country values.",
    nationality: "American",
    knownFor:
      "Have You Forgotten?, I Miss My Friend, Awful Beautiful Life, A Good Day to Run",
    achievements: [
      "#1 hit on Billboard Hot Country Songs and Hot 100",
      "USO Merit Award for troop entertainment",
      "3x ACM Top New Male Vocalist nominee",
      "Multiple Top 10 country singles",
      "Extensive overseas troop performance tours",
    ],
    languages: ["English"],
    socialLinks: {
      instagram: "https://www.instagram.com/darrylworley",
      facebook: "https://www.facebook.com/DarrylWorley",
    },
    tags: [
      "country", "patriotic", "singer-songwriter", "nashville",
      "uso", "traditional-country", "touring",
    ],
    featured: false,
    availableServices: [
      { type: "live_performance", isActive: true, basePrice: 80000, description: "Full concert performance" },
      { type: "private_event", isActive: true, basePrice: 50000, description: "Private event performance and acoustic set" },
      { type: "corporate_event", isActive: true, basePrice: 60000, description: "Corporate event appearance" },
      { type: "charity_event", isActive: true, basePrice: 30000, description: "Charity and benefit concert" },
      { type: "video_call", isActive: true, basePrice: 500, description: "Personal video call with fans" },
    ],
    images: {
      profile:
        "https://upload.wikimedia.org/wikipedia/commons/a/aa/Darryl_Worley_by_Gage_Skidmore.jpg",
      cover:
        "https://upload.wikimedia.org/wikipedia/commons/6/64/Grand_Ole_Opry_in_Ryman_Auditorium.jpg",
    },
  },
];

// ── Main seed function ──────────────────────────────────────────────
async function main() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(env.MONGODB_URI);
  console.log("✅ Connected!\n");

  for (const celeb of celebrities) {
    console.log(`\n🎬 Processing: ${celeb.name}`);

    // Check if already exists
    const existing = await Celebrity.findOne({ slug: celeb.slug });
    if (existing) {
      console.log(`  ⏭  Already exists, skipping.`);
      continue;
    }

    // Upload profile image
    let profileImage = null;
    if (celeb.images.profile) {
      console.log(`  📸 Uploading profile image...`);
      profileImage = await uploadFromUrl(
        celeb.images.profile,
        `celebrities/profiles`
      );
    }

    // Upload cover image
    let coverImage = null;
    if (celeb.images.cover) {
      console.log(`  🖼  Uploading cover image...`);
      coverImage = await uploadFromUrl(
        celeb.images.cover,
        `celebrities/covers`
      );
    }

    // Build doc
    const doc = {
      name: celeb.name,
      slug: celeb.slug,
      bio: celeb.bio,
      shortBio: celeb.shortBio,
      category: celeb.category,
      nationality: celeb.nationality,
      knownFor: celeb.knownFor,
      achievements: celeb.achievements,
      languages: celeb.languages,
      socialLinks: celeb.socialLinks,
      tags: celeb.tags,
      featured: celeb.featured,
      isActive: true,
      availableServices: celeb.availableServices,
    };

    if (profileImage) doc.profileImage = profileImage;
    if (coverImage) doc.coverImage = coverImage;

    await Celebrity.create(doc);
    console.log(`  ✅ Created: ${celeb.name}`);
  }

  console.log("\n\n🎉 Seed complete!");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
