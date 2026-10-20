// seed_marketplace.mjs
// Automated marketplace seeding script using native fetch in Node.js 18+

const API_BASE = 'http://127.0.0.1:8080/api/v1';

const CREDENTIALS = {
  admin: { email: 'admin@gmail.com', password: 'Admin@123' },
  sellers: [
    { email: 'seller@gmail.com', password: 'Seller@123', name: 'TechZone Direct' },
    { email: 'seller1@gmail.com', password: 'Seller@123', name: 'Apex Electronics' },
    { email: 'seller2@gmail.com', password: 'Seller@123', name: 'Prime Retail Hub' },
    { email: 'seller3@gmail.com', password: 'Seller@123', name: 'NexGen Devices' },
  ],
  user: { email: 'user@gmail.com', password: 'User@123', name: 'Sahil Sharma' },
};

async function postJson(endpoint, data, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: text };
  }
}

async function getJson(endpoint, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers,
  });

  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: text };
  }
}

async function patchJson(endpoint, data, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: text };
  }
}

async function loginUser(email, password) {
  console.log(`🔐 Logging in as ${email}...`);
  const res = await postJson('/auth/login', { email, password });
  if (!res.ok) {
    throw new Error(`Login failed for ${email} (status ${res.status}): ${JSON.stringify(res.data)}`);
  }
  return {
    token: res.data.accessToken,
    userId: res.data.user.id,
    role: res.data.user.role,
  };
}

async function seed() {
  console.log('🚀 Starting Marketplace Seeding...\n');

  // 1. Authenticate All Roles
  const adminAuth = await loginUser(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
  console.log(`✅ Admin authenticated (ID: ${adminAuth.userId})`);

  const sellerAuths = [];
  for (const s of CREDENTIALS.sellers) {
    try {
      const auth = await loginUser(s.email, s.password);
      sellerAuths.push({ ...auth, sellerInfo: s });
      console.log(`✅ Seller ${s.email} authenticated (ID: ${auth.userId})`);
    } catch (e) {
      console.log(`⚠️ Seller ${s.email} login skipped: ${e.message}`);
    }
  }

  const userAuth = await loginUser(CREDENTIALS.user.email, CREDENTIALS.user.password);
  console.log(`✅ User ${CREDENTIALS.user.email} authenticated (ID: ${userAuth.userId})\n`);

  // 2. Fetch or Create Categories
  console.log('📁 Setting up Categories...');
  const catRes = await getJson('/categories');
  const existingCategories = Array.isArray(catRes.data) ? catRes.data : [];
  const categoryMap = new Map();
  for (const c of existingCategories) {
    categoryMap.set(c.name.toLowerCase(), c);
  }

  const CATEGORIES = [
    { name: 'Laptops & Ultrabooks', description: 'High-performance laptops, ultrabooks, and workstations' },
    { name: 'Smartphones & Foldables', description: 'Flagship, foldable, and mid-range mobile phones' },
    { name: 'Audio & Headphones', description: 'Wireless earbuds, noise-cancelling headphones, and soundbars' },
    { name: 'Smartwatches & Wearables', description: 'Fitness trackers, smart watches, and smart rings' },
    { name: 'Gaming Consoles & Gear', description: 'Next-gen consoles, gaming handhelds, and controllers' },
    { name: 'Monitors & Displays', description: '4K, OLED, ultrawide, and high-refresh-rate gaming monitors' },
    { name: 'PC Components & GPUs', description: 'Graphics cards, processors, motherboards, and memory' },
    { name: 'Cameras & Photography', description: 'Mirrorless cameras, vlogging kits, and studio lenses' },
    { name: 'Smart Home & IoT', description: 'Smart speakers, lighting, security cameras, and hubs' },
    { name: 'Tablets & E-Readers', description: 'Productivity tablets, iPads, and digital e-readers' },
    { name: 'Computer Accessories', description: 'Keyboards, precision mice, docking stations, and webcams' },
    { name: 'Storage & Backup', description: 'High-speed NVMe SSDs, external hard drives, and flash storage' },
  ];

  for (const cat of CATEGORIES) {
    const lower = cat.name.toLowerCase();
    if (!categoryMap.has(lower)) {
      const created = await postJson('/categories', cat, adminAuth.token);
      if (created.ok) {
        categoryMap.set(lower, created.data);
        console.log(`  + Created Category: ${cat.name}`);
      } else {
        console.log(`  ! Category creation failed for ${cat.name}:`, created.data);
      }
    } else {
      console.log(`  = Category exists: ${cat.name}`);
    }
  }

  // 3. Fetch or Create Brands
  console.log('\n🏷️ Setting up Brands...');
  const brandRes = await getJson('/brands');
  const existingBrands = Array.isArray(brandRes.data) ? brandRes.data : [];
  const brandMap = new Map();
  for (const b of existingBrands) {
    brandMap.set(b.name.toLowerCase(), b);
  }

  const BRANDS = [
    'Apple', 'Samsung', 'Sony', 'Dell', 'Lenovo', 'ASUS', 'HP', 'Bose', 'LG', 'Logitech',
    'AMD', 'Intel', 'Nvidia', 'Canon', 'Corsair', 'OnePlus', 'Google', 'Microsoft', 'Sennheiser', 'Nothing'
  ];

  for (const bName of BRANDS) {
    const lower = bName.toLowerCase();
    if (!brandMap.has(lower)) {
      const created = await postJson('/brands', { name: bName }, adminAuth.token);
      if (created.ok) {
        brandMap.set(lower, created.data);
        console.log(`  + Created Brand: ${bName}`);
      } else {
        console.log(`  ! Brand creation failed for ${bName}:`, created.data);
      }
    } else {
      console.log(`  = Brand exists: ${bName}`);
    }
  }

  // 4. Create 60 Canonical Products
  console.log('\n📦 Creating Canonical Products...');
  const existingProdRes = await getJson('/products?size=100');
  const existingProducts = existingProdRes.data?.content || (Array.isArray(existingProdRes.data) ? existingProdRes.data : []);
  const productTitleMap = new Set(existingProducts.map(p => p.name.toLowerCase()));

  const PRODUCTS_CATALOG = [
    // Laptops
    {
      name: 'MacBook Pro 16" M3 Max',
      category: 'Laptops & Ultrabooks',
      brand: 'Apple',
      description: 'Supercharged by M3 Max with 16-core CPU, 40-core GPU, 36GB Unified Memory, and stunning Liquid Retina XDR display.',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
      basePrice: 349900,
      tags: ['laptop', 'macbook', 'apple', 'm3', 'creative', 'retina'],
      specs: [{ key: 'Processor', value: 'Apple M3 Max' }, { key: 'RAM', value: '36GB Unified' }, { key: 'Storage', value: '1TB SSD' }, { key: 'Display', value: '16.2-inch Liquid Retina XDR' }]
    },
    {
      name: 'Dell XPS 15 9530',
      category: 'Laptops & Ultrabooks',
      brand: 'Dell',
      description: 'Precision-crafted aluminum chassis featuring Intel Core i9-13900H, RTX 4070, and 3.5K OLED touch display.',
      imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80',
      basePrice: 224990,
      tags: ['laptop', 'dell', 'oled', 'rtx4070', 'intel', 'windows'],
      specs: [{ key: 'Processor', value: 'Intel Core i9-13900H' }, { key: 'GPU', value: 'NVIDIA RTX 4070 8GB' }, { key: 'RAM', value: '32GB DDR5' }, { key: 'Storage', value: '1TB NVMe SSD' }]
    },
    {
      name: 'Lenovo ThinkPad X1 Carbon Gen 11',
      category: 'Laptops & Ultrabooks',
      brand: 'Lenovo',
      description: 'Ultralight business flagship with carbon-fiber weave top cover, Intel Evo Core i7, and legendary ThinkPad keyboard.',
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
      basePrice: 174990,
      tags: ['laptop', 'thinkpad', 'lenovo', 'business', 'ultralight'],
      specs: [{ key: 'Weight', value: '1.12 kg' }, { key: 'Processor', value: 'Intel Core i7-1365U' }, { key: 'RAM', value: '16GB LPDDR5' }, { key: 'Battery', value: 'Up to 14 Hours' }]
    },
    {
      name: 'ASUS ROG Zephyrus G16 (2024)',
      category: 'Laptops & Ultrabooks',
      brand: 'ASUS',
      description: 'Slim gaming powerhouse with 2.5K 240Hz ROG Nebula OLED display, Intel Core Ultra 9, and GeForce RTX 4080.',
      imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80',
      basePrice: 269990,
      tags: ['gaming', 'asus', 'rog', 'oled', 'rtx4080', '240hz'],
      specs: [{ key: 'Display', value: '16" 2.5K 240Hz OLED' }, { key: 'Processor', value: 'Intel Core Ultra 9 185H' }, { key: 'GPU', value: 'NVIDIA RTX 4080 12GB' }, { key: 'RAM', value: '32GB LPDDR5X' }]
    },
    {
      name: 'HP Spectre x360 14 2-in-1',
      category: 'Laptops & Ultrabooks',
      brand: 'HP',
      description: 'Convertible touchscreen ultrabook with Intel Core Ultra 7, 2.8K 120Hz OLED, and 9MP AI camera.',
      imageUrl: 'https://images.unsplash.com/photo-1544731612-de7f96afe55f?w=800&auto=format&fit=crop&q=80',
      basePrice: 154990,
      tags: ['hp', 'spectre', '2in1', 'oled', 'touchscreen', 'ultrabook'],
      specs: [{ key: 'Form Factor', value: '2-in-1 Convertible' }, { key: 'Display', value: '14" 2.8K OLED Touch' }, { key: 'Processor', value: 'Intel Core Ultra 7 155H' }, { key: 'RAM', value: '16GB LPDDR5X' }]
    },

    // Smartphones
    {
      name: 'iPhone 15 Pro Max 256GB',
      category: 'Smartphones & Foldables',
      brand: 'Apple',
      description: 'Forged in titanium with aerospace-grade durability, revolutionary A17 Pro chip, Action button, and 5x optical zoom camera.',
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
      basePrice: 148900,
      tags: ['smartphone', 'apple', 'iphone', 'titanium', 'a17pro', '5g'],
      specs: [{ key: 'Chassis', value: 'Grade 5 Titanium' }, { key: 'Chipset', value: 'A17 Pro Bionic' }, { key: 'Camera', value: '48MP + 12MP 5x Telephoto' }, { key: 'Display', value: '6.7" Super Retina XDR ProMotion' }]
    },
    {
      name: 'Samsung Galaxy S24 Ultra 5G',
      category: 'Smartphones & Foldables',
      brand: 'Samsung',
      description: 'Galaxy AI is here. 200MP camera with Quad Telephoto, Snapdragon 8 Gen 3 for Galaxy, and built-in S Pen.',
      imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80',
      basePrice: 129999,
      tags: ['samsung', 'galaxy', 's24ultra', 'ai', 'spen', '200mp'],
      specs: [{ key: 'Camera', value: '200MP Main + 50MP Periscope' }, { key: 'Chip', value: 'Snapdragon 8 Gen 3' }, { key: 'Display', value: '6.8" Dynamic AMOLED 2X 2600 nits' }, { key: 'Stylus', value: 'Embedded S Pen' }]
    },
    {
      name: 'Google Pixel 8 Pro 128GB',
      category: 'Smartphones & Foldables',
      brand: 'Google',
      description: 'The all-pro phone engineered by Google. Features Google Tensor G3, advanced AI photo editing, and temperature sensor.',
      imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
      basePrice: 89999,
      tags: ['pixel', 'google', 'tensor', 'camera', 'android14', 'pure'],
      specs: [{ key: 'Chipset', value: 'Google Tensor G3' }, { key: 'Camera', value: '50MP + 48MP Ultrawide + 48MP Telephoto' }, { key: 'Display', value: '6.7" Super Actua OLED 120Hz' }, { key: 'OS Support', value: '7 Years OS Updates' }]
    },
    {
      name: 'OnePlus 12 5G (16GB RAM, 512GB)',
      category: 'Smartphones & Foldables',
      brand: 'OnePlus',
      description: '4th Gen Hasselblad Camera System, 5400mAh battery with 100W SUPERVOOC charging, and Snapdragon 8 Gen 3.',
      imageUrl: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop&q=80',
      basePrice: 69999,
      tags: ['oneplus', 'hasselblad', 'fastcharge', '100w', 'snapdragon8gen3'],
      specs: [{ key: 'Charging', value: '100W Wired + 50W Wireless' }, { key: 'Battery', value: '5400 mAh Dual-Cell' }, { key: 'Display', value: '2K 120Hz ProXDR with Aqua Touch' }, { key: 'RAM', value: '16GB LPDDR5X' }]
    },
    {
      name: 'Samsung Galaxy Z Fold 5 512GB',
      category: 'Smartphones & Foldables',
      brand: 'Samsung',
      description: 'Unfold an expansive 7.6-inch screen for PC-like multitasking in your pocket. Flex Hinge design and water resistance.',
      imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
      basePrice: 164999,
      tags: ['foldable', 'samsung', 'zfold5', 'multitasking', 'flexhinge'],
      specs: [{ key: 'Main Display', value: '7.6" QXGA+ Dynamic AMOLED 2X' }, { key: 'Cover Display', value: '6.2" HD+ Dynamic AMOLED 2X' }, { key: 'Water Resistance', value: 'IPX8' }, { key: 'Processor', value: 'Snapdragon 8 Gen 2 for Galaxy' }]
    },
    {
      name: 'Nothing Phone (2) 256GB',
      category: 'Smartphones & Foldables',
      brand: 'Nothing',
      description: 'Iconic transparent design with customizable Glyph Interface, dual 50MP Sony sensors, and Snapdragon 8+ Gen 1.',
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
      basePrice: 39999,
      tags: ['nothing', 'glyph', 'transparent', 'oled', 'design'],
      specs: [{ key: 'Interface', value: 'Glyph Interface LED Matrix' }, { key: 'Display', value: '6.7" Flexible LTPO OLED 120Hz' }, { key: 'Camera', value: 'Dual 50MP Sony IMX890' }, { key: 'Processor', value: 'Snapdragon 8+ Gen 1' }]
    },

    // Audio & Headphones
    {
      name: 'Sony WH-1000XM5 Wireless Headphones',
      category: 'Audio & Headphones',
      brand: 'Sony',
      description: 'Industry-leading noise canceling with two processors and 8 microphones. Hi-Res Audio wireless and 30-hour battery.',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      basePrice: 29990,
      tags: ['audio', 'sony', 'anc', 'wireless', 'hires', 'overear'],
      specs: [{ key: 'Noise Cancellation', value: 'Dual Processor V1 + QN1' }, { key: 'Battery Life', value: 'Up to 30 Hours' }, { key: 'Codecs', value: 'LDAC, AAC, SBC' }, { key: 'Microphones', value: '8 Beamforming Mics' }]
    },
    {
      name: 'Bose QuietComfort Ultra Headphones',
      category: 'Audio & Headphones',
      brand: 'Bose',
      description: 'Groundbreaking spatialized audio for more immersive listening. World-class active noise cancellation and CustomTune tech.',
      imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
      basePrice: 35900,
      tags: ['bose', 'anc', 'spatial', 'comfort', 'premium', 'audio'],
      specs: [{ key: 'Audio', value: 'Bose Immersive Spatial Audio' }, { key: 'Modes', value: 'Quiet, Aware, and Immersion' }, { key: 'Battery', value: '24 Hours playback' }, { key: 'Calibration', value: 'CustomTune Technology' }]
    },
    {
      name: 'Apple AirPods Pro (2nd Gen, USB-C)',
      category: 'Audio & Headphones',
      brand: 'Apple',
      description: 'Up to 2x more Active Noise Cancellation, Adaptive Audio, Personalized Spatial Audio with dynamic head tracking, and USB-C.',
      imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80',
      basePrice: 24900,
      tags: ['apple', 'airpods', 'tws', 'anc', 'usbc', 'mag-safe'],
      specs: [{ key: 'Chipset', value: 'Apple H2 Audio Processor' }, { key: 'Case', value: 'MagSafe USB-C with Speaker & U1' }, { key: 'Resistance', value: 'IP54 Dust & Water Resistant' }, { key: 'Audio', value: 'Adaptive Audio & Transparency' }]
    },
    {
      name: 'Sennheiser Momentum 4 Wireless',
      category: 'Audio & Headphones',
      brand: 'Sennheiser',
      description: 'Audiophile-inspired sound signature with Sennheiser 42mm transducer system and an incredible 60-hour battery life.',
      imageUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
      basePrice: 26990,
      tags: ['sennheiser', 'audiophile', '60hr', 'momentum', 'sound'],
      specs: [{ key: 'Battery Life', value: 'Class-leading 60 Hours' }, { key: 'Driver', value: '42mm Audiophile Transducer' }, { key: 'Codecs', value: 'aptX Adaptive, AAC, SBC' }, { key: 'Equalizer', value: 'Built-in 5-band EQ' }]
    },
    {
      name: 'Sony WF-1000XM5 True Wireless Earbuds',
      category: 'Audio & Headphones',
      brand: 'Sony',
      description: 'The best noise canceling earbuds with Dynamic Driver X, Bone Conduction voice pickup sensors, and AI DNN noise reduction.',
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
      basePrice: 21990,
      tags: ['sony', 'earbuds', 'tws', 'anc', 'ldac', 'compact'],
      specs: [{ key: 'Driver', value: '8.4mm Dynamic Driver X' }, { key: 'Noise Cancellation', value: 'Integrated Processor V2' }, { key: 'Microphone', value: 'Bone Conduction Sensors' }, { key: 'Water Resistance', value: 'IPX4' }]
    },

    // Smartwatches & Wearables
    {
      name: 'Apple Watch Ultra 2 (GPS + Cellular, 49mm)',
      category: 'Smartwatches & Wearables',
      brand: 'Apple',
      description: 'The most capable and rugged Apple Watch with 3000 nits display, precision dual-frequency GPS, and S9 SiP chip.',
      imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
      basePrice: 89900,
      tags: ['applewatch', 'ultra2', 'titanium', 'gps', 'cellular', 'diving'],
      specs: [{ key: 'Case', value: '49mm Aerospace Titanium' }, { key: 'Display Brightness', value: '3,000 Nits Sapphire Crystal' }, { key: 'Battery', value: 'Up to 72 Hours in Low Power' }, { key: 'Water Resistance', value: '100m Dive Certified EN13319' }]
    },
    {
      name: 'Samsung Galaxy Watch 6 Classic (47mm)',
      category: 'Smartwatches & Wearables',
      brand: 'Samsung',
      description: 'The iconic rotating bezel returns. Advanced sleep coaching, Body Composition BIA sensor, and sapphire crystal glass.',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      basePrice: 36999,
      tags: ['samsung', 'smartwatch', 'rotatingbezel', 'ecg', 'sleep'],
      specs: [{ key: 'Bezel', value: 'Physical Rotating Bezel' }, { key: 'Glass', value: 'Sapphire Crystal Super AMOLED' }, { key: 'Health', value: 'ECG, Blood Pressure, BIA' }, { key: 'Connectivity', value: 'LTE / Bluetooth 5.3' }]
    },
    {
      name: 'Sony SmartBand Pro Fitness Tracker',
      category: 'Smartwatches & Wearables',
      brand: 'Sony',
      description: 'Sleek health band with continuous SpO2 monitoring, stress analytics, built-in GPS, and 14-day standby.',
      imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
      basePrice: 8990,
      tags: ['fitness', 'tracker', 'sony', 'health', 'heartrate'],
      specs: [{ key: 'Battery', value: '14 Days' }, { key: 'Sensors', value: 'SpO2, Heart Rate, Accelerometer' }, { key: 'Waterproof', value: '5 ATM' }, { key: 'Weight', value: '25 grams' }]
    },

    // Gaming Consoles & Gear
    {
      name: 'Sony PlayStation 5 Slim (1TB Edition)',
      category: 'Gaming Consoles & Gear',
      brand: 'Sony',
      description: 'Play Has No Limits. Ultra-high speed SSD, ray tracing, Tempest 3D AudioTech, and immersive DualSense haptic feedback.',
      imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80',
      basePrice: 54990,
      tags: ['gaming', 'ps5', 'sony', 'console', '4k', 'dualsense'],
      specs: [{ key: 'Storage', value: '1TB Custom High-Speed NVMe SSD' }, { key: 'GPU', value: '10.3 TFLOPs AMD RDNA 2' }, { key: 'Resolution', value: 'Up to 4K 120Hz / 8K Support' }, { key: 'Controller', value: 'DualSense Wireless Included' }]
    },
    {
      name: 'Microsoft Xbox Series X (1TB)',
      category: 'Gaming Consoles & Gear',
      brand: 'Microsoft',
      description: 'The fastest, most powerful Xbox ever. 12 teraflops of raw graphic processing power, DirectX Raytracing, and Quick Resume.',
      imageUrl: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&auto=format&fit=crop&q=80',
      basePrice: 55990,
      tags: ['xbox', 'microsoft', 'gaming', 'seriesx', '4k', 'gamepass'],
      specs: [{ key: 'Processing Power', value: '12 TFLOPs RDNA 2' }, { key: 'Memory', value: '16GB GDDR6' }, { key: 'Feature', value: 'Quick Resume for Multiple Titles' }, { key: 'Audio', value: 'Dolby Atmos & Dolby Vision' }]
    },
    {
      name: 'ASUS ROG Ally Z1 Extreme Gaming Handheld',
      category: 'Gaming Consoles & Gear',
      brand: 'ASUS',
      description: 'Full Windows 11 gaming in the palm of your hand. Powered by AMD Ryzen Z1 Extreme, 120Hz FHD display, and dual fans.',
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      basePrice: 59990,
      tags: ['handheld', 'rog', 'asus', 'pcgaming', 'steam', 'ryzen'],
      specs: [{ key: 'APU', value: 'AMD Ryzen Z1 Extreme (8-core/16-thread)' }, { key: 'Display', value: '7" FHD 120Hz 500 nits Touch' }, { key: 'RAM', value: '16GB LPDDR5' }, { key: 'OS', value: 'Windows 11 Home' }]
    },
    {
      name: 'Sony DualSense Edge Wireless Controller',
      category: 'Gaming Consoles & Gear',
      brand: 'Sony',
      description: 'Ultra-customizable pro controller with swappable stick modules, remappable back buttons, and adjustable trigger stops.',
      imageUrl: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&auto=format&fit=crop&q=80',
      basePrice: 18990,
      tags: ['controller', 'ps5', 'pro', 'dualsense', 'esports'],
      specs: [{ key: 'Customization', value: 'Replaceable Stick Modules' }, { key: 'Back Buttons', value: '2 Swappable Sets (Lever & Dome)' }, { key: 'Trigger Stops', value: '3-position Trigger Locks' }, { key: 'Case', value: 'Braided Cable & Carrying Case' }]
    },

    // Monitors & Displays
    {
      name: 'LG UltraGear 32" OLED 240Hz 4K Gaming Monitor',
      category: 'Monitors & Displays',
      brand: 'LG',
      description: 'World’s first Dual-Hz monitor: 4K 240Hz or FHD 480Hz. 0.03ms response time, Pixel Sound, and DisplayPort 2.1.',
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
      basePrice: 139999,
      tags: ['monitor', 'lg', 'oled', '4k', '240hz', 'ultragear'],
      specs: [{ key: 'Panel', value: '31.5" 4K WOLED Anti-Glare' }, { key: 'Refresh Rate', value: '4K @ 240Hz / FHD @ 480Hz' }, { key: 'Response Time', value: '0.03ms GtG' }, { key: 'Color Gamut', value: 'DCI-P3 98.5%' }]
    },
    {
      name: 'Dell UltraSharp 34" Curved USB-C Hub Monitor',
      category: 'Monitors & Displays',
      brand: 'Dell',
      description: 'WQHD 3440x1440 IPS Black technology with 2000:1 contrast ratio, 90W USB-C power delivery, and built-in RJ45 KVM switch.',
      imageUrl: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&auto=format&fit=crop&q=80',
      basePrice: 79990,
      tags: ['ultrawide', 'dell', 'ipsblack', 'productivity', 'usbc'],
      specs: [{ key: 'Curvature', value: '1900R Curved' }, { key: 'Resolution', value: 'WQHD 3440 x 1440' }, { key: 'Contrast', value: '2000:1 IPS Black' }, { key: 'Power Delivery', value: '90W USB-C Charging' }]
    },
    {
      name: 'Samsung Odyssey Neo G9 49" Curved Super Ultrawide',
      category: 'Monitors & Displays',
      brand: 'Samsung',
      description: 'Quantum Mini-LED dual QHD (5120x1440) 240Hz with 1000R curvature, Quantum HDR 2000, and CoreSync lighting.',
      imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&auto=format&fit=crop&q=80',
      basePrice: 179999,
      tags: ['superultrawide', 'samsung', 'miniled', '240hz', 'odyssey'],
      specs: [{ key: 'Screen Size', value: '49-inch 32:9 Super Ultrawide' }, { key: 'Backlight', value: '2048 Local Dimming Zones Mini-LED' }, { key: 'Peak Brightness', value: '2000 Nits Peak HDR' }, { key: 'Refresh Rate', value: '240Hz 1ms' }]
    },

    // PC Components & GPUs
    {
      name: 'Nvidia GeForce RTX 4090 Founders Edition 24GB',
      category: 'PC Components & GPUs',
      brand: 'Nvidia',
      description: 'The ultimate GPU for gamers and creators. Powered by Ada Lovelace architecture, DLSS 3, and 24GB of ultra-fast G6X memory.',
      imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80',
      basePrice: 179900,
      tags: ['gpu', 'nvidia', 'rtx4090', 'ada', 'dlss3', '24gb'],
      specs: [{ key: 'CUDA Cores', value: '16,384' }, { key: 'VRAM', value: '24GB GDDR6X 384-bit' }, { key: 'TDP', value: '450 Watts' }, { key: 'Ray Tracing', value: '3rd Gen RT Cores' }]
    },
    {
      name: 'AMD Ryzen 9 7950X3D Processor',
      category: 'PC Components & GPUs',
      brand: 'AMD',
      description: 'The pinnacle of desktop gaming CPUs. 16 cores, 32 threads, and 144MB of on-chip 3D V-Cache on the AM5 platform.',
      imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80',
      basePrice: 59990,
      tags: ['cpu', 'amd', 'ryzen', '7950x3d', 'am5', '3dvcache'],
      specs: [{ key: 'Cores / Threads', value: '16 Cores / 32 Threads' }, { key: 'Max Boost', value: 'Up to 5.7 GHz' }, { key: 'L3 Cache', value: '128MB 3D V-Cache' }, { key: 'Socket', value: 'Socket AM5' }]
    },
    {
      name: 'Intel Core i9-14900K Desktop Processor',
      category: 'PC Components & GPUs',
      brand: 'Intel',
      description: '24 cores (8 Performance + 16 Efficient), 32 threads, up to 6.0 GHz with Thermal Velocity Boost for bleeding-edge computing.',
      imageUrl: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&auto=format&fit=crop&q=80',
      basePrice: 52990,
      tags: ['intel', 'corei9', '14900k', 'lga1700', 'overclocking'],
      specs: [{ key: 'Cores', value: '24 (8P + 16E)' }, { key: 'Max Clock', value: '6.0 GHz TVB' }, { key: 'Socket', value: 'LGA1700' }, { key: 'PCIe', value: 'PCIe 5.0 Support' }]
    },
    {
      name: 'Corsair Dominator Titanium RGB DDR5 64GB (2x32GB)',
      category: 'PC Components & GPUs',
      brand: 'Corsair',
      description: 'Precision forged aluminum heatsinks with swappable top bars, patented DHX cooling, and 6600MHz CL32 speed.',
      imageUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80',
      basePrice: 28990,
      tags: ['ram', 'corsair', 'ddr5', 'dominator', 'rgb'],
      specs: [{ key: 'Capacity', value: '64GB (2 x 32GB)' }, { key: 'Speed', value: 'DDR5-6600 MHz' }, { key: 'Timing', value: 'CL32-39-39-76' }, { key: 'Profile', value: 'Intel XMP 3.0 & AMD EXPO' }]
    },

    // Cameras & Photography
    {
      name: 'Sony Alpha 7 IV Full-Frame Mirrorless Camera',
      category: 'Cameras & Photography',
      brand: 'Sony',
      description: '33MP full-frame Exmor R CMOS sensor, 4K 60p 10-bit 4:2:2 video, S-Cinetone, and cutting-edge Real-time Eye AF.',
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
      basePrice: 209990,
      tags: ['camera', 'sony', 'a7iv', 'mirrorless', '4k60', 'fullframe'],
      specs: [{ key: 'Sensor', value: '33MP Full-Frame Exmor R' }, { key: 'Video', value: '4K 60p 10-Bit 4:2:2' }, { key: 'Stabilization', value: '5-Axis Optical In-Body' }, { key: 'Autofocus', value: '759 Phase-Detection Points' }]
    },
    {
      name: 'Canon EOS R6 Mark II Mirrorless Camera',
      category: 'Cameras & Photography',
      brand: 'Canon',
      description: '24.2MP full-frame sensor capable of 40 fps continuous electronic shooting, 6K oversampled 4K 60p video, and Dual Pixel CMOS AF II.',
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80',
      basePrice: 199990,
      tags: ['canon', 'eosr6', 'mirrorless', 'photography', '40fps'],
      specs: [{ key: 'Burst Shooting', value: 'Up to 40 fps Electronic' }, { key: 'Sensor', value: '24.2MP Full-Frame CMOS' }, { key: 'Autofocus', value: 'Dual Pixel AF II with AI Subject Detect' }, { key: 'Video', value: '6K RAW HDMI Output' }]
    },
    {
      name: 'Sony FE 24-70mm f/2.8 GM II Zoom Lens',
      category: 'Cameras & Photography',
      brand: 'Sony',
      description: 'The world’s lightest f/2.8 standard zoom lens with four XD Linear Motors, stunning bokeh, and extreme corner-to-corner sharpness.',
      imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&auto=format&fit=crop&q=80',
      basePrice: 184990,
      tags: ['lens', 'sony', 'gmaster', '2470mm', 'f28'],
      specs: [{ key: 'Aperture', value: 'Constant f/2.8' }, { key: 'Focal Length', value: '24-70mm' }, { key: 'Weight', value: '695 grams' }, { key: 'Filter Diameter', value: '82mm' }]
    },

    // Smart Home & IoT
    {
      name: 'Google Nest Hub Max with Google Assistant',
      category: 'Smart Home & IoT',
      brand: 'Google',
      description: '10-inch HD smart display with built-in Nest Cam, stereo speakers with subwoofers, and facial recognition Face Match.',
      imageUrl: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&auto=format&fit=crop&q=80',
      basePrice: 19999,
      tags: ['smarthome', 'google', 'nest', 'assistant', 'camera'],
      specs: [{ key: 'Screen', value: '10" HD Touchscreen' }, { key: 'Camera', value: '6.5MP Nest Cam with 127° FoV' }, { key: 'Audio', value: '2x 18mm Tweeters + 75mm Subwoofer' }, { key: 'Connectivity', value: 'Wi-Fi, Bluetooth 5.0, Thread' }]
    },
    {
      name: 'Sony Bravia Cam for Smart TV',
      category: 'Smart Home & IoT',
      brand: 'Sony',
      description: 'Interactive smart TV camera that optimizes picture and sound based on where you sit in the room, with gesture controls.',
      imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
      basePrice: 14990,
      tags: ['sony', 'tv', 'bravia', 'camera', 'smarthome'],
      specs: [{ key: 'Resolution', value: 'Full HD 1080p' }, { key: 'Features', value: 'Ambient Optimization Pro' }, { key: 'Privacy', value: 'Physical Camera Shutter Switch' }, { key: 'Interface', value: 'Magnetic USB Mount' }]
    },

    // Tablets & E-Readers
    {
      name: 'iPad Pro 13" M4 (OLED, 256GB)',
      category: 'Tablets & E-Readers',
      brand: 'Apple',
      description: 'Impossibly thin design powered by revolutionary M4 chip with Ultra Retina XDR Tandem OLED display and Apple Pencil Pro support.',
      imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
      basePrice: 129900,
      tags: ['ipad', 'apple', 'm4', 'oled', 'tablet', 'pencil'],
      specs: [{ key: 'Thickness', value: '5.1 mm (Thinnest Apple Product)' }, { key: 'Display', value: '13" Tandem OLED 1000 nits' }, { key: 'Chipset', value: 'Apple M4 with 38 TOPS NPU' }, { key: 'Pencil', value: 'Supports Apple Pencil Pro' }]
    },
    {
      name: 'Samsung Galaxy Tab S9 Ultra (14.6" 512GB)',
      category: 'Tablets & E-Readers',
      brand: 'Samsung',
      description: 'Huge 14.6-inch Dynamic AMOLED 2X display, IP68 water resistance for both tablet and S Pen, and Snapdragon 8 Gen 2.',
      imageUrl: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop&q=80',
      basePrice: 119999,
      tags: ['tablet', 'samsung', 'tabs9', 'spen', 'amoled'],
      specs: [{ key: 'Screen', value: '14.6" Dynamic AMOLED 2X 120Hz' }, { key: 'Durability', value: 'IP68 Water & Dust Resistant' }, { key: 'Audio', value: 'Quad AKG Speakers Dolby Atmos' }, { key: 'Battery', value: '11,200 mAh 45W Fast Charge' }]
    },

    // Computer Accessories
    {
      name: 'Logitech MX Master 3S Wireless Mouse',
      category: 'Computer Accessories',
      brand: 'Logitech',
      description: 'An icon remastered: 8K DPI any-surface tracking, quiet clicks, and MagSpeed electromagnetic scrolling wheel.',
      imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
      basePrice: 8995,
      tags: ['mouse', 'logitech', 'mxmaster', 'ergonomic', 'productivity'],
      specs: [{ key: 'Sensor', value: 'Darkfield 8000 DPI High Precision' }, { key: 'Scroll Wheel', value: 'MagSpeed Electromagnetic 1000 lines/sec' }, { key: 'Clicks', value: '90% Quieter Quiet Click' }, { key: 'Battery', value: 'Up to 70 days on full charge' }]
    },
    {
      name: 'Logitech MX Mechanical Wireless Keyboard',
      category: 'Computer Accessories',
      brand: 'Logitech',
      description: 'Low-profile mechanical tactile quiet switches, smart dual-color key illumination, and multi-device Easy-Switch pairing.',
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      basePrice: 15495,
      tags: ['keyboard', 'mechanical', 'logitech', 'wireless', 'backlit'],
      specs: [{ key: 'Switches', value: 'Low Profile Tactile Quiet' }, { key: 'Backlighting', value: 'Smart Proximity-sensing Ambient White' }, { key: 'Connectivity', value: 'Bluetooth & Logi Bolt Receiver' }, { key: 'Layout', value: 'Full Size with Numpad' }]
    },
    {
      name: 'Corsair K100 RGB Optical-Mechanical Keyboard',
      category: 'Computer Accessories',
      brand: 'Corsair',
      description: 'Flagship mechanical gaming keyboard with Corsair OPX optical switches, 44-zone RGB LightEdge, and 4000Hz hyper-polling.',
      imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80',
      basePrice: 21990,
      tags: ['corsair', 'keyboard', 'gaming', 'rgb', 'optical'],
      specs: [{ key: 'Switches', value: 'Corsair OPX Optical-Mechanical 1.0mm' }, { key: 'Polling Rate', value: '4000Hz AXON Hyper-Processing' }, { key: 'Dial', value: 'iCUE Multi-Function Control Wheel' }, { key: 'Wrist Rest', value: 'Magnetic Plush Memory Foam' }]
    },

    // Storage & Backup
    {
      name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
      category: 'Storage & Backup',
      brand: 'Samsung',
      description: 'Blistering sequential read/write speeds up to 7450/6900 MB/s. Built-in heatsink variant optimized for PlayStation 5 and PC.',
      imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80',
      basePrice: 18499,
      tags: ['storage', 'ssd', 'samsung', 'nvme', 'pcie4', 'ps5'],
      specs: [{ key: 'Read Speed', value: '7,450 MB/s' }, { key: 'Write Speed', value: '6,900 MB/s' }, { key: 'Interface', value: 'PCIe 4.0 x4, NVMe 2.0' }, { key: 'Endurance', value: '1200 TBW' }]
    },
    {
      name: 'Samsung T9 Portable SSD 2TB (USB 3.2 Gen 2x2)',
      category: 'Storage & Backup',
      brand: 'Samsung',
      description: 'Pocket-sized rugged external drive delivering transfer speeds up to 2000 MB/s with drop resistance up to 3 meters.',
      imageUrl: 'https://images.unsplash.com/photo-1568843977320-cf68a183d8a5?w=800&auto=format&fit=crop&q=80',
      basePrice: 21999,
      tags: ['external', 'ssd', 'portable', 'samsung', 'fast', 'rugged'],
      specs: [{ key: 'Interface', value: 'USB 3.2 Gen 2x2 (20 Gbps)' }, { key: 'Speed', value: 'Up to 2,000 MB/s Read & Write' }, { key: 'Durability', value: '3-Meter Drop Resistant with Carbon Finish' }, { key: 'Encryption', value: 'AES 256-bit Hardware Encryption' }]
    },
  ];

  const createdProducts = [];

  for (const p of PRODUCTS_CATALOG) {
    const catObj = categoryMap.get(p.category.toLowerCase());
    const brandObj = brandMap.get(p.brand.toLowerCase());

    if (!catObj || !brandObj) {
      console.log(`⚠️ Missing category or brand for product: ${p.name}`);
      continue;
    }

    if (productTitleMap.has(p.name.toLowerCase())) {
      console.log(`= Product already exists: ${p.name}`);
      const existingObj = existingProducts.find(ep => ep.name.toLowerCase() === p.name.toLowerCase());
      if (existingObj) createdProducts.push({ ...existingObj, basePrice: p.basePrice });
      continue;
    }

    const payload = {
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      categoryId: catObj.id,
      brandId: brandObj.id,
      status: 'ACTIVE',
      tags: p.tags,
      specifications: p.specs,
    };

    const res = await postJson('/products', payload, adminAuth.token);
    if (res.ok) {
      console.log(`  + Created Product: ${p.name} (ID: ${res.data.id})`);
      createdProducts.push({ ...res.data, basePrice: p.basePrice });
      productTitleMap.add(p.name.toLowerCase());
    } else {
      console.log(`  ! Failed to create product ${p.name}:`, res.data);
    }
  }

  console.log(`\n✨ Active Canonical Catalog Products Available: ${createdProducts.length}`);

  // 5. Create 50 - 100 Competing Seller Listings
  console.log('\n🏪 Creating Competing Seller Listings across the 4 Seller Profiles...');
  let totalListingsCreated = 0;

  for (let i = 0; i < createdProducts.length; i++) {
    const prod = createdProducts[i];
    const basePrice = prod.basePrice || 25000;

    // Fetch existing listings for this product to avoid duplicates
    const existingListingsRes = await getJson(`/listings/product/${prod.id}`);
    const existingListings = Array.isArray(existingListingsRes.data) ? existingListingsRes.data : [];

    // We want 2 to 3 competing sellers per product
    const sellerCountToAssign = (i % 2 === 0) ? 3 : 2;

    for (let sIdx = 0; sIdx < sellerCountToAssign; sIdx++) {
      const seller = sellerAuths[(i + sIdx) % sellerAuths.length];

      // Check if this seller already listed this product
      const alreadyListed = existingListings.some(l => l.sellerId === seller.userId);
      if (alreadyListed) {
        continue;
      }

      // Vary price and condition
      let priceMultiplier = 1.0;
      let condition = 'NEW';
      let stock = 15 + ((i * 3 + sIdx * 5) % 35);

      if (sIdx === 0) {
        // Lowest price offer (Buy Box winner)
        priceMultiplier = 0.94 - ((i % 5) * 0.01);
        condition = 'NEW';
      } else if (sIdx === 1) {
        // Standard offer
        priceMultiplier = 1.0 + ((i % 4) * 0.02);
        condition = 'NEW';
      } else {
        // Refurbished or Value pick
        priceMultiplier = 0.82;
        condition = (i % 2 === 0) ? 'REFURBISHED' : 'USED';
        stock = 5 + (i % 8);
      }

      const calculatedPrice = Math.round(basePrice * priceMultiplier);

      const listingPayload = {
        productId: prod.id,
        sellingPrice: calculatedPrice,
        currency: 'INR',
        stockQuantity: stock,
        condition,
      };

      const listRes = await postJson('/listings', listingPayload, seller.token);
      if (listRes.ok) {
        totalListingsCreated++;
        console.log(`  + [${seller.sellerInfo.name}] listed "${prod.name}" @ ₹${calculatedPrice.toLocaleString()} (${condition}, Stock: ${stock})`);
      } else {
        console.log(`  ! Failed listing by ${seller.sellerInfo.email}:`, listRes.data);
      }
    }
  }

  console.log(`\n🎉 New Seller Listings Created in this run: ${totalListingsCreated}`);

  // 6. User Creates Orders (Lifecycle Simulation)
  console.log('\n🛒 Simulating User Cart Checkout & Orders...');
  
  // Pick 3 active listings to create real orders
  const allActiveListings = [];
  for (const prod of createdProducts.slice(0, 5)) {
    const listRes = await getJson(`/listings/product/${prod.id}`);
    const lists = Array.isArray(listRes.data) ? listRes.data : [];
    const active = lists.filter(l => l.status === 'ACTIVE' && l.stockQuantity > 0);
    if (active.length > 0) {
      allActiveListings.push({ product: prod, listing: active[0] });
    }
  }

  if (allActiveListings.length > 0) {
    // Add item to cart
    const pick1 = allActiveListings[0];
    const pick2 = allActiveListings.length > 1 ? allActiveListings[1] : pick1;

    console.log(`  Adding "${pick1.product.name}" to cart...`);
    await postJson('/cart/items', { productId: pick1.product.id, listingId: pick1.listing.id, quantity: 1 }, userAuth.token);

    if (pick2 && pick2.listing.id !== pick1.listing.id) {
      console.log(`  Adding "${pick2.product.name}" to cart...`);
      await postJson('/cart/items', { productId: pick2.product.id, listingId: pick2.listing.id, quantity: 1 }, userAuth.token);
    }

    // Checkout
    console.log('  Executing checkout for user order...');
    const checkoutPayload = {
      shippingAddress: {
        fullName: 'Sahil Sharma',
        phone: '+91 9876543210',
        line1: 'Flat 402, HighTech Residency, Cyber City',
        line2: 'Sector 62, Near Metro Station',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560100',
        countryCode: 'IN',
      },
      customerNote: 'Please deliver on weekday between 10am and 5pm. Fragile tech gear.',
      currencyCode: 'INR',
    };

    const orderRes = await postJson('/orders/checkout', checkoutPayload, userAuth.token);
    if (orderRes.ok) {
      console.log(`  ✅ Order placed successfully! Order ID: ${orderRes.data.id}, Order Number: ${orderRes.data.orderNumber}, Total: ₹${orderRes.data.grandTotal}`);
      
      // Update status to CONFIRMED
      const sellerForFirstItem = sellerAuths.find(s => s.userId === pick1.listing.sellerId) || sellerAuths[0];
      await patchJson(`/orders/${orderRes.data.id}/status`, {
        status: 'CONFIRMED',
        reason: 'Payment verified and merchant confirmed fulfillment',
      }, sellerForFirstItem.token);
      console.log(`  ✅ Updated Order status to CONFIRMED by seller`);
    } else {
      console.log('  ! Checkout notice/response:', orderRes.data);
    }
  }

  console.log('\n==========================================');
  console.log('🏁 Marketplace Seeding Completed Successfully!');
  console.log('==========================================\n');
}

seed().catch(err => {
  console.error('❌ Seeding Error:', err);
  process.exit(1);
});
