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

// [name, industry, hasWhatsApp, phone, addressStub]
const SPEC = {
  "Al Karama": [
    ["Al Noor Mini Mart", "Grocery / Mini mart", true, "+971503121014", "4B St"],
    ["Crescent Pharmacy", "Pharmacy", true, "+971552101223", "Karama Loop Rd"],
    ["Sunrise Bakery", "Bakery", false, "+971529884011", "18B St"],
    ["TechHub Electronics", "Electronics", true, "+971501122334", "10B St"],
    ["Al Bastakiya Hardware", "Hardware", false, "+971556677889", "2B St"],
    ["Day to Day Mini Mart", "Grocery / Mini mart", true, "+971509988776", "14B St"],
    ["Al Baraka Grocery", "Grocery / Mini mart", false, "+971547711002", "6B St"],
    ["Medilink Pharmacy", "Pharmacy", true, "+971554433221", "9B St"],
    ["Golden Crust Bakery", "Bakery", true, "+971502233445", "20B St"],
    ["CityTech Electronics", "Electronics", false, "+971526654321", "12B St"],
    ["Al Madeena Hardware", "Hardware", true, "+971558899001", "8B St"],
    ["Karama Supermarket", "Grocery / Mini mart", true, "+971500122334", "Trade Centre Rd"],
  ],
  "Deira": [
    ["Al Sabkha Mini Mart", "Grocery / Mini mart", true, "+971501234567", "Al Sabkha Rd"],
    ["Al Ras Pharmacy", "Pharmacy", false, "+971552345678", "Al Ras St"],
    ["Naif Bakery", "Bakery", true, "+971529876543", "Naif Rd"],
    ["Deira Electronics Hub", "Electronics", true, "+971503456789", "Gold Souk Rd"],
    ["Creek Hardware", "Hardware", false, "+971554567890", "Baniyas Rd"],
    ["Al Whidi Grocery", "Grocery / Mini mart", true, "+971509876543", "Al Muraqqabat Rd"],
    ["Al Fahidi Mini Mart", "Grocery / Mini mart", false, "+971541234567", "Al Sabkha Rd"],
    ["Wellness Pharmacy", "Pharmacy", true, "+971555678901", "Salahuddin Rd"],
    ["Al Khan Bakery", "Bakery", false, "+971502345678", "Abu Baker Al Siddiq Rd"],
    ["Prime Electronics", "Electronics", true, "+971523456789", "Rigga Rd"],
    ["Al Mansour Hardware", "Hardware", true, "+971556789012", "Clock Tower"],
    ["Deira Fresh Mart", "Grocery / Mini mart", true, "+971509123456", "Corniche Rd"],
  ],
  "Jumeirah": [
    ["Jumeirah Mini Mart", "Grocery / Mini mart", true, "+971501122334", "Jumeirah St"],
    ["Azure Pharmacy", "Pharmacy", true, "+971552233445", "Jumeirah Beach Rd"],
    ["Beachside Bakery", "Bakery", false, "+971523344556", "Jumeirah 1"],
    ["Jumeirah Tech Store", "Electronics", false, "+971503344556", "Jumeirah Rd"],
    ["Palm Hardware", "Hardware", true, "+971554455667", "Al Wasl Rd"],
    ["J3 Mini Mart", "Grocery / Mini mart", true, "+971504455667", "Jumeirah 3"],
    ["Sunset Grocery", "Grocery / Mini mart", false, "+971525566778", "Jumeirah Beach Rd"],
    ["Marina Pharmacy", "Pharmacy", true, "+971555667788", "Jumeirah 2"],
    ["La Boulangerie", "Bakery", true, "+971505566778", "Al Wasl Rd"],
    ["GadgetHub", "Electronics", true, "+971526677889", "Jumeirah Rd"],
    ["Al Manara Hardware", "Hardware", false, "+971556677890", "Al Manara Rd"],
    ["Jumeirah Pantry", "Grocery / Mini mart", true, "+971506677890", "Jumeirah 1"],
  ],
  "Al Quoz": [
    ["Quoz Industrial Mini Mart", "Grocery / Mini mart", true, "+971501233445", "6A St"],
    ["Quoz Care Pharmacy", "Pharmacy", false, "+971552344556", "12B St"],
    ["Industrial Bakery", "Bakery", true, "+971523455667", "4A St"],
    ["Quoz Tech Electronics", "Electronics", true, "+971503456677", "8A St"],
    ["Quoz Hardware Depot", "Hardware", true, "+971554567788", "17B St"],
    ["Al Quoz Grocery", "Grocery / Mini mart", false, "+971524567789", "2A St"],
    ["Speed Mart", "Grocery / Mini mart", true, "+971504578899", "3A St"],
    ["Quoz Health Pharmacy", "Pharmacy", true, "+971555678899", "11A St"],
    ["Morning Bake", "Bakery", false, "+971505678900", "5A St"],
    ["Quoz Gadgets", "Electronics", false, "+971526789011", "9A St"],
    ["BuildWell Hardware", "Hardware", true, "+971556789012", "14B St"],
    ["Quoz Daily Mart", "Grocery / Mini mart", true, "+971506789022", "1A St"],
  ],
  "Business Bay": [
    ["Bay Mini Mart", "Grocery / Mini mart", true, "+971501001002", "Bay Ave"],
    ["Bay Square Pharmacy", "Pharmacy", true, "+971552002003", "Al Asayel St"],
    ["Bay Bakery", "Bakery", true, "+971503003004", "Marasi Dr"],
    ["Bay Electronics", "Electronics", false, "+971504004005", "Business Bay Blvd"],
    ["Bay Hardware", "Hardware", false, "+971505005006", "Al Asayel St"],
    ["Executive Mini Mart", "Grocery / Mini mart", true, "+971506006007", "Al Mustaqbal St"],
    ["Skyline Grocery", "Grocery / Mini mart", false, "+971507007008", "Marasi Dr"],
    ["Bay Care Pharmacy", "Pharmacy", true, "+971558008009", "Al Asayel St"],
    ["Crust & Co Bakery", "Bakery", true, "+971509009010", "Bay Ave"],
    ["Bay Tech Store", "Electronics", true, "+971520010011", "Business Bay Blvd"],
    ["Pro Hardware", "Hardware", true, "+971551011012", "Al Mustaqbal St"],
    ["Bay Pantry", "Grocery / Mini mart", true, "+971502012013", "Marasi Dr"],
  ],
};

function hash(n) {
  const x = Math.sin(n) * 43758.5453123;
  return x - Math.floor(x);
}

function scatter(center, spread, i) {
  const lat = center[0] + (hash(i * 2 + 1) * 2 - 1) * spread;
  const lng = center[1] + (hash(i * 2 + 2) * 2 - 1) * spread;
  return [Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5];
}

let _id = 0;
export const SAMPLE_SHOPS = AREA_OPTIONS.flatMap((area) =>
  SPEC[area].map((s) => {
    _id += 1;
    const [lat, lng] = scatter(AREA_CENTERS[area], SPREAD[area], _id);
    return {
      id: `s${_id}`,
      name: s[0],
      industry: s[1],
      hasWhatsApp: s[2],
      phone: s[3],
      address: s[4],
      area,
      lat,
      lng,
    };
  })
);