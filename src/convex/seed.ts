import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { nextCertificateId, nextRegistrationId } from "./helpers";
import type { FormField } from "./schema";

const H = 3_600_000;
const D = 86_400_000;

const PARTICIPANTS: Array<[string, string]> = [
  ["Arafat Rahman", "arafat.rahman@drmc.edu.bd"],
  ["Nusrat Jahan", "nusrat.jahan@drmc.edu.bd"],
  ["Tanvir Ahmed", "tanvir.ahmed@drmc.edu.bd"],
  ["Sadia Islam", "sadia.islam@drmc.edu.bd"],
  ["Rafiul Karim", "rafiul.karim@drmc.edu.bd"],
  ["Mahin Chowdhury", "mahin.chowdhury@drmc.edu.bd"],
  ["Farhana Akter", "farhana.akter@drmc.edu.bd"],
  ["Sajid Hossain", "sajid.hossain@drmc.edu.bd"],
  ["Lamia Haque", "lamia.haque@drmc.edu.bd"],
  ["Imran Kabir", "imran.kabir@drmc.edu.bd"],
  ["Zarin Tasnim", "zarin.tasnim@drmc.edu.bd"],
  ["Fahim Shahriar", "fahim.shahriar@drmc.edu.bd"],
  ["Anika Tabassum", "anika.tabassum@drmc.edu.bd"],
  ["Rakibul Hasan", "rakibul.hasan@drmc.edu.bd"],
  ["Mim Akter", "mim.akter@drmc.edu.bd"],
  ["Shanto Roy", "shanto.roy@drmc.edu.bd"],
  ["Priya Das", "priya.das@drmc.edu.bd"],
  ["Arif Mahmud", "arif.mahmud@drmc.edu.bd"],
  ["Nafis Iqbal", "nafis.iqbal@drmc.edu.bd"],
  ["Tasnim Rahman", "tasnim.rahman@drmc.edu.bd"],
  ["Jubayer Alam", "jubayer.alam@drmc.edu.bd"],
  ["Samira Khatun", "samira.khatun@drmc.edu.bd"],
  ["Naimur Rashid", "naimur.rashid@drmc.edu.bd"],
  ["Oishee Bhowmik", "oishee.bhowmik@drmc.edu.bd"],
  ["Tawsif Anam", "tawsif.anam@drmc.edu.bd"],
  ["Raisa Mehjabin", "raisa.mehjabin@drmc.edu.bd"],
];

const WEBDEV_TEAMS = [
  "Pixel Pirates", "Byte Builders", "Neon Coders", "Ctrl+Alt+Elite",
  "Bug Busters", "Kernel Panic", "Lambda Legends", "Overflow Squad",
  "Async Avengers", "Null Pointers", "Stack Overflowers", "The Optimizers",
  "Query Ducks", "Segfault Squad", "Bit Lords", "Cache Money",
  "Div Zero", "Merge Conflicts",
];

const ROBOTICS_TEAMS = [
  "Torque Titans", "Circuit Breakers", "Gear Grinders", "Volt Volt Volt",
  "Servo Squad", "Iron Jaw", "Mecha Mavericks", "Ohm Rangers", "Wired Wizards",
];

function track(i: number, options: string[]): string {
  return options[i % options.length];
}

export const ensureSeeded = mutation({
  args: {},
  handler: async (ctx) => runSeed(ctx),
});

/**
 * Idempotent demo-data seed. Safe to call from any mutation — it no-ops once
 * the `meta.seeded` lock exists. Exposed as a shared helper so demo login can
 * guarantee the club/events exist before assigning a role.
 */
export async function runSeed(ctx: MutationCtx): Promise<{ seeded: boolean }> {
    const lock = await ctx.db
      .query("meta")
      .withIndex("by_key", (q) => q.eq("key", "seeded"))
      .first();
    if (lock) return { seeded: false };
    await ctx.db.insert("meta", { key: "seeded", value: new Date().toISOString() });

    const now = Date.now();

    // ── Club ──────────────────────────────────────────────────────────────
    const clubId = await ctx.db.insert("clubs", {
      name: "DRMC IT Club",
      slug: "drmc-tech-carnival",
      description:
        "The official technology club of Dhaka Residential Model College, organizing the 9th DRMC International Tech Carnival 2026.",
      contactEmail: "techclub@drmc.edu.bd",
      website: "https://drmctech.dev",
      facebook: "https://facebook.com/drmctechclub",
      createdAt: now - 400 * D,
    });

    // ── Staff users (not sign-in accounts; demo data owners) ─────────────
    const organizerId = await ctx.db.insert("users", {
      name: "Rehan Chowdhury",
      email: "organizer@drmctech.dev",
      role: "organizer",
      clubId,
    });
    const volunteerUserIds: Id<"users">[] = [];
    for (const [name, email] of [
      ["Nabila Sultana", "nabila.sultana@drmc.edu.bd"],
      ["Omar Faruk", "omar.faruk@drmc.edu.bd"],
    ] as const) {
      volunteerUserIds.push(
        await ctx.db.insert("users", { name, email, role: "volunteer", clubId }),
      );
    }

    // ── Participant users ─────────────────────────────────────────────────
    const userIds: Id<"users">[] = [];
    for (const [name, email] of PARTICIPANTS) {
      userIds.push(await ctx.db.insert("users", { name, email, role: "participant" }));
    }

    const addReg = async (r: {
      eventId: Id<"events">;
      userId: Id<"users">;
      status: "pending" | "confirmed" | "cancelled" | "rejected";
      type: "individual" | "team";
      teamName?: string;
      teamMembers?: Array<{ name: string; email?: string }>;
      answers: Array<{ fieldId: string; value: string | number | boolean | string[] }>;
      createdAt: number;
      checkedInAt?: number;
    }) => {
      const registrationId = await nextRegistrationId(ctx);
      return await ctx.db.insert("registrations", {
        ...r,
        teamMembers: r.teamMembers ?? [],
        registrationId,
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
      });
    };

    const ans = (o: Record<string, string | number | boolean | string[]>) =>
      Object.entries(o).map(([fieldId, value]) => ({ fieldId, value }));

    // ── Event 1: Web Development Challenge (LIVE, team) ───────────────────
    const webdevFields: FormField[] = [
      { id: "f_name", type: "text", label: "Team leader full name", required: true },
      { id: "f_email", type: "email", label: "Team leader email", required: true },
      { id: "f_phone", type: "phone", label: "Team leader phone (WhatsApp)", required: true },
      { id: "f_track", type: "radio", label: "Track", required: true, options: ["Frontend", "Backend", "Full-Stack"] },
      { id: "f_stack", type: "multiselect", label: "Preferred technologies", description: "Shown for Full-Stack teams", required: false, options: ["React", "Next.js", "Node.js", "PostgreSQL", "MongoDB", "Tailwind CSS"], dependsOn: { fieldId: "f_track", value: "Full-Stack" } },
      { id: "f_idea", type: "textarea", label: "Briefly describe your project idea", required: false },
    ];
    const webdevId = await ctx.db.insert("events", {
      clubId,
      createdBy: organizerId,
      title: "Web Development Challenge",
      slug: "web-development-challenge",
      category: "Technology",
      shortDescription: "48-hour sprint to design, build and pitch a working web product.",
      description:
        "Teams of 2–4 build a complete web application from scratch in 48 hours. You'll get a theme reveal at kickoff, mentor check-ins every 8 hours, and a live demo before the judges. Judging covers functionality, design, code quality and the pitch.",
      status: "live",
      startAt: now + 1.5 * D,
      endAt: now + 3 * D,
      venue: "Auditorium A, DRMC Campus",
      capacity: 40,
      registrationDeadline: now - 0.5 * D,
      teamEvent: true,
      minTeamSize: 2,
      maxTeamSize: 4,
      requiresApproval: false,
      formFields: webdevFields,
      prizes: "Champion ৳25,000 · Runner-up ৳15,000 · 2nd Runner-up ৳10,000 · Best UI ৳5,000",
      eligibility: "Students of class 8–12 or equivalent. Teams may mix grades.",
      rules:
        "1. All code must be written during the event.\n2. Open-source libraries are allowed.\n3. No pre-built templates or admin panels.\n4. Each team must demo live for 5 minutes.",
      contactEmail: "webdev@drmctech.dev",
      contactPhone: "+880 1700-000001",
      faq: [
        { q: "Do all team members need to attend?", a: "At least 2 members must be present at check-in and the demo." },
        { q: "Can we use AI coding assistants?", a: "Yes, but you must disclose it during your pitch." },
      ],
      schedule: [
        { id: "s1", title: "Doors open & check-in", time: "Day 1 · 9:00 AM", description: "Bring your student ID and laptop." },
        { id: "s2", title: "Opening ceremony", time: "Day 1 · 10:00 AM" },
        { id: "s3", title: "Theme reveal & kickoff", time: "Day 1 · 11:00 AM" },
        { id: "s4", title: "Hacking sprint", time: "Day 1 · 11:30 AM – Day 3 · 11:30 AM" },
        { id: "s5", title: "Final demos & judging", time: "Day 3 · 1:00 PM" },
        { id: "s6", title: "Prize giving", time: "Day 3 · 4:30 PM" },
      ],
      coverTheme: 0,
      publishedAt: now - 20 * D,
      createdAt: now - 30 * D,
      updatedAt: now - 2 * H,
    });

    // ── Event 2: Robotics Arena (published, team 3–5) ─────────────────────
    const roboticsFields: FormField[] = [
      { id: "f_contact_email", type: "email", label: "Team contact email", required: true },
      { id: "f_phone", type: "phone", label: "Contact number", required: true },
      { id: "f_theme", type: "radio", label: "Competition track", required: true, options: ["Line Follower", "Sumo Fight", "Obstacle Race"] },
      { id: "f_kit", type: "select", label: "Kit preference", description: "Club kits can be borrowed, subject to availability.", required: true, options: ["Arduino Kit (club)", "ESP32 Kit (club)", "Custom Build"] },
      { id: "f_battery", type: "checkbox", label: "We will bring our own battery pack", required: false },
    ];
    const roboticsId = await ctx.db.insert("events", {
      clubId,
      createdBy: organizerId,
      title: "Robotics Arena",
      slug: "robotics-arena",
      category: "Robotics",
      shortDescription: "Build, battle and race autonomous robots across three arenas.",
      description:
        "Teams of 3–5 design and build autonomous robots to compete in Line Follower, Sumo Fight or Obstacle Race arenas. Club kits are available to borrow. Technical support desks run all day.",
      status: "published",
      startAt: now + 6 * D,
      endAt: now + 6.4 * D,
      venue: "Robotics Lab, Block C",
      capacity: 24,
      registrationDeadline: now + 3 * D,
      teamEvent: true,
      minTeamSize: 3,
      maxTeamSize: 5,
      requiresApproval: false,
      formFields: roboticsFields,
      prizes: "Champion ৳20,000 per track · Best Innovation ৳7,000",
      eligibility: "Open to all teams from class 6–12.",
      rules: "1. Autonomous robots only.\n2. Maximum 25cm × 25cm footprint.\n3. Battery voltage limit 12V.",
      contactEmail: "robotics@drmctech.dev",
      contactPhone: "+880 1700-000002",
      faq: [{ q: "Can we bring our own microcontroller?", a: "Yes — choose 'Custom Build' in the registration form." }],
      schedule: [
        { id: "s1", title: "Registration desk opens", time: "9:00 AM" },
        { id: "s2", title: "Practice rounds", time: "10:00 AM – 12:00 PM" },
        { id: "s3", title: "Qualifiers", time: "12:30 PM" },
        { id: "s4", title: "Finals", time: "3:00 PM" },
        { id: "s5", title: "Prize giving", time: "5:00 PM" },
      ],
      coverTheme: 1,
      publishedAt: now - 10 * D,
      createdAt: now - 15 * D,
      updatedAt: now - 10 * D,
    });

    // ── Event 3: AI Innovation Challenge (published, individual, approval) ─
    const aiFields: FormField[] = [
      { id: "f_name", type: "text", label: "Full name", required: true },
      { id: "f_email", type: "email", label: "Email", required: true },
      { id: "f_phone", type: "phone", label: "Phone", required: true },
      { id: "f_focus", type: "select", label: "Primary AI focus area", required: true, options: ["Machine Learning", "Computer Vision", "NLP", "Generative AI", "Other"] },
      { id: "f_experience", type: "select", label: "Experience with AI tools", required: true, options: ["Beginner", "Intermediate", "Advanced"] },
      { id: "f_proposal", type: "textarea", label: "Describe the problem you want to solve", description: "Max 200 words. Shortlisted entries get mentor support.", required: true },
      { id: "f_portfolio", type: "text", label: "GitHub / portfolio link", required: false },
    ];
    const aiId = await ctx.db.insert("events", {
      clubId,
      createdBy: organizerId,
      title: "AI Innovation Challenge",
      slug: "ai-innovation-challenge",
      category: "Technology",
      shortDescription: "Propose and prototype an AI solution to a real community problem.",
      description:
        "Individual participants submit a problem statement, then prototype an AI-powered solution with mentor support. Shortlisted projects present to a panel of industry judges.",
      status: "published",
      startAt: now + 10 * D,
      endAt: now + 11 * D,
      venue: "Innovation Hub, 3rd Floor",
      capacity: 40,
      registrationDeadline: now + 7 * D,
      teamEvent: false,
      requiresApproval: true,
      formFields: aiFields,
      prizes: "Grand Prize ৳30,000 · Two category awards ৳10,000 each",
      eligibility: "Students of class 9–12. One entry per person.",
      rules: "1. Proposals are reviewed before confirmation.\n2. Pre-trained models allowed.\n3. Final demo must run live.",
      contactEmail: "ai@drmctech.dev",
      faq: [
        { q: "When will my registration be approved?", a: "Proposals are reviewed within 48 hours of submission." },
      ],
      schedule: [
        { id: "s1", title: "Check-in & booth setup", time: "9:00 AM" },
        { id: "s2", title: "Mentor round", time: "10:30 AM" },
        { id: "s3", title: "Prototype sprint", time: "11:00 AM – 3:00 PM" },
        { id: "s4", title: "Final presentations", time: "4:00 PM" },
      ],
      coverTheme: 2,
      publishedAt: now - 8 * D,
      createdAt: now - 12 * D,
      updatedAt: now - 8 * D,
    });

    // ── Event 4: UI/UX Design Sprint (published, individual) ──────────────
    const designFields: FormField[] = [
      { id: "f_name", type: "text", label: "Full name", required: true },
      { id: "f_email", type: "email", label: "Email", required: true },
      { id: "f_phone", type: "phone", label: "Phone", required: true },
      { id: "f_tools", type: "multiselect", label: "Design tools you use", required: true, options: ["Figma", "Adobe XD", "Sketch", "Pen & Paper"] },
      { id: "f_track", type: "radio", label: "Track", required: true, options: ["UI Design", "UX Research", "Full Product Case"] },
      { id: "f_portfolio", type: "text", label: "Portfolio link", required: false },
      { id: "f_dietary", type: "select", label: "Dietary preference (for catering)", required: false, options: ["None", "Vegetarian", "Vegan"] },
    ];
    const designId = await ctx.db.insert("events", {
      clubId,
      createdBy: organizerId,
      title: "UI/UX Design Sprint",
      slug: "uiux-design-sprint",
      category: "Design",
      shortDescription: "One-day design sprint from research to a clickable prototype.",
      description:
        "A one-day sprint where designers research, wireframe and prototype a product for a real local business. Mentors from design studios review work at every checkpoint.",
      status: "published",
      startAt: now + 13 * D,
      endAt: now + 13.6 * D,
      venue: "Design Studio, Block B",
      capacity: 50,
      registrationDeadline: now + 9 * D,
      teamEvent: false,
      requiresApproval: false,
      formFields: designFields,
      prizes: "Sprint Winner ৳12,000 · People's Choice ৳5,000",
      eligibility: "Open to all students.",
      rules: "1. Bring your own laptop with Figma installed.\n2. Teams of one only.",
      contactEmail: "design@drmctech.dev",
      faq: [{ q: "Is this beginner friendly?", a: "Yes — the UX Research track is designed for first-timers." }],
      schedule: [
        { id: "s1", title: "Check-in", time: "9:00 AM" },
        { id: "s2", title: "Brief & team pairing", time: "9:30 AM" },
        { id: "s3", title: "Sprint rounds", time: "10:00 AM – 4:00 PM" },
        { id: "s4", title: "Showcase & judging", time: "4:30 PM" },
      ],
      coverTheme: 3,
      publishedAt: now - 5 * D,
      createdAt: now - 9 * D,
      updatedAt: now - 5 * D,
    });

    // ── Event 5: Programming Contest (completed, individual) ──────────────
    const pcFields: FormField[] = [
      { id: "f_name", type: "text", label: "Full name", required: true },
      { id: "f_email", type: "email", label: "Email", required: true },
      { id: "f_phone", type: "phone", label: "Phone", required: true },
      { id: "f_lang", type: "radio", label: "Preferred language", required: true, options: ["C++", "Java", "Python"] },
      { id: "f_exp", type: "select", label: "Competitive programming experience", required: true, options: ["Beginner", "Intermediate", "Advanced"] },
      { id: "f_shirt", type: "select", label: "T-shirt size", required: true, options: ["S", "M", "L", "XL"] },
    ];
    const pcStart = now - 12 * D;
    const pcId = await ctx.db.insert("events", {
      clubId,
      createdBy: organizerId,
      title: "Programming Contest",
      slug: "programming-contest",
      category: "Technology",
      shortDescription: "5-hour individual contest with 10 algorithmic problems.",
      description:
        "A 5-hour individual contest with 10 problems across algorithms, data structures and math. Open to all skill levels with a dedicated beginner division.",
      status: "completed",
      startAt: pcStart,
      endAt: pcStart + 5 * H,
      venue: "Computer Lab 1 & 2",
      capacity: 60,
      registrationDeadline: pcStart - 3 * D,
      teamEvent: false,
      requiresApproval: false,
      formFields: pcFields,
      prizes: "Champion ৳15,000 · Runner-up ৳10,000 · 2nd Runner-up ৳7,000",
      eligibility: "Open to all students.",
      rules: "1. ICPC-style rules.\n2. No internet access during the contest.",
      contactEmail: "contest@drmctech.dev",
      faq: [],
      schedule: [
        { id: "s1", title: "Check-in", time: "9:00 AM" },
        { id: "s2", title: "Contest", time: "10:00 AM – 3:00 PM" },
        { id: "s3", title: "Prize giving", time: "4:00 PM" },
      ],
      coverTheme: 4,
      publishedAt: pcStart - 20 * D,
      createdAt: pcStart - 25 * D,
      updatedAt: pcStart + 6 * H,
    });

    // ── Event 6: Cultural Night (draft) ────────────────────────────────────
    await ctx.db.insert("events", {
      clubId,
      createdBy: organizerId,
      title: "Cultural Night — Fusion Beats",
      slug: "cultural-night-fusion-beats",
      category: "Cultural",
      shortDescription: "An evening of music, poetry and light — carnival closing ceremony.",
      description:
        "The closing ceremony of the carnival: live bands, poetry, and an awards recap of the week.",
      status: "draft",
      startAt: now + 20 * D,
      endAt: now + 20.3 * D,
      venue: "Main Field",
      capacity: 100,
      registrationDeadline: now + 17 * D,
      teamEvent: false,
      requiresApproval: false,
      formFields: [
        { id: "f_name", type: "text", label: "Full name", required: true },
        { id: "f_email", type: "email", label: "Email", required: true },
      ],
      contactEmail: "culture@drmctech.dev",
      faq: [],
      schedule: [],
      coverTheme: 5,
      createdAt: now - 2 * D,
      updatedAt: now - 2 * D,
    });

    // ── Event 7: Quiz Championship (published, individual) ──────────────
    const quizFields: FormField[] = [
      { id: "f_name", type: "text", label: "Full name", required: true },
      { id: "f_email", type: "email", label: "Email", required: true },
      { id: "f_phone", type: "phone", label: "Phone", required: true },
      { id: "f_grade", type: "select", label: "Grade / Class", required: true, options: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"] },
      { id: "f_rounds", type: "radio", label: "Preferred round format", required: false, options: ["Written", "On-stage", "No preference"] },
    ];
    const quizId = await ctx.db.insert("events", {
      clubId,
      createdBy: organizerId,
      title: "Quiz Championship",
      slug: "quiz-championship",
      category: "Technology",
      shortDescription: "Six rounds of rapid-fire tech, science and GK quizzing.",
      description:
        "An inter-school quiz championship across six rounds — written qualifiers, buzzer rounds and a live on-stage final. Teams of two compete for the rolling ClubFlow quiz shield.",
      status: "published",
      startAt: now + 8 * D,
      endAt: now + 8.3 * D,
      venue: "Auditorium B, DRMC Campus",
      capacity: 80,
      registrationDeadline: now + 5 * D,
      teamEvent: false,
      requiresApproval: false,
      formFields: quizFields,
      prizes: "Champion ৳8,000 · Runner-up ৳5,000 · Top school trophy",
      eligibility: "Open to students of class 6–12. Teams of two.",
      rules: "1. Written qualifiers are individual.\n2. Finals are played in pairs.\n3. No phones during rounds.",
      contactEmail: "quiz@drmctech.dev",
      contactPhone: "+880 1700-000003",
      faq: [{ q: "Can I participate solo?", a: "Yes — you'll be paired with another participant for the final if you qualify." }],
      schedule: [
        { id: "s1", title: "Registration desk opens", time: "1:00 PM" },
        { id: "s2", title: "Written qualifiers", time: "1:30 PM" },
        { id: "s3", title: "Buzzer rounds", time: "3:00 PM" },
        { id: "s4", title: "Grand final", time: "4:30 PM" },
      ],
      coverTheme: 2,
      publishedAt: now - 6 * D,
      createdAt: now - 9 * D,
      updatedAt: now - 6 * D,
    });

    // ── Event 8: Gaming Tournament (published, team 2–4) ─────────────────
    const gamingFields: FormField[] = [
      { id: "f_team", type: "text", label: "Team name", required: true },
      { id: "f_captain_email", type: "email", label: "Captain email", required: true },
      { id: "f_phone", type: "phone", label: "Captain phone", required: true },
      { id: "f_game", type: "select", label: "Game", required: true, options: ["Valorant", "FIFA 26", "Chess", "Mobile Legends"] },
      { id: "f_rank", type: "text", label: "Team rank / rating", required: false },
    ];
    const gamingId = await ctx.db.insert("events", {
      clubId,
      createdBy: organizerId,
      title: "Gaming Tournament",
      slug: "gaming-tournament",
      category: "Gaming",
      shortDescription: "Bracket-style esports showdown across four titles.",
      description:
        "Single-elimination brackets across Valorant, FIFA, Chess and Mobile Legends. LAN stations, referees and a live spectator stream for the finals.",
      status: "published",
      startAt: now + 5 * D,
      endAt: now + 5.4 * D,
      venue: "Game Lounge, Block A",
      capacity: 64,
      registrationDeadline: now + 3 * D,
      teamEvent: true,
      minTeamSize: 2,
      maxTeamSize: 4,
      requiresApproval: false,
      formFields: gamingFields,
      prizes: "Per-title champion ৳6,000 · MVP award ৳2,000",
      eligibility: "Open to all students. One team per title per participant.",
      rules: "1. No emulators or third-party cheats.\n2. Referee decisions are final.\n3. Be at your station 15 minutes before your match.",
      contactEmail: "gaming@drmctech.dev",
      faq: [{ q: "Do we bring our own peripherals?", a: "Mice, keyboards and headsets are allowed; consoles and monitors are provided." }],
      schedule: [
        { id: "s1", title: "Check-in & seeding", time: "10:00 AM" },
        { id: "s2", title: "Group stage", time: "11:00 AM – 1:00 PM" },
        { id: "s3", title: "Playoffs", time: "1:30 PM – 3:30 PM" },
        { id: "s4", title: "Finals & prize giving", time: "4:00 PM" },
      ],
      coverTheme: 3,
      publishedAt: now - 4 * D,
      createdAt: now - 7 * D,
      updatedAt: now - 4 * D,
    });

    // ── Event 9: Photography Challenge (registration_closed, individual) ─
    const photoFields: FormField[] = [
      { id: "f_name", type: "text", label: "Full name", required: true },
      { id: "f_email", type: "email", label: "Email", required: true },
      { id: "f_phone", type: "phone", label: "Phone", required: true },
      { id: "f_theme", type: "select", label: "Preferred theme", required: true, options: ["Street", "Portrait", "Nature", "Architecture"] },
      { id: "f_gear", type: "text", label: "Camera / phone used", required: false },
      { id: "f_link", type: "text", label: "Portfolio link", required: false },
    ];
    const photoId = await ctx.db.insert("events", {
      clubId,
      createdBy: organizerId,
      title: "Photography Challenge",
      slug: "photography-challenge",
      category: "Design",
      shortDescription: "48 hours, one theme, three photos — judged live on the wall.",
      description:
        "A 48-hour photography sprint. Participants shoot against a released theme, submit three frames, and prints go up on the carnival gallery wall for public voting and jury judging.",
      status: "registration_closed",
      startAt: now + 2 * D,
      endAt: now + 4 * D,
      venue: "Art Block, Ground Floor",
      capacity: 50,
      registrationDeadline: now - 1 * D,
      teamEvent: false,
      requiresApproval: false,
      formFields: photoFields,
      prizes: "Best Shot ৳7,000 · People's Choice ৳3,000",
      eligibility: "Open to all students. Any camera, including phones.",
      rules: "1. Photos must be shot during the challenge window.\n2. Minimal editing — crops and exposure only.\n3. One submission set per participant.",
      contactEmail: "photo@drmctech.dev",
      faq: [{ q: "Can I submit phone photos?", a: "Yes — phones are explicitly welcome." }],
      schedule: [
        { id: "s1", title: "Theme reveal", time: "Day 1 · 9:00 AM" },
        { id: "s2", title: "Shoot window", time: "Day 1 – Day 3" },
        { id: "s3", title: "Submission deadline", time: "Day 3 · 6:00 PM" },
        { id: "s4", title: "Gallery wall & judging", time: "Day 4 · 12:00 PM" },
      ],
      coverTheme: 4,
      publishedAt: now - 10 * D,
      createdAt: now - 14 * D,
      updatedAt: now - 1 * D,
    });

    // ── Registrations ──────────────────────────────────────────────────────
    // Programming Contest: 47 confirmed (44 checked in) + 2 cancelled, 14–20 days ago
    const langOpts = ["C++", "Java", "Python"];
    const expOpts = ["Beginner", "Intermediate", "Advanced"];
    const shirtOpts = ["S", "M", "L", "XL"];
    for (let i = 0; i < 49; i++) {
      const cancelled = i >= 47;
      const checkedIn = i < 44 && !cancelled;
      await addReg({
        eventId: pcId,
        userId: userIds[i % userIds.length],
        status: cancelled ? "cancelled" : "confirmed",
        type: "individual",
        answers: ans({
          f_name: PARTICIPANTS[i % userIds.length][0],
          f_email: PARTICIPANTS[i % userIds.length][1],
          f_phone: `+88017${String(10000000 + i * 137).slice(0, 8)}`,
          f_lang: track(i, langOpts),
          f_exp: expOpts[i % 3],
          f_shirt: shirtOpts[i % 4],
        }),
        createdAt: pcStart - (14 - (i % 7)) * D - (i % 12) * H,
        checkedInAt: checkedIn ? pcStart + 30 * 60_000 + (i % 40) * 60_000 : undefined,
      });
    }

    // Web Development Challenge: 18 teams, 11 checked in, registered over last 12 days
    const tracksWD = ["Frontend", "Backend", "Full-Stack"];
    for (let i = 0; i < 18; i++) {
      const leader = userIds[i];
      const extra = 1 + (i % 3);
      const teamMembers = Array.from({ length: extra }, (_, m) => ({
        name: PARTICIPANTS[(i + 1 + m) % userIds.length][0],
        email: PARTICIPANTS[(i + 1 + m) % userIds.length][1],
      }));
      const t = tracksWD[i % 3];
      const answers: Array<{ fieldId: string; value: string | number | boolean | string[] }> = ans({
        f_name: PARTICIPANTS[i][0],
        f_email: PARTICIPANTS[i][1],
        f_phone: `+88018${String(20000000 + i * 311).slice(0, 8)}`,
        f_track: t,
      });
      if (t === "Full-Stack") answers.push({ fieldId: "f_stack", value: ["React", "Node.js", "Tailwind CSS"] });
      if (i % 2 === 0) answers.push({ fieldId: "f_idea", value: "A platform to coordinate club events end to end." });
      await addReg({
        eventId: webdevId,
        userId: leader,
        status: "confirmed",
        type: "team",
        teamName: WEBDEV_TEAMS[i],
        teamMembers,
        answers,
        createdAt: now - (12 - (i % 11)) * D - (i % 9) * H,
        checkedInAt: i < 11 ? now - 20 * H + i * 40 * 60_000 : undefined,
      });
    }

    // Robotics Arena: 9 teams confirmed
    const themesR = ["Line Follower", "Sumo Fight", "Obstacle Race"];
    for (let i = 0; i < 9; i++) {
      const leader = userIds[(i * 2) % userIds.length];
      const teamMembers = Array.from({ length: 2 + (i % 3) }, (_, m) => ({
        name: PARTICIPANTS[(i * 2 + 1 + m) % userIds.length][0],
        email: PARTICIPANTS[(i * 2 + 1 + m) % userIds.length][1],
      }));
      await addReg({
        eventId: roboticsId,
        userId: leader,
        status: "confirmed",
        type: "team",
        teamName: ROBOTICS_TEAMS[i],
        teamMembers,
        answers: ans({
          f_contact_email: PARTICIPANTS[(i * 2) % userIds.length][1],
          f_phone: `+88019${String(30000000 + i * 271).slice(0, 8)}`,
          f_theme: themesR[i % 3],
          f_kit: i % 3 === 0 ? "Arduino Kit (club)" : "Custom Build",
          f_battery: i % 2 === 0,
        }),
        createdAt: now - (9 - i) * D,
      });
    }

    // AI Innovation Challenge: 36 confirmed + 3 pending + 1 cancelled (almost full)
    const focusOpts = ["Machine Learning", "Computer Vision", "NLP", "Generative AI", "Other"];
    for (let i = 0; i < 40; i++) {
      const status = i < 36 ? "confirmed" : i < 39 ? "pending" : "cancelled";
      if (status === "cancelled") continue;
      await addReg({
        eventId: aiId,
        userId: userIds[(i + 3) % userIds.length],
        status: status as "confirmed" | "pending",
        type: "individual",
        answers: ans({
          f_name: PARTICIPANTS[(i + 3) % userIds.length][0],
          f_email: PARTICIPANTS[(i + 3) % userIds.length][1],
          f_phone: `+88016${String(40000000 + i * 353).slice(0, 8)}`,
          f_focus: focusOpts[i % focusOpts.length],
          f_experience: expOpts[i % 3],
          f_proposal: "An accessible learning companion that adapts lessons to each student's pace using on-device models.",
          ...(i % 4 === 0 ? { f_portfolio: `https://github.com/drmcstudent${i}` } : {}),
        }),
        createdAt: now - (10 - (i % 9)) * D,
      });
    }

    // UI/UX Design Sprint: 22 confirmed
    const toolOpts = ["Figma", "Adobe XD", "Sketch", "Pen & Paper"];
    const tracksD = ["UI Design", "UX Research", "Full Product Case"];
    for (let i = 0; i < 22; i++) {
      await addReg({
        eventId: designId,
        userId: userIds[(i + 8) % userIds.length],
        status: "confirmed",
        type: "individual",
        answers: ans({
          f_name: PARTICIPANTS[(i + 8) % userIds.length][0],
          f_email: PARTICIPANTS[(i + 8) % userIds.length][1],
          f_phone: `+88015${String(50000000 + i * 397).slice(0, 8)}`,
          f_tools: [toolOpts[i % toolOpts.length], "Figma"].filter((v, idx, a) => a.indexOf(v) === idx),
          f_track: tracksD[i % 3],
          ...(i % 3 === 0 ? { f_portfolio: `https://dribbble.com/drmc${i}` } : {}),
          f_dietary: i % 5 === 0 ? "Vegetarian" : "None",
        }),
        createdAt: now - (6 - (i % 6)) * D,
      });
    }

    // Quiz Championship: 34 confirmed + 3 pending
    const quizGrades = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
    for (let i = 0; i < 37; i++) {
      const status = i < 34 ? "confirmed" : "pending";
      await addReg({
        eventId: quizId,
        userId: userIds[(i + 5) % userIds.length],
        status,
        type: "individual",
        answers: ans({
          f_name: PARTICIPANTS[(i + 5) % userIds.length][0],
          f_email: PARTICIPANTS[(i + 5) % userIds.length][1],
          f_phone: `+88017${String(60000000 + i * 431).slice(0, 8)}`,
          f_grade: quizGrades[i % quizGrades.length],
          f_rounds: i % 3 === 0 ? "Written" : i % 3 === 1 ? "On-stage" : "No preference",
        }),
        createdAt: now - (6 - (i % 6)) * D - (i % 10) * H,
      });
    }

    // Gaming Tournament: 28 teams, 16 checked in
    const gameTitles = ["Valorant", "FIFA 26", "Chess", "Mobile Legends"];
    for (let i = 0; i < 28; i++) {
      const teamName = `${["Neon", "Storm", "Shadow", "Blitz", "Apex", "Frost"][i % 6]} ${["Vipers", "Riders", "Wolves", "Foxes", "Titans"][i % 5]} ${i + 1}`;
      const extra = 1 + (i % 3);
      const teamMembers = Array.from({ length: extra }, (_, m) => ({
        name: PARTICIPANTS[(i + 2 + m) % userIds.length][0],
        email: PARTICIPANTS[(i + 2 + m) % userIds.length][1],
      }));
      await addReg({
        eventId: gamingId,
        userId: userIds[(i + 2) % userIds.length],
        status: "confirmed",
        type: "team",
        teamName,
        teamMembers,
        answers: ans({
          f_team: teamName,
          f_captain_email: PARTICIPANTS[(i + 2) % userIds.length][1],
          f_phone: `+88018${String(70000000 + i * 617).slice(0, 8)}`,
          f_game: gameTitles[i % gameTitles.length],
          f_rank: i % 2 === 0 ? `#${2000 + i * 37}` : "",
        }),
        createdAt: now - (5 - (i % 5)) * D,
        checkedInAt: i < 16 ? now - 30 * H + i * 45 * 60_000 : undefined,
      });
    }

    // Photography Challenge: 30 confirmed, registration closed
    const photoThemes = ["Street", "Portrait", "Nature", "Architecture"];
    for (let i = 0; i < 30; i++) {
      await addReg({
        eventId: photoId,
        userId: userIds[(i + 11) % userIds.length],
        status: "confirmed",
        type: "individual",
        answers: ans({
          f_name: PARTICIPANTS[(i + 11) % userIds.length][0],
          f_email: PARTICIPANTS[(i + 11) % userIds.length][1],
          f_phone: `+88019${String(80000000 + i * 523).slice(0, 8)}`,
          f_theme: photoThemes[i % photoThemes.length],
          f_gear: i % 2 === 0 ? "iPhone 15" : "Canon EOS 250D",
          ...(i % 3 === 0 ? { f_link: `https://behance.net/drmcphoto${i}` } : {}),
        }),
        createdAt: now - (7 - (i % 7)) * D,
      });
    }

    // ── Volunteers ─────────────────────────────────────────────────────────
    for (let i = 0; i < volunteerUserIds.length; i++) {
      await ctx.db.insert("volunteers", {
        userId: volunteerUserIds[i],
        clubId,
        name: i === 0 ? "Nabila Sultana" : "Omar Faruk",
        role: i === 0 ? "checkin" : "registration_desk",
        eventIds: [webdevId, roboticsId, aiId],
        status: "active",
        addedBy: organizerId,
        createdAt: now - 18 * D,
      });
    }

    // ── Announcements ──────────────────────────────────────────────────────
    const announcements: Array<{
      eventId: Id<"events">;
      title: string;
      message: string;
      priority: "normal" | "important" | "urgent";
      audience: "all" | "checked_in" | "pending";
      ago: number;
    }> = [
      { eventId: webdevId, title: "Doors open at 9:00 AM sharp", message: "Check-in desks are at the Auditorium A entrance. Bring your student ID and your QR ticket — screenshots work too.", priority: "urgent", audience: "all", ago: 26 * H },
      { eventId: webdevId, title: "Bring your own laptop and chargers", message: "Power strips are provided per table, but laptops and chargers are not available on site.", priority: "important", audience: "all", ago: 3 * D },
      { eventId: roboticsId, title: "Kit list published", message: "The kit list and arena dimensions are now in the rules section of the event page.", priority: "normal", audience: "all", ago: 2 * D },
      { eventId: aiId, title: "Proposal review in progress", message: "Registrations are being reviewed within 48 hours. You'll see your status change on My Registrations.", priority: "normal", audience: "pending", ago: 1.5 * D },
    ];
    for (const a of announcements) {
      await ctx.db.insert("announcements", {
        clubId,
        eventId: a.eventId,
        title: a.title,
        message: a.message,
        priority: a.priority,
        audience: a.audience,
        published: true,
        publishedAt: now - a.ago,
        createdBy: organizerId,
        createdAt: now - a.ago,
      });
    }

    // ── Tasks ──────────────────────────────────────────────────────────────
    const tasks: Array<{
      title: string;
      description?: string;
      eventId?: Id<"events">;
      status: "todo" | "in_progress" | "done";
      priority: "low" | "medium" | "high";
      deadline?: number;
      assignee: "organizer" | "volunteer";
    }> = [
      { title: "Confirm venue layout for Robotics Arena", description: "Table plan for 3 arenas + pit area.", eventId: roboticsId, status: "in_progress", priority: "high", deadline: now + 3 * D, assignee: "organizer" },
      { title: "Collect banner designs from sponsor", description: "Waiting on final SVGs from ByteNest.", status: "in_progress", priority: "high", deadline: now - 1 * D, assignee: "organizer" },
      { title: "Prepare judging rubric for AI Innovation Challenge", eventId: aiId, status: "todo", priority: "high", deadline: now + 6 * D, assignee: "organizer" },
      { title: "Brief check-in volunteers", description: "Scanner walkthrough + manual fallback.", eventId: webdevId, status: "done", priority: "medium", assignee: "volunteer" },
      { title: "Publish Robotics Arena schedule", eventId: roboticsId, status: "done", priority: "low", assignee: "organizer" },
      { title: "Arrange snacks for Web Development Challenge", description: "Confirmed with cafeteria: 3 days coverage.", eventId: webdevId, status: "done", priority: "low", assignee: "organizer" },
      { title: "Prepare certificates for Programming Contest", description: "Issued via ClubFlow — verified page live.", eventId: pcId, status: "done", priority: "medium", assignee: "organizer" },
    ];
    for (const t of tasks) {
      await ctx.db.insert("tasks", {
        clubId,
        eventId: t.eventId,
        title: t.title,
        description: t.description,
        assigneeId: t.assignee === "organizer" ? organizerId : volunteerUserIds[0],
        deadline: t.deadline,
        priority: t.priority,
        status: t.status,
        createdBy: organizerId,
        createdAt: now - 7 * D,
        updatedAt: now - 1 * D,
      });
    }

    // ── Results (Programming Contest, published) ───────────────────────────
    const pcWinnerName = PARTICIPANTS[0][0];
    const pcResults: Array<{ pos: number; label: string; score: number; user: number; remarks?: string }> = [
      { pos: 1, label: "Winner", score: 480, user: 0 },
      { pos: 2, label: "Runner-up", score: 455, user: 1 },
      { pos: 3, label: "2nd Runner-up", score: 430, user: 2 },
      { pos: 4, label: "Best First-Year Performer", score: 380, user: 3, remarks: "Outstanding debut performance." },
    ];
    // Find the actual registration ids for podium (first 4 confirmed regs of pcId)
    const pcRegs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", pcId))
      .collect();
    pcRegs.sort((a, b) => a.createdAt - b.createdAt);
    const podium = pcRegs.slice(0, 4);
    for (let i = 0; i < pcResults.length; i++) {
      const r = pcResults[i];
      const reg = podium[i];
      await ctx.db.insert("results", {
        eventId: pcId,
        registrationId: reg?.registrationId,
        userId: reg?.userId,
        participantName: PARTICIPANTS[r.user][0],
        position: r.pos,
        positionLabel: r.label,
        score: r.score,
        remarks: r.remarks,
        published: true,
        publishedAt: pcStart + 7 * H,
        createdBy: organizerId,
        createdAt: pcStart + 6 * H,
      });
    }

    // ── Certificates (Programming Contest) ─────────────────────────────────
    const podiumTypes: Array<"winner" | "runner_up" | "second_runner_up" | "special"> = [
      "winner", "runner_up", "second_runner_up", "special",
    ];
    const podiumAchievements = [
      `Champion — Programming Contest`,
      `Runner-up — Programming Contest`,
      `2nd Runner-up — Programming Contest`,
      `Best First-Year Performer — Programming Contest`,
    ];
    const certUserNames = new Map<Id<"users">, string>();
    userIds.forEach((id, idx) => certUserNames.set(id, PARTICIPANTS[idx][0]));
    for (let i = 0; i < pcRegs.length; i++) {
      const reg = pcRegs[i];
      if (reg.status !== "confirmed" || !reg.checkedInAt) continue;
      const podiumIdx = podium.findIndex((p) => p._id === reg._id);
      const type = podiumIdx >= 0 ? podiumTypes[podiumIdx] : "participation";
      const certificateId = await nextCertificateId(ctx);
      await ctx.db.insert("certificates", {
        certificateId,
        clubId,
        eventId: pcId,
        registrationId: reg.registrationId,
        userId: reg.userId,
        participantName: certUserNames.get(reg.userId) ?? pcWinnerName,
        type,
        achievement: podiumIdx >= 0 ? podiumAchievements[podiumIdx] : "Participant — Programming Contest",
        issuedAt: pcStart + 8 * H,
        issuedBy: organizerId,
      });
      await ctx.db.patch(reg._id, { certificateId });
    }

    // Draft results for Web Development Challenge (unpublished)
    const wdRegs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", webdevId))
      .collect();
    if (wdRegs[0]) {
      await ctx.db.insert("results", {
        eventId: webdevId,
        registrationId: wdRegs[0].registrationId,
        userId: wdRegs[0].userId,
        participantName: WEBDEV_TEAMS[0],
        teamName: WEBDEV_TEAMS[0],
        position: 1,
        positionLabel: "Provisional 1st (internal)",
        score: 92,
        remarks: "Judges' preliminary score after day 1 review.",
        published: false,
        createdBy: organizerId,
        createdAt: now - 6 * H,
      });
    }

    // ── Activity feed ──────────────────────────────────────────────────────
    const activities: Array<{ type: string; message: string; ago: number; eventId?: Id<"events"> }> = [
      { type: "checkin", message: "Team Null Pointers checked in at Web Development Challenge", ago: 40 * 60_000, eventId: webdevId },
      { type: "registration.created", message: "New team registered for Robotics Arena", ago: 3 * H, eventId: roboticsId },
      { type: "announcement.published", message: "Urgent announcement sent to Web Development Challenge participants", ago: 26 * H, eventId: webdevId },
      { type: "registration.created", message: "New registration for AI Innovation Challenge", ago: 30 * H, eventId: aiId },
      { type: "checkin", message: "11 teams checked in at Web Development Challenge", ago: 2 * D, eventId: webdevId },
      { type: "result.published", message: "Results published for Programming Contest", ago: 12 * D, eventId: pcId },
      { type: "certificate.issued", message: "48 certificates issued for Programming Contest", ago: 12 * D, eventId: pcId },
      { type: "event.published", message: "UI/UX Design Sprint published", ago: 5 * D, eventId: designId },
    ];
    for (const a of activities) {
      await ctx.db.insert("activity", {
        clubId,
        eventId: a.eventId,
        type: a.type,
        message: a.message,
        createdAt: now - a.ago,
      });
    }

  return { seeded: true };
}
