/**
 * VIN Decoder Mock Service
 * Simulates a real VIN decoder API for Australian market vehicles
 * Provides realistic responses with vehicle details
 */

import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

/**
 * Vehicle details interface
 */
export interface VehicleDetails {
  vin: string;
  make: string;
  model: string;
  year: number;
  variant?: string;
  engine?: string;
  transmission?: string;
  bodyType?: string;
  fuelType?: string;
  color?: string;
  manufacturingPlant?: string;
  manufacturingDate?: string;
  isValid: boolean;
  error?: string;
}

/**
 * Australian vehicle manufacturers with their WMI codes
 * World Manufacturer Identifier (first 3 characters of VIN)
 */
const AUSTRALIAN_MANUFACTURERS: Record<string, string> = {
  '6T1': 'Toyota', // Toyota Australia
  '6F4': 'Ford',   // Ford Australia
  '6G1': 'Holden', // GM Holden
  '6F5': 'Mazda',  // Mazda Australia
  '6MM': 'Mitsubishi', // Mitsubishi Australia
  '6U9': 'Subaru', // Subaru Australia
  '6FS': 'Nissan', // Nissan Australia
  '6F6': 'Honda',  // Honda Australia
  '6V2': 'Hyundai', // Hyundai Australia
  '6F2': 'Kia',    // Kia Australia
  '6F9': 'Suzuki', // Suzuki Australia
  // Add more as needed
};

/**
 * Common vehicle models by manufacturer
 */
const MODELS_BY_MANUFACTURER: Record<string, string[]> = {
  'Toyota': ['Corolla', 'Camry', 'HiLux', 'RAV4', 'LandCruiser', 'Yaris', 'Kluger', 'Prado', 'C-HR', 'HiAce'],
  'Ford': ['Ranger', 'Mustang', 'Everest', 'Focus', 'Escape', 'Falcon', 'Territory', 'Transit', 'Endura', 'Puma'],
  'Holden': ['Commodore', 'Colorado', 'Astra', 'Captiva', 'Trax', 'Acadia', 'Equinox', 'Trailblazer', 'Barina', 'Cruze'],
  'Mazda': ['Mazda3', 'CX-5', 'CX-9', 'Mazda2', 'Mazda6', 'CX-3', 'CX-30', 'MX-5', 'BT-50', 'CX-8'],
  'Mitsubishi': ['Triton', 'Outlander', 'ASX', 'Pajero', 'Eclipse Cross', 'Pajero Sport', 'Mirage', 'Lancer', 'Express', 'Challenger'],
  'Subaru': ['Forester', 'Outback', 'XV', 'Impreza', 'WRX', 'Liberty', 'BRZ', 'Levorg', 'Ascent', 'Tribeca'],
  'Nissan': ['X-Trail', 'Navara', 'Qashqai', 'Patrol', 'Pathfinder', 'Juke', 'Leaf', 'Pulsar', '370Z', 'GTR'],
  'Honda': ['Civic', 'CR-V', 'HR-V', 'Accord', 'Jazz', 'Odyssey', 'City', 'NSX', 'Type R', 'Legend'],
  'Hyundai': ['i30', 'Tucson', 'Santa Fe', 'Kona', 'iMax', 'iLoad', 'Accent', 'Venue', 'Palisade', 'Sonata'],
  'Kia': ['Cerato', 'Sportage', 'Sorento', 'Picanto', 'Rio', 'Carnival', 'Seltos', 'Stinger', 'Stonic', 'Niro'],
  'Suzuki': ['Swift', 'Vitara', 'Jimny', 'Baleno', 'Ignis', 'S-Cross', 'Grand Vitara', 'APV', 'Alto', 'Kizashi'],
};

/**
 * Common engine types by manufacturer
 */
const ENGINE_TYPES: Record<string, string[]> = {
  'Toyota': ['1.8L 4-cylinder', '2.0L 4-cylinder', '2.5L 4-cylinder', '2.8L Turbo Diesel', '3.5L V6', '4.0L V6', '4.5L V8 Turbo Diesel'],
  'Ford': ['2.0L EcoBoost', '2.3L EcoBoost', '2.0L Bi-Turbo Diesel', '3.2L Turbo Diesel', '5.0L V8', '2.7L EcoBoost V6'],
  'Holden': ['1.4L Turbo', '1.6L Turbo', '2.0L Turbo', '3.0L V6', '3.6L V6', '6.2L V8', '2.8L Duramax Diesel'],
  'Mazda': ['1.5L SkyActiv-G', '2.0L SkyActiv-G', '2.5L SkyActiv-G', '2.2L SkyActiv-D', '2.5L Turbo SkyActiv-G'],
  'Mitsubishi': ['1.5L MIVEC', '2.0L MIVEC', '2.4L MIVEC', '3.0L V6 MIVEC', '2.4L Turbo Diesel'],
  'Subaru': ['1.6L Flat-4', '2.0L Flat-4', '2.5L Flat-4', '2.0L Turbo Flat-4', '3.6L Flat-6'],
  'Nissan': ['1.2L Turbo', '2.0L Turbo', '2.3L Twin-Turbo', '2.5L 4-cylinder', '3.5L V6', '5.6L V8'],
  'Honda': ['1.5L VTEC Turbo', '1.8L i-VTEC', '2.0L VTEC Turbo', '3.5L i-VTEC V6', '2.0L Hybrid'],
  'Hyundai': ['1.6L GDi', '1.6L T-GDi', '2.0L GDi', '2.0L CRDi', '3.5L GDi V6'],
  'Kia': ['1.4L T-GDi', '1.6L T-GDi', '2.0L GDi', '2.2L CRDi', '3.3L T-GDi V6'],
  'Suzuki': ['1.0L Boosterjet', '1.4L Boosterjet', '1.6L VVT', '2.4L VVT', '1.5L Dualjet'],
};

/**
 * Common transmission types
 */
const TRANSMISSION_TYPES = [
  '5-speed Manual',
  '6-speed Manual',
  '6-speed Automatic',
  '8-speed Automatic',
  '10-speed Automatic',
  'CVT',
  'Dual-Clutch Automatic',
  '7-speed DSG',
  '9-speed Automatic',
  'Electronic CVT',
];

/**
 * Common body types
 */
const BODY_TYPES = [
  'Sedan',
  'Hatchback',
  'SUV',
  'Ute',
  'Wagon',
  'Coupe',
  'Convertible',
  'Van',
  'Cab Chassis',
  'People Mover',
];

/**
 * Common fuel types
 */
const FUEL_TYPES = [
  'Petrol',
  'Diesel',
  'Hybrid',
  'Electric',
  'LPG',
  'Flex Fuel',
  'Plug-in Hybrid',
];

/**
 * Common colors
 */
const COLORS = [
  'White',
  'Silver',
  'Black',
  'Grey',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Orange',
  'Brown',
  'Burgundy',
  'Champagne',
];

/**
 * Manufacturing plants by manufacturer
 */
const MANUFACTURING_PLANTS: Record<string, string[]> = {
  'Toyota': ['Altona, Victoria', 'Tsukuba, Japan', 'Tahara, Japan'],
  'Ford': ['Broadmeadows, Victoria', 'Geelong, Victoria', 'Rayong, Thailand'],
  'Holden': ['Elizabeth, South Australia', 'Port Melbourne, Victoria'],
  'Mazda': ['Hiroshima, Japan', 'Hofu, Japan', 'Salamanca, Mexico'],
  'Mitsubishi': ['Tonsley Park, South Australia', 'Okazaki, Japan', 'Laem Chabang, Thailand'],
  'Subaru': ['Gunma, Japan', 'Yajima, Japan', 'Lafayette, USA'],
  'Nissan': ['Dandenong, Victoria', 'Yokohama, Japan', 'Sunderland, UK'],
  'Honda': ['Suzuka, Japan', 'Sayama, Japan', 'Ayutthaya, Thailand'],
  'Hyundai': ['Ulsan, South Korea', 'Asan, South Korea', 'Chennai, India'],
  'Kia': ['Gwangju, South Korea', 'Sohari, South Korea', 'Zilina, Slovakia'],
  'Suzuki': ['Hamamatsu, Japan', 'Sagara, Japan', 'Gurgaon, India'],
};

/**
 * Validates a VIN using the checksum (9th character)
 * @param vin VIN to validate
 * @returns boolean indicating if the VIN is valid
 */
const validateVin = (vin: string): boolean => {
  if (!vin || typeof vin !== 'string') {
    return false;
  }

  // VINs are always 17 characters
  if (vin.length !== 17) {
    return false;
  }

  // VINs only contain alphanumeric characters, excluding I, O, and Q
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    return false;
  }

  // For a proper implementation, we'd check the checksum (9th character)
  // This is a simplified version for the mock
  return true;
};

/**
 * Generates a random element from an array
 * @param array Array to pick from
 * @returns Random element from the array
 */
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Extracts model year from VIN (10th character)
 * @param vin VIN to extract year from
 * @returns Year between 2000-2025
 */
const extractYearFromVin = (vin: string): number => {
  const yearChar = vin.charAt(9).toUpperCase();
  const yearMap: Record<string, number> = {
    'Y': 2000, '1': 2001, '2': 2002, '3': 2003, '4': 2004,
    '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009,
    'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
    'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
    'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
    'S': 2025
  };
  
  return yearMap[yearChar] || 2020; // Default to 2020 if not found
};

/**
 * Decodes a VIN to extract vehicle details
 * @param vin VIN to decode
 * @returns Vehicle details with make, model, year, etc.
 */
export const decodeVin = async (vin: string): Promise<VehicleDetails> => {
  // Validate VIN format
  if (!validateVin(vin)) {
    logger.warn(`Invalid VIN format: ${vin}`);
    return {
      vin,
      isValid: false,
      error: 'Invalid VIN format. VIN must be 17 alphanumeric characters (excluding I, O, Q).',
      make: '',
      model: '',
      year: 0
    };
  }

  try {
    // Extract World Manufacturer Identifier (WMI) - first 3 characters
    const wmi = vin.substring(0, 3);
    const make = AUSTRALIAN_MANUFACTURERS[wmi] || 'Unknown';
    
    // Extract year (10th character)
    const year = extractYearFromVin(vin);
    
    // Generate consistent mock data based on the VIN
    // Using the VIN as a seed for deterministic responses
    const vinSum = vin.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const vinSeed = vinSum % 100;  // Use modulo to get a manageable seed
    
    // Select model based on manufacturer (use VIN to make it deterministic)
    const modelIndex = vinSeed % (MODELS_BY_MANUFACTURER[make]?.length || 1);
    const model = MODELS_BY_MANUFACTURER[make]?.[modelIndex] || 'Unknown Model';
    
    // Select other attributes based on manufacturer and VIN
    const engine = getRandomElement(ENGINE_TYPES[make] || ['2.0L 4-cylinder']);
    const transmission = getRandomElement(TRANSMISSION_TYPES);
    const bodyType = getRandomElement(BODY_TYPES);
    const fuelType = getRandomElement(FUEL_TYPES);
    const color = getRandomElement(COLORS);
    const plant = getRandomElement(MANUFACTURING_PLANTS[make] || ['Unknown']);
    
    // Generate manufacturing date (before the model year)
    const mfgYear = year - 1;
    const mfgMonth = 1 + (vinSeed % 12);
    const mfgDay = 1 + (vinSeed % 28);
    const manufacturingDate = `${mfgYear}-${mfgMonth.toString().padStart(2, '0')}-${mfgDay.toString().padStart(2, '0')}`;
    
    // Simulate API latency (100-300ms)
    await new Promise(resolve => setTimeout(resolve, 100 + (vinSeed % 200)));
    
    const result: VehicleDetails = {
      vin,
      make,
      model,
      year,
      engine,
      transmission,
      bodyType,
      fuelType,
      color,
      manufacturingPlant: plant,
      manufacturingDate,
      isValid: true
    };
    
    logger.info(`VIN decoded successfully: ${vin}`, { 
      make: result.make, 
      model: result.model, 
      year: result.year 
    });
    
    return result;
  } catch (error) {
    logger.error(`Error decoding VIN: ${vin}`, { error });
    return {
      vin,
      isValid: false,
      error: 'Error processing VIN. Please try again.',
      make: '',
      model: '',
      year: 0
    };
  }
};

/**
 * Validates if a VIN follows the required format
 * @param vin VIN to validate
 * @throws {ValidationError} If VIN format is invalid
 */
export const validateVinFormat = (vin: string): void => {
  if (!vin || typeof vin !== 'string') {
    throw new ValidationError('VIN is required');
  }

  if (vin.length !== 17) {
    throw new ValidationError('VIN must be exactly 17 characters');
  }

  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    throw new ValidationError('VIN must contain only alphanumeric characters (excluding I, O, Q)');
  }
};

/**
 * Gets a list of all supported vehicle makes
 * @returns Array of supported vehicle makes
 */
export const getVehicleMakes = (): string[] => {
  return Object.values(AUSTRALIAN_MANUFACTURERS).sort();
};

/**
 * Gets a list of models for a specific make
 * @param make Vehicle make
 * @returns Array of models for the specified make
 */
export const getModelsForMake = (make: string): string[] => {
  return (MODELS_BY_MANUFACTURER[make] || []).sort();
};

export default {
  decodeVin,
  validateVinFormat,
  getVehicleMakes,
  getModelsForMake,
};