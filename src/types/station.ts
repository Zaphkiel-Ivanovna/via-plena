export type FuelType = 'gazole' | 'sp95' | 'sp98' | 'e10' | 'e85' | 'gplc';

export interface FuelPrice {
  type: FuelType;
  price: number;
  updatedAt: string;
}

export type StationService =
  | 'lavage'
  | 'boutique'
  | 'gonflage'
  | 'toilettes'
  | 'restauration'
  | 'wifi'
  | 'automate_24_24'
  | 'piste_poids_lourds'
  | 'relais_colis'
  | 'aire_de_camping_car'
  | 'gaz_domestique'
  | 'bornes_electriques';

export interface GasStation {
  id: number;
  name: string;
  brand: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  fuels: FuelPrice[];
  services: StationService[];
  distance?: number;
}
