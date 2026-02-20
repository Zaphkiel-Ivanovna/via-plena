/**
 * Types for the 2aaz prix-carburants API.
 * @see https://api.prix-carburants.2aaz.fr/swagger.yaml
 */

export interface ApiBrand {
  id: number;
  name: string;
  shortName: string;
  nb_stations: number;
}

export interface ApiPrice {
  value: number;
  currency: string;
  unit: string;
  text: string;
}

export interface ApiDateTime {
  value: string;
  text: string;
}

export interface ApiDistance {
  value: number;
  text: string;
}

export interface ApiFuel {
  id: number;
  name: string;
  shortName: string;
  type: 'D' | 'E' | 'G';
  picto: string;
  Update: ApiDateTime;
  available: boolean;
  Price: ApiPrice;
}

export interface ApiStation {
  id: number;
  Brand: ApiBrand;
  type: 'R' | 'A';
  name: string;
  Address: {
    street_line: string;
    city_line: string;
  };
  Coordinates: {
    latitude: number;
    longitude: number;
  };
  Fuels?: ApiFuel[];
  LastUpdate?: ApiDateTime;
}

export interface ApiStationWithDistance extends ApiStation {
  distance: number;
  Distance: ApiDistance;
}
