export interface AddressSuggestion {
  label: string;
  context: string;
  latitude: number;
  longitude: number;
}

const BAN_API_URL = 'https://api-adresse.data.gouv.fr/search/';

export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  if (query.length < 3) return [];

  const res = await fetch(
    `${BAN_API_URL}?q=${encodeURIComponent(query)}&limit=5`
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.features.map(
    (f: { properties: { label: string; context: string }; geometry: { coordinates: [number, number] } }) => ({
      label: f.properties.label,
      context: f.properties.context,
      longitude: f.geometry.coordinates[0],
      latitude: f.geometry.coordinates[1],
    })
  );
}
