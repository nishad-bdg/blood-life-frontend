// app/data/bd-geo.ts

export type BDGeo = Record<
  string, // Division
  Record<
    string, // District
    string[] // Upazilas
  >
>;

export const BD_GEO: BDGeo = {
  Dhaka: {
    "Dhaka": ["Dhanmondi", "Gulshan", "Mirpur", "Tejgaon", "Uttara"],
    "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kapasia", "Sreepur"],
    "Narayanganj": ["Araihazar", "Bandar", "Narayanganj Sadar", "Rupganj", "Sonargaon"],
  },
  Chattogram: {
    "Chattogram": ["Kotwali", "Pahartali", "Panchlaish", "Chandgaon"],
    "Cox's Bazar": ["Cox's Bazar Sadar", "Teknaf", "Ukhiya", "Ramu"],
  },
  Rajshahi: {
    "Rajshahi": ["Boalia", "Rajpara", "Motihar", "Shah Makhdum"],
    "Pabna": ["Pabna Sadar", "Ishwardi", "Bera", "Atgharia"],
  },
  Khulna: {
    "Khulna": ["Khalishpur", "Sonadanga", "Koyra", "Dacope"],
    "Jessore": ["Jessore Sadar", "Jhikargacha", "Benapole", "Manirampur"],
  },
  Barishal: {
    "Barishal": ["Barishal Sadar", "Babuganj", "Bakerganj", "Mehendiganj"],
  },
  Sylhet: {
    "Sylhet": ["Sylhet Sadar", "Beanibazar", "Golapganj", "Zakiganj"],
  },
  Rangpur: {
    "Rangpur": ["Rangpur Sadar", "Gangachara", "Badarganj", "Kaunia"],
  },
  Mymensingh: {
    "Mymensingh": ["Mymensingh Sadar", "Gafargaon", "Ishwarganj", "Trishal"],
  },
};

// Helpers
export const getDivisions = () => Object.keys(BD_GEO);

export const getDistricts = (division?: string) => {
  if (!division || !BD_GEO[division]) return [];
  return Object.keys(BD_GEO[division]);
};

export const getUpazilas = (division?: string, district?: string) => {
  if (!division || !district) return [];
  return BD_GEO[division]?.[district] ?? [];
};
