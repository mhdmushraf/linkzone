// Hard-coded, fully fictional sample data for the public landing-page map demo.
// No real business names. Used only for the interactive demo — never calls a backend.

export const AREA_OPTIONS = ["Al Karama", "Deira", "Jumeirah", "Al Quoz", "Business Bay"];
export const INDUSTRY_OPTIONS = ["Grocery / Mini mart", "Pharmacy", "Bakery", "Electronics", "Hardware"];

const AREA_CENTERS = {
  "Al Karama": [25.252, 55.301],
  "Deira": [25.263, 55.331],
  "Jumeirah": [25.204, 55.245],
  "Al Quoz": [25.142, 55.223],
  "Business Bay": [25.189, 55.264],
};

const SPREAD = {
  "Al Karama": 0.009,
  "Deira": 0.011,
  "Jumeirah": 0.01,
  "Al Quoz": 0.01,
  "Business Bay": 0.006,
};

export function areaCenter(area) {
  return AREA_CENTERS[area] || AREA_CENTERS["Al Karama"];
}

// Per area, per category: [name, address]. 6 shops per category → 150 total.
const SHOPS = {
  "Al Karama": {
    "Grocery / Mini mart": [
      ["Al Noor Mini Mart", "4B St"],
      ["Day to Day Mini Mart", "14B St"],
      ["Al Baraka Grocery", "6B St"],
      ["Karama Supermarket", "Trade Centre Rd"],
      ["Al Madeena Mart", "8B St"],
      ["Sunrise Grocers", "16B St"],
    ],
    "Pharmacy": [
      ["Crescent Pharmacy", "Karama Loop Rd"],
      ["Medilink Pharmacy", "9B St"],
      ["Al Hayat Pharmacy", "11B St"],
      ["Wellness Point Pharmacy", "5B St"],
      ["Karama Drug Store", "13B St"],
      ["City Care Pharmacy", "3B St"],
    ],
    "Bakery": [
      ["Sunrise Bakery", "18B St"],
      ["Golden Crust Bakery", "20B St"],
      ["Al Karama Bake House", "22B St"],
      ["Crust & Crumb Bakery", "1B St"],
      ["Buttercup Bakery", "7B St"],
      ["Oven Fresh Bakery", "15B St"],
    ],
    "Electronics": [
      ["TechHub Electronics", "10B St"],
      ["CityTech Electronics", "12B St"],
      ["GadgetBox Electronics", "19B St"],
      ["Al Karama Tech", "21B St"],
      ["Volt Electronics", "17B St"],
      ["Smart Choice Electronics", "23B St"],
    ],
    "Hardware": [
      ["Al Bastakiya Hardware", "2B St"],
      ["Al Madeena Hardware", "8B St"],
      ["BuildRight Hardware", "24B St"],
      ["Karama Tools", "25B St"],
      ["Iron Works Hardware", "26B St"],
      ["Nuts & Bolts Hardware", "27B St"],
    ],
  },
  "Deira": {
    "Grocery / Mini mart": [
      ["Al Sabkha Mini Mart", "Al Sabkha Rd"],
      ["Al Whidi Grocery", "Al Muraqqabat Rd"],
      ["Al Fahidi Mini Mart", "Al Sabkha Rd"],
      ["Deira Fresh Mart", "Corniche Rd"],
      ["Al Ras Grocers", "Al Ras St"],
      ["Naif Market", "Naif Rd"],
    ],
    "Pharmacy": [
      ["Al Ras Pharmacy", "Al Ras St"],
      ["Wellness Pharmacy", "Salahuddin Rd"],
      ["Deira Care Pharmacy", "Baniyas Rd"],
      ["Al Muraqqabat Pharmacy", "Al Muraqqabat Rd"],
      ["Creek Pharmacy", "Baniyas Rd"],
      ["Baniyas Drug Store", "Abu Baker Al Siddiq Rd"],
    ],
    "Bakery": [
      ["Naif Bakery", "Naif Rd"],
      ["Al Khan Bakery", "Abu Baker Al Siddiq Rd"],
      ["Deira Bake House", "Rigga Rd"],
      ["Golden Bread Bakery", "Gold Souk Rd"],
      ["Saffron Bakery", "Corniche Rd"],
      ["Corniche Bakery", "Corniche Rd"],
    ],
    "Electronics": [
      ["Deira Electronics Hub", "Gold Souk Rd"],
      ["Prime Electronics", "Rigga Rd"],
      ["Gold Souk Tech", "Gold Souk Rd"],
      ["Rigga Electronics", "Rigga Rd"],
      ["Deira Gadgets", "Salahuddin Rd"],
      ["Creek Tech Store", "Baniyas Rd"],
    ],
    "Hardware": [
      ["Creek Hardware", "Baniyas Rd"],
      ["Al Mansour Hardware", "Clock Tower"],
      ["Deira Tools", "Naif Rd"],
      ["Baniyas Hardware", "Baniyas Rd"],
      ["Clock Tower Hardware", "Clock Tower"],
      ["Al Ras Build Supply", "Al Ras St"],
    ],
  },
  "Jumeirah": {
    "Grocery / Mini mart": [
      ["Jumeirah Mini Mart", "Jumeirah St"],
      ["J3 Mini Mart", "Jumeirah 3"],
      ["Sunset Grocery", "Jumeirah Beach Rd"],
      ["Jumeirah Pantry", "Jumeirah 1"],
      ["Beach Grocers", "Jumeirah Beach Rd"],
      ["Al Wasl Market", "Al Wasl Rd"],
    ],
    "Pharmacy": [
      ["Azure Pharmacy", "Jumeirah Beach Rd"],
      ["Marina Pharmacy", "Jumeirah 2"],
      ["Jumeirah Care Pharmacy", "Al Wasl Rd"],
      ["Seaside Pharmacy", "Jumeirah St"],
      ["Jumeirah Drug Store", "Jumeirah 3"],
      ["Palm Pharmacy", "Al Wasl Rd"],
    ],
    "Bakery": [
      ["Beachside Bakery", "Jumeirah 1"],
      ["La Boulangerie", "Al Wasl Rd"],
      ["Jumeirah Bake House", "Al Wasl Rd"],
      ["Al Wasl Bakery", "Al Wasl Rd"],
      ["Sunrise Beach Bakery", "Jumeirah Beach Rd"],
      ["Croissant House", "Jumeirah St"],
    ],
    "Electronics": [
      ["Jumeirah Tech Store", "Jumeirah Rd"],
      ["GadgetHub", "Jumeirah Rd"],
      ["Jumeirah Electronics", "Al Wasl Rd"],
      ["Beach Tech", "Jumeirah Beach Rd"],
      ["Wasl Gadgets", "Al Wasl Rd"],
      ["J3 Tech", "Jumeirah 3"],
    ],
    "Hardware": [
      ["Palm Hardware", "Al Wasl Rd"],
      ["Al Manara Hardware", "Al Manara Rd"],
      ["Jumeirah Tools", "Al Wasl Rd"],
      ["BuildWell Jumeirah", "Jumeirah 2"],
      ["Beach Build Supply", "Jumeirah Beach Rd"],
      ["Al Wasl Hardware", "Al Wasl Rd"],
    ],
  },
  "Al Quoz": {
    "Grocery / Mini mart": [
      ["Quoz Industrial Mini Mart", "6A St"],
      ["Al Quoz Grocery", "2A St"],
      ["Speed Mart", "3A St"],
      ["Quoz Daily Mart", "1A St"],
      ["Quoz Fresh Mart", "4A St"],
      ["Industrial Grocers", "5A St"],
    ],
    "Pharmacy": [
      ["Quoz Care Pharmacy", "12B St"],
      ["Quoz Health Pharmacy", "11A St"],
      ["Al Quoz Pharmacy", "10A St"],
      ["Industrial Care Pharmacy", "7A St"],
      ["Quoz Drug Store", "13A St"],
      ["Quoz Wellness Pharmacy", "15A St"],
    ],
    "Bakery": [
      ["Industrial Bakery", "4A St"],
      ["Morning Bake", "5A St"],
      ["Quoz Bake House", "6A St"],
      ["Sunrise Industrial Bakery", "8A St"],
      ["Quoz Bread Co", "9A St"],
      ["Oven Works Bakery", "3A St"],
    ],
    "Electronics": [
      ["Quoz Tech Electronics", "8A St"],
      ["Quoz Gadgets", "9A St"],
      ["Industrial Tech", "7A St"],
      ["Quoz Electronics", "10A St"],
      ["Al Quoz Tech Store", "11A St"],
      ["Voltage Electronics", "12A St"],
    ],
    "Hardware": [
      ["Quoz Hardware Depot", "17B St"],
      ["BuildWell Hardware", "14B St"],
      ["Quoz Tools", "16B St"],
      ["Industrial Build Supply", "18B St"],
      ["Quoz Build Mart", "20B St"],
      ["Heavy Duty Hardware", "22B St"],
    ],
  },
  "Business Bay": {
    "Grocery / Mini mart": [
      ["Bay Mini Mart", "Bay Ave"],
      ["Executive Mini Mart", "Al Mustaqbal St"],
      ["Skyline Grocery", "Marasi Dr"],
      ["Bay Pantry", "Marasi Dr"],
      ["Bay Grocers", "Bay Ave"],
      ["Marasi Market", "Marasi Dr"],
    ],
    "Pharmacy": [
      ["Bay Square Pharmacy", "Al Asayel St"],
      ["Bay Care Pharmacy", "Al Asayel St"],
      ["Executive Pharmacy", "Al Mustaqbal St"],
      ["Business Bay Pharmacy", "Business Bay Blvd"],
      ["Bay Health Pharmacy", "Bay Ave"],
      ["Marasi Pharmacy", "Marasi Dr"],
    ],
    "Bakery": [
      ["Bay Bakery", "Marasi Dr"],
      ["Crust & Co Bakery", "Bay Ave"],
      ["Bay Bake House", "Al Asayel St"],
      ["Marasi Bakery", "Marasi Dr"],
      ["Executive Bakery", "Al Mustaqbal St"],
      ["Skyline Bake", "Business Bay Blvd"],
    ],
    "Electronics": [
      ["Bay Electronics", "Business Bay Blvd"],
      ["Bay Tech Store", "Business Bay Blvd"],
      ["Executive Electronics", "Al Mustaqbal St"],
      ["Business Bay Tech", "Al Asayel St"],
      ["Bay Gadgets", "Bay Ave"],
      ["Marasi Tech", "Marasi Dr"],
    ],
    "Hardware": [
      ["Bay Hardware", "Al Asayel St"],
      ["Pro Hardware", "Al Mustaqbal St"],
      ["Business Bay Tools", "Business Bay Blvd"],
      ["Bay Build Supply", "Bay Ave"],
      ["Executive Hardware", "Al Mustaqbal St"],
      ["Marasi Build Mart", "Marasi Dr"],
    ],
  },
};

const FIRST_NAMES = [
  "Rashid", "Ahmed", "Khalid", "Omar", "Sami", "Faisal", "Nasser", "Tariq",
  "Yusuf", "Hassan", "Imran", "Bilal", "Karim", "Mona", "Lina", "Sara",
  "Aisha", "Maya", "Nadia", "Huda", "Farah", "Reem", "Salma", "Dana", "Layla",
];
const WA_PREFIXES = ["50", "52", "54", "55", "56", "58"];

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hash(n) {
  const x = Math.sin(n) * 43758.5453123;
  return x - Math.floor(x);
}

function scatter(center, spread, seed) {
  const lat = center[0] + (hash(seed * 2 + 1) * 2 - 1) * spread;
  const lng = center[1] + (hash(seed * 2 + 2) * 2 - 1) * spread;
  return [Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5];
}

export function maskPhone(p) {
  const d = (p || "").replace(/\D/g, "");
  if (d.length < 7) return p || "";
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ••• ${d.slice(-4)}`;
}

let _id = 0;
export const SAMPLE_SHOPS = AREA_OPTIONS.flatMap((area) =>
  INDUSTRY_OPTIONS.flatMap((cat) =>
    (SHOPS[area][cat] || []).map((entry) => {
      _id += 1;
      const name = entry[0];
      const h0 = hashStr(name);
      const hph = hashStr(name + "ph");
      const hrt = hashStr(name + "rt");
      const hrv = hashStr(name + "rv");
      const hop = hashStr(name + "op");
      const hao = hashStr(name + "ao");
      const hct = hashStr(name + "ct");
      const [lat, lng] = scatter(AREA_CENTERS[area], SPREAD[area], h0 % 100000);
      const phone = `+971${WA_PREFIXES[hph % WA_PREFIXES.length]}${1000000 + (hph % 8999999)}`;
      const contactName = `${hct % 4 === 0 ? "Ms." : "Mr."} ${FIRST_NAMES[hct % FIRST_NAMES.length]}`;
      return {
        id: `s${_id}`,
        name,
        industry: cat,
        hasWhatsApp: h0 % 100 > 32,
        phone,
        address: entry[1],
        contactName,
        rating: 3.6 + (hrt % 14) / 10,
        reviews: 5 + (hrv % 296),
        openNow: hop % 5 !== 0,
        avgOrderAED: 300 + Math.round((hao % 5700) / 50) * 50,
        area,
        lat,
        lng,
      };
    })
  )
);