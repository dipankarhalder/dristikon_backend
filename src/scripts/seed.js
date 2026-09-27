const mongoose = require('mongoose');
const User = require('../models/user.model');
const Consumer = require('../models/consumer.model');
const Category = require('../models/category.model');
const Event = require('../models/event.model');
const Transaction = require('../models/transaction.model');
const { envConfig } = require('../config');
const { cache } = require('../utils');

const seedUsers = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@dristikon.com', password: 'Password123', phone: '9820011221', role: 'super_admin', address: { area: 'Bandra West', landmark: 'Near Bandstand', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' } },
  { name: 'Priya Patel', email: 'priya.patel@dristikon.com', password: 'Password123', phone: '9820011222', role: 'collaborator', address: { area: 'Navrangpura', landmark: 'Opposite University', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009' } },
  { name: 'Rohan Verma', email: 'rohan.verma@dristikon.com', password: 'Password123', phone: '9820011223', role: 'staff', address: { area: 'Indiranagar', landmark: '100ft Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' } },
  { name: 'Ananya Iyer', email: 'ananya.iyer@dristikon.com', password: 'Password123', phone: '9820011224', role: 'collaborator', address: { area: 'Adyar', landmark: 'Near Gandhi Mandapam', city: 'Chennai', state: 'Tamil Nadu', pincode: '600020' } },
  { name: 'Vikram Malhotra', email: 'vikram.malhotra@dristikon.com', password: 'Password123', phone: '9820011225', role: 'super_admin', address: { area: 'Connaught Place', landmark: 'Inner Circle', city: 'New Delhi', state: 'Delhi', pincode: '110001' } },
  { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@dristikon.com', password: 'Password123', phone: '9820011226', role: 'staff', address: { area: 'Kothrud', landmark: 'Near MIT College', city: 'Pune', state: 'Maharashtra', pincode: '411038' } },
  { name: 'Aditya Sen', email: 'aditya.sen@dristikon.com', password: 'Password123', phone: '9820011227', role: 'collaborator', address: { area: 'Salt Lake Sector 5', landmark: 'Near Webel More', city: 'Kolkata', state: 'West Bengal', pincode: '700091' } },
  { name: 'Neha Reddy', email: 'neha.reddy@dristikon.com', password: 'Password123', phone: '9820011228', role: 'staff', address: { area: 'Banjara Hills', landmark: 'Road No 12', city: 'Hyderabad', state: 'Telangana', pincode: '500034' } },
  { name: 'Kabir Das', email: 'kabir.das@dristikon.com', password: 'Password123', phone: '9820011229', role: 'collaborator', address: { area: 'Aliganj', landmark: 'Near Post Office', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226024' } },
  { name: 'Tanvi Nair', email: 'tanvi.nair@dristikon.com', password: 'Password123', phone: '9820011230', role: 'staff', address: { area: 'Panampilly Nagar', landmark: 'Main Avenue', city: 'Kochi', state: 'Kerala', pincode: '682036' } },
  { name: 'Manish Gupta', email: 'manish.gupta@dristikon.com', password: 'Password123', phone: '9820011231', role: 'super_admin', address: { area: 'Civil Lines', landmark: 'Near High Court', city: 'Jaipur', state: 'Rajasthan', pincode: '302006' } },
  { name: 'Ritu Saxena', email: 'ritu.saxena@dristikon.com', password: 'Password123', phone: '9820011232', role: 'collaborator', address: { area: 'Arera Colony', landmark: 'Sector E6', city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462016' } },
  { name: 'Devendra Joshi', email: 'devendra.joshi@dristikon.com', password: 'Password123', phone: '9820011233', role: 'staff', address: { area: 'Sector 17', landmark: 'Near Plaza', city: 'Chandigarh', state: 'Chandigarh', pincode: '160017' } },
  { name: 'Kavita Chawla', email: 'kavita.chawla@dristikon.com', password: 'Password123', phone: '9820011234', role: 'collaborator', address: { area: 'DLF Phase 4', landmark: 'Galleria Market', city: 'Gurugram', state: 'Haryana', pincode: '122002' } },
  { name: 'Suresh Menon', email: 'suresh.menon@dristikon.com', password: 'Password123', phone: '9820011235', role: 'staff', address: { area: 'Kowdiar', landmark: 'Palace Road', city: 'Thiruvananthapuram', state: 'Kerala', pincode: '695003' } },
  { name: 'Pooja Bhatia', email: 'pooja.bhatia@dristikon.com', password: 'Password123', phone: '9820011236', role: 'collaborator', address: { area: 'Sector 62', landmark: 'Near Electronic City', city: 'Noida', state: 'Uttar Pradesh', pincode: '201309' } },
  { name: 'Harish Rao', email: 'harish.rao@dristikon.com', password: 'Password123', phone: '9820011237', role: 'staff', address: { area: 'Jayalakshmipuram', landmark: 'Near Kalidasa Road', city: 'Mysuru', state: 'Karnataka', pincode: '570012' } },
  { name: 'Divya Singhal', email: 'divya.singhal@dristikon.com', password: 'Password123', phone: '9820011238', role: 'super_admin', address: { area: 'Vastrapur', landmark: 'Near IIM Campus', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015' } },
  { name: 'Arjun Nambiar', email: 'arjun.nambiar@dristikon.com', password: 'Password123', phone: '9820011239', role: 'collaborator', address: { area: 'Marine Drive', landmark: 'Rainbow Hanging Bridge', city: 'Kochi', state: 'Kerala', pincode: '682031' } },
  { name: 'Meera Deshmukh', email: 'meera.deshmukh@dristikon.com', password: 'Password123', phone: '9820011240', role: 'staff', address: { area: 'Dharampeth', landmark: 'Coffee House Square', city: 'Nagpur', state: 'Maharashtra', pincode: '440010' } },
];

const seedConsumers = [
  { name: 'Rajesh Khanna Enterprises', email: 'contact@rajeshkhanna.com', phone: '9900112201', address: { area: 'Nariman Point', landmark: 'Mittal Tower', city: 'Mumbai', state: 'Maharashtra', pincode: '400021' } },
  { name: 'Sunita Mehra Textiles', email: 'sales@sunitamehra.in', phone: '9900112202', address: { area: 'Surat Textile Market', landmark: 'Ring Road', city: 'Surat', state: 'Gujarat', pincode: '395002' } },
  { name: 'Apex Zenith Technologies', email: 'procurement@apexzenith.com', phone: '9900112203', address: { area: 'Whitefield', landmark: 'ITPL Main Gate', city: 'Bengaluru', state: 'Karnataka', pincode: '560066' } },
  { name: 'Kalyan Jewellers & Arts', email: 'events@kalyanarts.org', phone: '9900112204', address: { area: 'T Nagar', landmark: 'Panagal Park', city: 'Chennai', state: 'Tamil Nadu', pincode: '600017' } },
  { name: 'Blue Ridge Hospitality', email: 'operations@blueridge.in', phone: '9900112205', address: { area: 'Hinjawadi Phase 1', landmark: 'Near Infosys Circle', city: 'Pune', state: 'Maharashtra', pincode: '411057' } },
  { name: 'Heritage Heritage Group', email: 'heritage@heritagecorp.co.in', phone: '9900112206', address: { area: 'Park Street', landmark: 'Near Flurys', city: 'Kolkata', state: 'West Bengal', pincode: '700016' } },
  { name: 'Global Logistics Synergy', email: 'support@globallogistics.com', phone: '9900112207', address: { area: 'Cyberabad', landmark: 'HITEC City Phase 2', city: 'Hyderabad', state: 'Telangana', pincode: '500081' } },
  { name: 'Imperial Luxury Travels', email: 'booking@imperialtravels.net', phone: '9900112208', address: { area: 'Hazratganj', landmark: 'Near Mayfair Cinema', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' } },
  { name: 'Spice Route Global Exporters', email: 'export@spiceroute.org', phone: '9900112209', address: { area: 'Willingdon Island', landmark: 'Wharf Road', city: 'Kochi', state: 'Kerala', pincode: '682003' } },
  { name: 'Pink City Royal Gems', email: 'info@pinkcitygems.com', phone: '9900112210', address: { area: 'Johari Bazaar', landmark: 'Badi Chaupar', city: 'Jaipur', state: 'Rajasthan', pincode: '302003' } },
  { name: 'Vanguard Media & Studios', email: 'hello@vanguardstudios.in', phone: '9900112211', address: { area: 'Okhla Phase 3', landmark: 'Modi Mill Compound', city: 'New Delhi', state: 'Delhi', pincode: '110020' } },
  { name: 'Shree Krishna Agro Foods', email: 'contact@krishnaagro.com', phone: '9900112212', address: { area: 'GIDC Estate', landmark: 'Plot 45', city: 'Vadodara', state: 'Gujarat', pincode: '390010' } },
  { name: 'Horizon Cloud Dynamics', email: 'cloud@horizondynamics.io', phone: '9900112213', address: { area: 'Sector 44', landmark: 'Near Huda Metro', city: 'Gurugram', state: 'Haryana', pincode: '122003' } },
  { name: 'Zenith Healthcare Labs', email: 'diagnostics@zenithlabs.org', phone: '9900112214', address: { area: 'Rajajinagar', landmark: 'Near ESI Hospital', city: 'Bengaluru', state: 'Karnataka', pincode: '560010' } },
  { name: 'Grand Monarch Banquets', email: 'banquets@grandmonarch.com', phone: '9900112215', address: { area: 'Kalyan Nagar', landmark: 'Outer Ring Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560043' } },
  { name: 'Sterling Steel & Metals', email: 'procure@sterlingmetals.com', phone: '9900112216', address: { area: 'MIDC Rabale', landmark: 'Thane Belapur Road', city: 'Navi Mumbai', state: 'Maharashtra', pincode: '400701' } },
  { name: 'Urban Pulse Fitness Clubs', email: 'membership@urbanpulse.in', phone: '9900112217', address: { area: 'Koramangala 4th Block', landmark: '100 Feet Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' } },
  { name: 'Sapphire Real Estate Ventures', email: 'invest@sapphireventures.in', phone: '9900112218', address: { area: 'Worli Seaface', landmark: 'Century Bhavan', city: 'Mumbai', state: 'Maharashtra', pincode: '400030' } },
  { name: 'Greenleaf Organic Botanicals', email: 'care@greenleafbotanicals.com', phone: '9900112219', address: { area: 'Auroville Road', landmark: 'Near Visitor Centre', city: 'Puducherry', state: 'Puducherry', pincode: '605101' } },
  { name: 'Nova Education Foundations', email: 'trust@novaeducation.edu.in', phone: '9900112220', address: { area: 'Salt Lake Sector 1', landmark: 'Near CA Island', city: 'Kolkata', state: 'West Bengal', pincode: '700064' } },
];

const seedCategories = [
  { categoryName: 'Corporate Conferences', description: 'Annual general meetings, leadership summits, and company-wide strategic conferences.' },
  { categoryName: 'Weddings & Receptions', description: 'Destination weddings, grand banquets, sangeet, and reception event management.' },
  { categoryName: 'Music & Concerts', description: 'Live concerts, acoustic performances, orchestral showcases, and music festivals.' },
  { categoryName: 'Product Launches', description: 'High-impact press launches, media unveilings, and tech showcase events.' },
  { categoryName: 'Charity & Gala Dinners', description: 'Non-profit fundraisers, charity auctions, and black-tie donor galas.' },
  { categoryName: 'Trade Shows & Expos', description: 'Multi-industry commercial exhibitions, pavilion booths, and vendor expos.' },
  { categoryName: 'Award Ceremonies', description: 'Industry recognition galas, trophy distributions, and entertainment award nights.' },
  { categoryName: 'Technical Hackathons', description: '48-hour competitive coding hackathons, design sprints, and developer gatherings.' },
  { categoryName: 'Fashion Shows', description: 'Runway exhibitions, designer showcases, and haute couture presentations.' },
  { categoryName: 'Sports Tournaments', description: 'Inter-corporate cricket leagues, marathons, badminton championships, and cups.' },
  { categoryName: 'Art & Sculpture Exhibitions', description: 'Curated gallery openings, contemporary art auctions, and public exhibits.' },
  { categoryName: 'Food & Wine Festivals', description: 'Gourmet tasting festivals, celebrity chef workshops, and culinary expos.' },
  { categoryName: 'Alumni Reunions', description: 'School and university batch reunions, nostalgic gatherings, and dinners.' },
  { categoryName: 'Film Screenings & Premieres', description: 'Independent film premieres, documentary debuts, and private screenings.' },
  { categoryName: 'Networking Mixers', description: 'Startup pitch mixers, angel investor roundtables, and speed networking.' },
  { categoryName: 'Health & Wellness Retreats', description: 'Weekend yoga retreats, mindfulness seminars, and sound bath sessions.' },
  { categoryName: 'Cultural Festivals', description: 'Traditional folk dance festivals, heritage exhibitions, and music celebrations.' },
  { categoryName: 'Team Building Retreats', description: 'Outdoor adventure camps, team obstacle courses, and offsite strategy days.' },
  { categoryName: 'Holiday & Gala Celebrations', description: 'New Year Eve parties, Diwali banquets, and annual milestone celebrations.' },
  { categoryName: 'Educational Seminars', description: 'Academic symposiums, student scholarship fairs, and professional workshops.' },
];

const eventTemplates = [
  { name: 'Annual Leadership Summit 2026', total: 25000, initial: 10000 },
  { name: 'Grand Royal Wedding Reception', total: 60000, initial: 25000 },
  { name: 'Acoustic Sunset Music Festival', total: 18000, initial: 6000 },
  { name: 'NextGen AI Product Unveiling', total: 35000, initial: 15000 },
  { name: 'Hope Foundation Annual Charity Gala', total: 22000, initial: 11000 },
  { name: 'National Industry Expo & Trade Fair', total: 80000, initial: 30000 },
  { name: 'Fintech Excellence Honors Night', total: 28000, initial: 14000 },
  { name: 'CodeForge 48H Hackathon', total: 15000, initial: 5000 },
  { name: 'Autumn Couture Runway Showcase', total: 40000, initial: 20000 },
  { name: 'Corporate Premier Cricket League', total: 12000, initial: 6000 },
  { name: 'Contemporary Canvas Art Exhibition', total: 9500, initial: 4500 },
  { name: 'International Gourmet Food Fest', total: 30000, initial: 12000 },
  { name: 'Silver Jubilee Alumni Reunion', total: 14000, initial: 7000 },
  { name: 'DocuFest Documentary Premiere', total: 8500, initial: 3500 },
  { name: 'Venture Capital & Founders Mixer', total: 11000, initial: 5500 },
  { name: 'Prana Wellness & Yoga Retreat', total: 16000, initial: 8000 },
  { name: 'Heritage Heritage Folk Fest', total: 21000, initial: 7000 },
  { name: 'Extreme Adventure Team Offsite', total: 19000, initial: 9500 },
  { name: 'Grand Winter Gala Celebration', total: 45000, initial: 20000 },
  { name: 'Higher Education Opportunity Fair', total: 13000, initial: 6500 },
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(envConfig.MONGOURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB successfully.');

    // 1. Seed Users (20 records)
    console.log('\n--- Seeding 20 Users ---');
    const createdUsers = [];
    for (const u of seedUsers) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        createdUsers.push(existing);
      } else {
        const newUser = new User(u);
        await newUser.save();
        createdUsers.push(newUser);
      }
    }
    console.log(`Verified ${createdUsers.length} Users.`);

    const primaryUser = createdUsers[0];

    // 2. Seed Consumers (20 records)
    console.log('\n--- Seeding 20 Consumers ---');
    const createdConsumers = [];
    for (let i = 0; i < seedConsumers.length; i++) {
      const c = seedConsumers[i];
      const assignedUser = createdUsers[i % createdUsers.length];
      const existing = await Consumer.findOne({ email: c.email });
      if (existing) {
        createdConsumers.push(existing);
      } else {
        const newConsumer = new Consumer({
          ...c,
          user: assignedUser._id,
        });
        await newConsumer.save();
        createdConsumers.push(newConsumer);
      }
    }
    console.log(`Verified ${createdConsumers.length} Consumers.`);

    // 3. Seed Categories (20 records)
    console.log('\n--- Seeding 20 Categories ---');
    const createdCategories = [];
    for (let i = 0; i < seedCategories.length; i++) {
      const cat = seedCategories[i];
      const assignedUser = createdUsers[i % createdUsers.length];
      const existing = await Category.findOne({ categoryName: cat.categoryName });
      if (existing) {
        createdCategories.push(existing);
      } else {
        const newCat = new Category({
          ...cat,
          user: {
            _id: assignedUser._id,
            name: assignedUser.name,
            email: assignedUser.email,
          },
        });
        await newCat.save();
        createdCategories.push(newCat);
      }
    }
    console.log(`Verified ${createdCategories.length} Categories.`);

    // 4. Seed Events (20 records)
    console.log('\n--- Seeding 20 Events ---');
    const createdEvents = [];
    const baseDate = new Date('2026-10-01');

    for (let i = 0; i < eventTemplates.length; i++) {
      const t = eventTemplates[i];
      const consumer = createdConsumers[i % createdConsumers.length];
      const eventDate = new Date(baseDate.getTime() + i * 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const existing = await Event.findOne({
        eventName: t.name,
        consumerId: consumer._id.toString(),
      });

      if (existing) {
        createdEvents.push(existing);
      } else {
        const newEvent = new Event({
          eventName: t.name,
          eventDate,
          totalAmount: t.total,
          initialPaid: t.initial,
          consumerId: consumer._id.toString(),
          consumer: {
            _id: consumer._id,
            name: consumer.name,
            email: consumer.email,
            phone: consumer.phone,
            address: consumer.address,
          },
        });
        await newEvent.save();
        createdEvents.push(newEvent);
      }
    }
    console.log(`Verified ${createdEvents.length} Events.`);

    // 5. Seed Transactions (20 records)
    console.log('\n--- Seeding 20 Transactions ---');
    const createdTransactions = [];
    for (let i = 0; i < createdEvents.length; i++) {
      const event = createdEvents[i];
      const customer = createdConsumers[i % createdConsumers.length];

      const paidChunk = Math.round(event.totalAmount * 0.25);
      const isPaidFull = i % 3 === 0;
      const actualPaid = isPaidFull ? event.totalAmount : paidChunk;
      const remaining = Math.max(0, event.totalAmount - actualPaid);

      const existing = await Transaction.findOne({
        eventId: event._id.toString(),
        customerId: customer._id.toString(),
      });

      if (existing) {
        createdTransactions.push(existing);
      } else {
        const newTx = new Transaction({
          paidAmount: actualPaid,
          pendingAmount: remaining,
          eventId: event._id.toString(),
          customerId: customer._id.toString(),
          paymentStatus: remaining === 0 ? 'Paid' : 'Pending',
          event: {
            _id: event._id,
            eventName: event.eventName,
            eventDate: event.eventDate,
            totalAmount: remaining,
            consumerId: customer._id.toString(),
          },
        });
        await newTx.save();
        createdTransactions.push(newTx);
      }
    }
    console.log(`Verified ${createdTransactions.length} Transactions.`);

    // Invalidate Redis caches
    console.log('\n--- Invalidating Caches ---');
    await cache.delPattern('cache:*');
    console.log('Redis caches successfully invalidated.');

    console.log('\n🎉 ALL 20 RECORDS FOR ALL 5 MODULES SUCCESSFULLY SEEDED!');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    await cache.close();
    process.exit(0);
  }
}

seedDatabase();
