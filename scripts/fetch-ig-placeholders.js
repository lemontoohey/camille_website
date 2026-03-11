/**
 * -----------------------------------------------------------------------------
 * INSTRUCTIONS FOR EXECUTION
 * -----------------------------------------------------------------------------
 * 1. Install dependencies:
 *    npm install puppeteer axios
 * 
 * 2. Run the script:
 *    node scripts/fetch-ig-placeholders.js
 * 
 * -----------------------------------------------------------------------------
 * A Quick Tip for When You Run This:
 * -----------------------------------------------------------------------------
 * Instagram frequently throws "Login Walls" for automated browsers. If the 
 * script fails because it hits a login screen:
 * 1. Change `headless: "new"` to `headless: false` in the Puppeteer launch options below.
 * 2. When the script runs, a literal Chromium browser window will pop up.
 * 3. Log in manually with a burner/throwaway account (do not use your main business account).
 * 4. Once you log in, the script will naturally proceed to grab the images.
 * 
 * This script will populate:
 * - /public/placeholders/ (with images)
 * - /src/data/artworks.json (with metadata for the luxury gallery frontend)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');

// Constants
const IG_HANDLE = 'camillekathryn';
const PROFILE_URL = `https://www.instagram.com/${IG_HANDLE}/`;
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'placeholders');
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const DATA_FILE = path.join(DATA_DIR, 'artworks.json');
const TARGET_POST_COUNT = 10;

// Ensure directories exist
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Helper to download an image from a URL and save it to a file
 */
async function downloadImage(url, filepath) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      let error = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) resolve(true);
      });
    });
  } catch (error) {
    console.error(`Failed to download image from ${url}:`, error.message);
    return false;
  }
}

/**
 * Generate dummy metadata for the luxury gallery aesthetic
 */
function generateDummyMetadata(index) {
  const titles = [
    "Midnight Void", "Quinacridone Bloom", "Phthalo Depth", 
    "Vermillion Strike", "Parchment Whisper", "Ethereal Descent",
    "Chromatic Silence", "Obsidian Resonance", "Luminous Decay",
    "Fractured Light"
  ];
  
  const mediums = [
    "Oil and mixed media on canvas",
    "Acrylic and ash on raw linen",
    "Charcoal and pigment on paper",
    "Oil, gold leaf, and resin on panel",
    "Mixed media on archival parchment"
  ];

  const dimensions = [
    "40 x 60 in", "36 x 48 in", "60 x 80 in", "24 x 36 in", "48 x 48 in"
  ];

  const priceRaw = Math.floor(Math.random() * 200) * 100 + 5000;
  
  return {
    id: `artwork-${index}`,
    title: titles[index - 1] || `Untitled Canvas 0${index}`,
    imagePath: `/placeholders/artwork-${index}.jpg`,
    price: `$${priceRaw.toLocaleString()}`,
    dimensions: dimensions[Math.floor(Math.random() * dimensions.length)],
    medium: mediums[Math.floor(Math.random() * mediums.length)]
  };
}

/**
 * Main scraping function
 */
async function scrapeInstagram() {
  console.log('🚀 Starting Instagram placeholder fetch sequence...');
  
  let browser;
  try {
    // Ensure you use the specific chromium user data directory so it remembers the login session
    browser = await puppeteer.launch({
      headless: false, 
      userDataDir: './.puppeteer-user-data', // SAVES SESSION CACHE
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log(`📡 Navigating to ${PROFILE_URL}...`);
    await page.goto(PROFILE_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait a moment for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Auto-proceed after wait (instead of requiring Enter for this headless run)
    console.log('\n=============================================================');
    console.log('🛑 PAUSING FOR 60 SECONDS.');
    console.log('If you need to log in, do so now! The script will automatically continue after 60 seconds.');
    console.log('=============================================================\n');

    // Show a small countdown
    for(let i=60; i>0; i--) {
        if(i % 10 === 0) console.log(`... ${i} seconds remaining ...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ 60 seconds passed. Continuing extraction sequence...');

    const profilePicUrl = await page.evaluate(() => {
      // Find the profile picture in the header
      const imgs = Array.from(document.querySelectorAll('header img'));
      return imgs.length > 0 ? imgs[0].src : null;
    });

    if (profilePicUrl) {
      console.log('📸 Found profile picture, downloading...');
      await downloadImage(profilePicUrl, path.join(PUBLIC_DIR, 'camille-portrait.jpg'));
    } else {
      console.log('⚠️ Could not find profile picture.');
    }

    console.log(`🔍 Scanning for the first ${TARGET_POST_COUNT} posts...`);

    // Scroll to trigger lazy loading of the grid
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(resolve => setTimeout(resolve, 3000));

    const postImages = await page.evaluate(() => {
      // Find all images in the grid (article tag usually contains the posts)
      const article = document.querySelector('article');
      if (!article) return [];

      const images = Array.from(article.querySelectorAll('img'));
      
      return images
        .map(img => img.src)
        .filter(src => src && (src.includes('scontent') || src.includes('instagram')))
        // Ignore the profile pic if it was duplicated
        .filter(src => !src.includes('150x150'))
        // Deduplicate
        .filter((src, index, self) => self.indexOf(src) === index);
    });

    if (postImages.length === 0) {
      throw new Error("Could not find any post images. Instagram might have changed its DOM structure or blocked access.");
    }

    const imagesToDownload = postImages.slice(0, TARGET_POST_COUNT);
    console.log(`📥 Found ${imagesToDownload.length} valid post images. Starting download...`);

    const artworksData = [];

    for (let i = 0; i < imagesToDownload.length; i++) {
      const imgUrl = imagesToDownload[i];
      const filename = `artwork-${i + 1}.jpg`;
      const filepath = path.join(PUBLIC_DIR, filename);
      
      console.log(`   Downloading ${filename}...`);
      const success = await downloadImage(imgUrl, filepath);
      
      if (success) {
        artworksData.push(generateDummyMetadata(i + 1));
      } else {
        console.log(`   ❌ Failed to download ${filename}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800)); // Be polite
    }

    console.log('📝 Generating artworks.json...');
    fs.writeFileSync(DATA_FILE, JSON.stringify(artworksData, null, 2));
    
    console.log('✨ Success! All placeholders downloaded and JSON generated.');
    console.log(`📂 Images saved to: ${PUBLIC_DIR}`);
    console.log(`📄 Data saved to: ${DATA_FILE}`);

  } catch (error) {
    console.error('\n❌ SCRIPT FAILED:');
    console.error(error.message);
    console.error('\nGracefully exiting.');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

scrapeInstagram();
