export const navLinks = [
  { label: "About Us", href: "/about-us" },
  { label: "Our Story", href: "/our-story" },
  { label: "Platform", href: "/platform" },
  { label: "Press & Media", href: "/press" },
  { label: "Partners", href: "/partners" },
  { label: "Careers", href: "/careers" },
] as const;

export const pillars = [
  {
    id: "signal",
    label: "Signal",
    title: "We read the market before it moves.",
    body: "Consumer behaviour, demand and whitespace, sorted into a single opportunity score.",
  },
  {
    id: "build",
    label: "Build",
    title: "AI does the heavy lifting.",
    body: "Product, brand and go-to-market assembled by a small team, not a large one.",
  },
  {
    id: "run",
    label: "Run",
    title: "The system keeps it running.",
    body: "Distribution, content and operations kept alive by the same engine that built it.",
  },
] as const;

export const labSteps = [
  {
    id: "01",
    title: "Reading demand",
    body: "Consumer signals, whitespace and demand patterns scored into a single opportunity read.",
  },
  {
    id: "02",
    title: "Product & brand",
    body: "Formulation, packaging, identity and launch assets assembled by the build system.",
  },
  {
    id: "03",
    title: "Go-to-market",
    body: "Content, channels and campaigns orchestrated from one operating layer.",
  },
  {
    id: "04",
    title: "Distribution & ops",
    body: "Inventory, fulfilment and performance loops kept running after launch.",
  },
] as const;

export const brands = [
  {
    number: "1",
    name: "HIRA",
    status: "live" as const,
    description: "Bodycare — Meolaa's first brand, live and shipping.",
    cta: "View brand ↗",
  },
  {
    number: "2",
    name: "Brand 02",
    status: "coming-soon" as const,
    description: "Beauty — Validated opportunity, in build.",
    cta: "Coming soon",
  },
  {
    number: "3",
    name: "Brand 03",
    status: "coming-soon" as const,
    description: "TBD — Next signal in the pipeline.",
    cta: "Coming soon",
  },
] as const;

export const metrics = [
  { value: "$6M", label: "Raised across seed rounds", height: "h-[176px]", top: "top-[275px]" },
  { value: "120+", label: "Categories mapped", height: "h-[260px]", top: "top-[191px]" },
  { value: "1", label: "Brand live", height: "h-[359px]", top: "top-[92px]" },
  { value: "3", label: "Market Served", height: "h-[451px]", top: "top-0" },
] as const;

export const whereToNext = [
  {
    number: "02",
    title: "About Us",
    hook: "The thesis behind an AI-native brand company. →",
    href: "/about-us",
  },
  {
    number: "04",
    title: "Meolaa Lab",
    hook: "How the OS finds and builds every brand. →",
    href: "/platform",
  },
  {
    number: "07",
    title: "Careers",
    hook: "Build with a small team, real ownership. →",
    href: "/careers",
  },
] as const;
