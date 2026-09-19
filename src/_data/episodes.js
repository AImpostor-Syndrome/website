/**
 * Episode list, newest first.
 *
 * Seeded with the two real sessions recorded so far. The homepage features
 * episodes[0] and lists the rest.
 *
 * `published: false` means the session happened but its episode page isn't
 * live yet — the page is what US-1c (#2) builds and US-3 (#4) publishes. Once
 * those land, this file is what they append to, and `url` points at the real
 * episode page instead of being omitted.
 */
export default [
  {
    num: "EP 002",
    date: "Jul 18, 2026",
    dateISO: "2026-07-18",
    dur: "—",
    title: "The first tracer bullet takes shape",
    blurb:
      "We scope the thinnest slice that still proves the whole idea: a session doc becomes an AI-drafted post on a live page. Half the session is arguing about where the website should live.",
    published: false,
  },
  {
    num: "EP 001",
    date: "Jul 12, 2026",
    dateISO: "2026-07-12",
    dur: "76 min",
    title: "Scaffolding the brain, and the first skill that didn't survive contact",
    blurb:
      "Empty repo, two engineers, and a shared memory to design. We build the brain's six areas, then kill our first planned skill after finding YouTube's API locks uploaded videos private forever.",
    published: false,
  },
];
