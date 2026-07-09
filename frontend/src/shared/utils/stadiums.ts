import { ZoneStatus } from '../types';

export interface StadiumConfig {
  id: 'metlife' | 'sofi' | 'azteca';
  name: string;
  locationName: string;
  city: string;
  capacity: string;
  todaysMatch: {
    teams: string;
    time: string;
    phase: string;
  };
  embedUrl: string;
  zones: Record<string, { label: string; type: string; location: [number, number]; landmark?: string }>;
}

export const STADIUMS_CONFIG: Record<string, StadiumConfig> = {
  metlife: {
    id: 'metlife',
    name: 'MetLife Stadium',
    locationName: 'East Rutherford, NJ',
    city: 'New York/New Jersey',
    capacity: '82,500',
    todaysMatch: {
      teams: 'Argentina vs Brazil',
      time: '20:00 EST',
      phase: 'Group A',
    },
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3020.2443653198083!2d-74.07689108459239!3d40.813577979321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2f861ad5d0237%3A0x8f2d5bb0091ff6d2!2sMetLife%20Stadium!5e0!3m2!1sen!2sus!4v1680000000000!5m2!1sen!2sus',
    zones: {
      gate_north: { label: "North Gate", type: "entrance", location: [400, 100], landmark: "Near Gate A, adjacent to Box Office" },
      gate_south: { label: "South Gate", type: "entrance", location: [400, 700], landmark: "Near Verizon Gate, adjacent to South Plaza" },
      gate_east: { label: "East Gate", type: "entrance", location: [700, 400], landmark: "Near MetLife Gate, near Train Station" },
      gate_west: { label: "West Gate", type: "entrance", location: [100, 400], landmark: "Near Pepsi Gate, adjacent to Retail Store" },
      section_a: { label: "Section A", type: "seating", location: [300, 200], landmark: "Lower Tier Level 100, West Wing" },
      section_b: { label: "Section B", type: "seating", location: [500, 200], landmark: "Lower Tier Level 100, East Wing" },
      section_c: { label: "Section C", type: "seating", location: [300, 600], landmark: "Upper Tier Level 300, South Wing" },
      section_d: { label: "Section D", type: "seating", location: [500, 600], landmark: "Upper Tier Level 300, North Wing" },
      food_court_a: { label: "Food Court A", type: "food", location: [200, 300], landmark: "Section 114 concourse, opposite Bud Light stand" },
      food_court_b: { label: "Food Court B", type: "food", location: [600, 300], landmark: "Section 124 concourse, near Corona beach bar" },
      food_court_c: { label: "Food Court C", type: "food", location: [200, 500], landmark: "Section 316 concourse, next to escalator landing" },
      food_court_d: { label: "Food Court D", type: "food", location: [600, 500], landmark: "Section 334 concourse, opposite soft drink station" },
      wc_north: { label: "Restroom North", type: "wc", location: [350, 150], landmark: "Adjacent to Section 102 entry corridor" },
      wc_south: { label: "Restroom South", type: "wc", location: [450, 650], landmark: "Adjacent to Section 138 entry corridor" },
      medical_center: { label: "Medical Center", type: "medical", location: [100, 200], landmark: "Level 1 concourse, behind Section 143" },
      exit_main: { label: "Main Exit", type: "exit", location: [400, 750], landmark: "Under Pepsi Arch, adjacent to MetLife parking lot" },
      exit_emergency: { label: "Emergency Exit", type: "exit", location: [750, 400], landmark: "East Concourse Gate 18 ramp" },
    }
  },
  sofi: {
    id: 'sofi',
    name: 'SoFi Stadium',
    locationName: 'Inglewood, CA',
    city: 'Los Angeles',
    capacity: '70,240',
    todaysMatch: {
      teams: 'USA vs Mexico',
      time: '18:30 PST',
      phase: 'Group B',
    },
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3310.276632422709!2d-118.3413994847879!3d33.95346478063251!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2b70dcd76cf9f%3A0x6b87d2ef1372cf93!2sSoFi%20Stadium!5e0!3m2!1sen!2sus!4v1680000000000!5m2!1sen!2sus',
    zones: {
      gate_north: { label: "Canyon Gate", type: "entrance", location: [350, 120], landmark: "Entry 1, adjacent to North Canyon plaza" },
      gate_south: { label: "Lake Gate", type: "entrance", location: [450, 680], landmark: "Entry 8, adjacent to Lake Plaza" },
      gate_east: { label: "Concourse Plaza", type: "entrance", location: [680, 420], landmark: "Entry 5, near American Airlines Plaza" },
      gate_west: { label: "VIP Entry", type: "entrance", location: [120, 380], landmark: "Entry 11, adjacent to Google Cloud Suite lobby" },
      section_a: { label: "Section 100", type: "seating", location: [280, 240], landmark: "Field Level, West concourse" },
      section_b: { label: "Section 200", type: "seating", location: [520, 240], landmark: "Main Concourse level, East concourse" },
      section_c: { label: "Section 300", type: "seating", location: [280, 560], landmark: "Upper Level tier, West wing" },
      section_d: { label: "Section 400", type: "seating", location: [520, 560], landmark: "Upper Level tier, East wing" },
      food_court_a: { label: "Patio Eats", type: "food", location: [220, 340], landmark: "Section 120 patio area" },
      food_court_b: { label: "SoFi Bistro", type: "food", location: [580, 340], landmark: "Section 108 bistro suite" },
      food_court_c: { label: "Taco Garden", type: "food", location: [220, 460], landmark: "Level 3 concourse, near South Ramp" },
      food_court_d: { label: "Gridiron Grill", type: "food", location: [580, 460], landmark: "Level 3 concourse, near East Ramp" },
      wc_north: { label: "Suite WC North", type: "wc", location: [320, 180], landmark: "Behind Suite level 15" },
      wc_south: { label: "Concourse WC South", type: "wc", location: [480, 620], landmark: "Next to Section 224 concessions" },
      medical_center: { label: "First Aid SoFi", type: "medical", location: [140, 250], landmark: "Main Concourse level, adjacent to Section 112" },
      exit_main: { label: "East Exit Gate", type: "exit", location: [380, 720], landmark: "Main lake exit ramp" },
      exit_emergency: { label: "Emergency Ramp", type: "exit", location: [720, 380], landmark: "Northeast escape ramp 22" },
    }
  },
  azteca: {
    id: 'azteca',
    name: 'Estadio Azteca',
    locationName: 'Tlalpan, CDMX',
    city: 'Mexico City',
    capacity: '87,523',
    todaysMatch: {
      teams: 'Mexico vs Germany',
      time: '19:00 CST',
      phase: 'Group C',
    },
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3765.419041285223!2d-99.1527357850953!3d19.302868286957864!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85ce0075d9e51c89%3A0x9597e7ee7b99a532!2sEstadio%20Azteca!5e0!3m2!1sen!2smx!4v1680000000000!5m2!1sen!2smx',
    zones: {
      gate_north: { label: "Puerta 1", type: "entrance", location: [400, 130], landmark: "Acceso Norte, junto a taquillas principales" },
      gate_south: { label: "Puerta 2", type: "entrance", location: [400, 670], landmark: "Acceso Sur, frente a calzada de Tlalpan" },
      gate_east: { label: "Puerta 3", type: "entrance", location: [670, 400], landmark: "Acceso Oriente, cerca del estacionamiento de prensa" },
      gate_west: { label: "Puerta 4", type: "entrance", location: [130, 400], landmark: "Acceso Poniente, junto a rampa de discapacitados" },
      section_a: { label: "Sección Roja A", type: "seating", location: [310, 210], landmark: "Planta Baja, Cabecera Norte" },
      section_b: { label: "Sección Amarilla B", type: "seating", location: [490, 210], landmark: "Planta Baja, Lateral Oriente" },
      section_c: { label: "Sección Verde C", type: "seating", location: [310, 590], landmark: "Primer Piso, Cabecera Sur" },
      section_d: { label: "Sección Azul D", type: "seating", location: [490, 590], landmark: "Primer Piso, Lateral Poniente" },
      food_court_a: { label: "Taquería Azteca", type: "food", location: [240, 310], landmark: "Túnel 12, planta baja" },
      food_court_b: { label: "Cantina Sol", type: "food", location: [560, 310], landmark: "Túnel 8, lateral de prensa" },
      food_court_c: { label: "Azteca Grill", type: "food", location: [240, 490], landmark: "Nivel 2, Cabecera Sur" },
      food_court_d: { label: "Corona Plaza", type: "food", location: [560, 490], landmark: "Nivel 2, explanada poniente" },
      wc_north: { label: "Baños Norte", type: "wc", location: [330, 160], landmark: "A un costado del túnel 3 de acceso" },
      wc_south: { label: "Baños Sur", type: "wc", location: [470, 640], landmark: "Junto a rampa Sur de plateas" },
      medical_center: { label: "Servicios Médicos", type: "medical", location: [150, 180], landmark: "Planta baja, junto a enfermería central" },
      exit_main: { label: "Salida Principal", type: "exit", location: [400, 710], landmark: "Explanada de salida Calzada de Tlalpan" },
      exit_emergency: { label: "Salida de Emergencia", type: "exit", location: [710, 400], landmark: "Rampa Oriente de desalojo de emergencia" },
    }
  }
};
