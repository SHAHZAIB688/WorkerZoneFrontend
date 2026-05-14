/** Hero carousel — verified CDN URLs (prior Unsplash IDs returned 404). */
export const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80",
  "https://images.pexels.com/photos/8961064/pexels-photo-8961064.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/5691602/pexels-photo-5691602.jpeg?auto=compress&cs=tinysrgb&w=900",
];

export const TOP_SPECIALITIES = [
  "General Handyman",
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "AC Installation",
  "TV Installation",
  "HVAC Technician",
];

/** Worker registration & profile trade options (kept in sync with backend doctor specializations list). */
export const DOCTOR_SIGNUP_SPECIALIZATIONS = [
  "General Handyman",
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "AC Installation",
  "TV Installation",
  "Mason & Tiler",
  "HVAC Technician",
  "Welder",
  "Roofer",
  "Locksmith",
  "Appliance Repair",
  "Pest Control",
  "Deep Cleaner",
  "Gardener & Landscaper",
  "Moving & Packing",
  "Security System Installer",
  "CCTV & Alarm Technician",
  "Auto Mechanic",
  "Steel Fabricator",
  "Scaffold Worker",
  "General Laborer",
  "Glass & Aluminum Installer",
];

export const HOW_IT_WORKS_STEPS = [
  { title: "Search Workers", text: "Browse verified tradespeople by trade, ratings, and availability." },
  { title: "Review Profile", text: "Check experience, service rate, and client feedback before booking." },
  { title: "Book a Slot", text: "Choose your date and preferred time in seconds." },
  { title: "Get the Job Done", text: "Track your booking and stay updated until the work is completed." },
];

export const FAQ_ITEMS = [
  {
    q: "How do I book a worker?",
    a: "Go to Find Workers, open a profile, pick a date and time slot, and confirm your booking.",
  },
  {
    q: "Are workers verified on Worker Zone?",
    a: "Yes. Listed professionals are verified before they appear for client bookings.",
  },
  {
    q: "Can I pay online for bookings?",
    a: "Yes, Stripe checkout is integrated for secure online payments.",
  },
  {
    q: "Can I update my profile details anytime?",
    a: "Yes, the dashboard includes profile sections where you can edit your details anytime.",
  },
];

/**
 * Portrait avatars keyed by `home.testimonials[].id` (same id in EN/UR).
 * Male names → portraits/men; female names → portraits/women (randomuser.me).
 */
export const TESTIMONIAL_MEDIA_BY_ID = {
  home_testimonial_ali: {
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
  },
  home_testimonial_fatima: {
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
  },
  home_testimonial_usman: {
    image: "https://randomuser.me/api/portraits/men/76.jpg",
    rating: 4,
  },
  home_testimonial_ayesha: {
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    rating: 5,
  },
  home_testimonial_hassan: {
    image: "https://randomuser.me/api/portraits/men/51.jpg",
    rating: 4,
  },
};
