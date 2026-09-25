import {
  Baby,
  Banknote,
  Beer,
  Car,
  Caravan,
  CircleDot,
  Clock,
  CreditCard,
  Droplets,
  EvCharger,
  FlaskConical,
  Flame,
  Fuel,
  Gauge,
  KeyRound,
  Lamp,
  Package,
  ShoppingBag,
  ShoppingBasket,
  ShowerHead,
  Toilet,
  Truck,
  Utensils,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { SERVICE_LABELS } from '@/lib/constants';

const SERVICE_RULES: { test: RegExp; icon: LucideIcon; label?: string }[] = [
  { test: /automate|24\/24|24_24/i, icon: CreditCard, label: 'Automate CB 24/24' },
  { test: /gonflage/i, icon: Gauge, label: 'Gonflage' },
  { test: /boutique alimentaire/i, icon: ShoppingBasket, label: 'Boutique alimentaire' },
  { test: /boutique/i, icon: ShoppingBag },
  { test: /lavage manuel/i, icon: Droplets, label: 'Lavage manuel' },
  { test: /lavage/i, icon: Car },
  { test: /laverie/i, icon: WashingMachine },
  { test: /gaz domestique|gaz_domestique/i, icon: Flame, label: 'Gaz domestique' },
  { test: /fioul/i, icon: Flame, label: 'Fioul domestique' },
  { test: /p[ée]trole/i, icon: Lamp, label: 'Pétrole lampant' },
  { test: /additi/i, icon: FlaskConical },
  { test: /toilettes/i, icon: Toilet, label: 'Toilettes' },
  { test: /dab|billets/i, icon: Banknote, label: 'Distributeur de billets' },
  { test: /poids lourds/i, icon: Truck, label: 'Piste poids lourds' },
  { test: /relais colis|relais_colis/i, icon: Package, label: 'Relais colis' },
  { test: /r[ée]paration|entretien/i, icon: Wrench, label: 'Réparation, entretien' },
  { test: /restauration sur place/i, icon: UtensilsCrossed, label: 'Restauration sur place' },
  { test: /restauration/i, icon: Utensils },
  { test: /bar\b/i, icon: Beer },
  { test: /wifi|wi-fi/i, icon: Wifi, label: 'Wi-Fi' },
  { test: /bornes?.?[ée]lectriques?/i, icon: EvCharger, label: 'Bornes électriques' },
  { test: /location/i, icon: KeyRound, label: 'Location de véhicules' },
  { test: /b[ée]b[ée]/i, icon: Baby },
  { test: /douche/i, icon: ShowerHead },
  { test: /camping/i, icon: Caravan, label: 'Aire camping-car' },
  { test: /gnv|carburant/i, icon: Fuel },
  { test: /horaire|ouvert/i, icon: Clock },
];

export function describeService(service: string): { icon: LucideIcon; label: string } {
  const label = SERVICE_LABELS[service] ?? service;
  const rule = SERVICE_RULES.find((r) => r.test.test(service));
  return { icon: rule?.icon ?? CircleDot, label: rule?.label ?? label };
}

export function ServiceIcon({ service, className }: { service: string; className?: string }) {
  const { icon: Icon } = describeService(service);
  return <Icon className={className} aria-hidden />;
}
