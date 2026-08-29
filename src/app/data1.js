export const STUDIO = {
  // Confirmed from the Google Business listing and the Instagram profile.
  name: "Venom Gaming Arena",
  logo: "/logo.jpg",
  tagline: "PS5 and sim racing, the way it was meant to be played.",
  address: "Mylapore, Chennai",
  instagram: "@_venom_gaming_arena_",
  instagramUrl: "https://www.instagram.com/_venom_gaming_arena_/",
  // TODO: still placeholders — replace with the real door number, street,
  // pincode, phone, email and opening hours from the Google listing.
  phone: "+91 98765 43210",
  email: "hello@venomgaming.com",
  hours: "Every day, 10:00 AM - 11:00 PM",
};

export const STATS = [
  { value: "8", label: "PS5 consoles" },
  { value: "12", label: "Gaming PCs" },
  { value: "150+", label: "Games in library" },
  { value: "240Hz", label: "Max refresh rate" },
];

export const SETUPS = [
  {
    icon: "\u{1F3AE}",
    title: "PS5 Zone",
    text: "Eight PlayStation 5 consoles on 4K 120Hz TVs with DualSense controllers and 7.1 headsets. Perfect for couch co-op and FIFA nights.",
    tags: ["4K 120Hz", "2-4 players", "DualSense", "PS Plus library"],
  },
  {
    icon: "\u{1F5A5}️",
    title: "PC Battle Station",
    text: "RTX-powered rigs with 240Hz monitors, mechanical keyboards and low-latency mice. Tuned for competitive shooters and esports practice.",
    tags: ["RTX 4070", "240Hz", "Steam + Epic", "Discord ready"],
  },
  {
    icon: "\u{1F3C6}",
    title: "Tournaments & Events",
    text: "We host weekend tournaments, birthday sessions and corporate gaming events. Brackets, prizes and a big screen for the finals.",
    tags: ["Weekly LAN", "Prize pool", "Private booking", "Birthdays"],
  },
];

// `image` points at real, publicly-hosted cover art: Steam's store headers for
// the titles that ship there, plus official key art from the Epic Games Store
// (Valorant) and the PlayStation Store (Gran Turismo 7). `poster` is the
// locally generated fallback used if a remote image fails to load.
const STEAM = (appId) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

export const GAMES = [
  {
    name: "EA FC 25",
    image: STEAM(2669320),
    poster: "/games/ea-fc-25.svg",
    platform: "PS5",
    note: "1v1 and 2v2 couch matches",
  },
  {
    name: "Call of Duty: Warzone",
    image: STEAM(1938090),
    poster: "/games/warzone.svg",
    platform: "PC",
    note: "Squad up on 240Hz rigs",
  },
  {
    name: "God of War Ragnarok",
    image: STEAM(2322010),
    poster: "/games/god-of-war.svg",
    platform: "PS5",
    note: "Full story mode saves",
  },
  {
    name: "Valorant",
    image:
      "https://cdn2.unrealengine.com/egs-valorant-riotgames-s1-2560x1440-4742836df9eb.jpg",
    poster: "/games/valorant.svg",
    platform: "PC",
    note: "Ranked practice station",
  },
  {
    name: "Spider-Man 2",
    image: STEAM(2651280),
    poster: "/games/spider-man-2.svg",
    platform: "PS5",
    note: "4K 120Hz performance mode",
  },
  {
    name: "GTA V Online",
    image: STEAM(271590),
    poster: "/games/gta-v.svg",
    platform: "Both",
    note: "Crew sessions every evening",
  },
  {
    name: "Tekken 8",
    image: STEAM(1778820),
    poster: "/games/tekken-8.svg",
    platform: "Both",
    note: "Arcade sticks available",
  },
  {
    name: "Elden Ring",
    image: STEAM(1245620),
    poster: "/games/elden-ring.svg",
    platform: "Both",
    note: "Co-op boss runs",
  },
  {
    name: "Gran Turismo 7",
    image:
      "https://image.api.playstation.com/vulcan/ap/rnd/202109/1321/yZ7dpmjtHr1olhutHT57IFRh.png",
    poster: "/games/gran-turismo-7.svg",
    platform: "PS5",
    note: "Racing wheel setup",
  },
];

export const PLANS = [
  {
    name: "Solo Hour",
    price: "₹120",
    unit: "/ hour",
    featured: false,
    perks: ["1 PS5 or PC seat", "Any game from the library", "Headset included", "Walk-in friendly"],
  },
  {
    name: "Squad Pack",
    price: "₹400",
    unit: "/ hour",
    featured: true,
    badge: "Most booked",
    perks: ["4 seats together", "PS5 or PC, your call", "Free snack refill", "Priority on weekends"],
  },
  {
    name: "Day Pass",
    price: "₹700",
    unit: "/ day",
    featured: false,
    perks: ["Unlimited hours till closing", "Switch between PS5 and PC", "Tournament entry included", "Locker access"],
  },
];
