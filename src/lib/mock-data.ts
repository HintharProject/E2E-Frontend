export type Role = "STUDENT" | "CREATOR" | "ADMIN";
export type BanState =
  | "ACTIVE"
  | "WARNING"
  | "BANNED_24H"
  | "BANNED_7D"
  | "PERMANENT_BAN";
export type PostType = "QUESTION" | "SHARING" | "ANNOUNCEMENT";
export type LessonState = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";
export type ReportTarget = "POST" | "LESSON" | "USER";

export type BanDetails = {
  bannedAt: string;
  duration: string;
  durationDays: number;
  cooldownExpiresAt: string;
  reason: string;
  ruleViolated: string;
  issuedBy: string;
  cooldownRemaining?: string;
  readOnlyRestriction?: string;
};

export type User = {
  id: string;
  displayName: string;
  imageUrl: string;
  role: Role;
  banState: BanState;
  bio?: string;
  followerCount?: number;
  banDetails?: BanDetails;
};

export type Subject = { id: string; name: string };
export type Level = { id: string; name: string };
export type Tag = { id: string; name: string };

export type Post = {
  id: string;
  title: string;
  body: string;
  postType: PostType;
  authorId: string;
  subjectId?: string;
  levelId?: string;
  tagIds: string[];
  voteScore: number;
  commentCount: number;
  createdAt: string;
  expiresAt: string;
  attachmentName?: string;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type Lesson = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  subjectId: string;
  levelId: string;
  tagIds: string[];
  state: LessonState;
  voteScore: number;
  embeddedVideoUrl?: string;
  attachments: string[];
  createdAt: string;
  followedAuthor?: boolean;
};

export type StudyPlan = {
  id: string;
  title: string;
  ownerId: string;
  isPublic: boolean;
  lessonIds: string[];
};

export type SavedSession = {
  id: string;
  title: string;
  ownerId: string;
  isPublic: boolean;
  postIds: string[];
  lessonIds: string[];
};

export type Report = {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  reporterId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  adminId: string;
  action: string;
  target: string;
  createdAt: string;
};

/** Switch this to preview Student / Creator / Admin chrome. */
export const CURRENT_USER_ID = "u-student1";

export const subjects: Subject[] = [
  { id: "sub-math", name: "Mathematics" },
  { id: "sub-cs", name: "Computer Science" },
  { id: "sub-bio", name: "Biology" },
  { id: "sub-eng", name: "English" },
];

export const levels: Level[] = [
  { id: "lvl-hs", name: "High School" },
  { id: "lvl-ug", name: "Undergraduate" },
  { id: "lvl-grad", name: "Graduate" },
];

export const tags: Tag[] = [
  { id: "tag-calc", name: "calculus" },
  { id: "tag-alg", name: "algorithms" },
  { id: "tag-eco", name: "ecology" },
  { id: "tag-essay", name: "essay-writing" },
  { id: "tag-py", name: "python" },
];

export const users: User[] = [
  {
    id: "u-admin",
    displayName: "Alex Admin",
    imageUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=Alex",
    role: "ADMIN",
    banState: "ACTIVE",
    bio: "Platform moderator and curriculum steward.",
  },
  {
    id: "u-creator1",
    displayName: "Casey Creator",
    imageUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=Casey",
    role: "CREATOR",
    banState: "ACTIVE",
    bio: "CS educator — algorithms, Python, and study systems.",
    followerCount: 128,
  },
  {
    id: "u-creator2",
    displayName: "Morgan Mentor",
    imageUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=Morgan",
    role: "CREATOR",
    banState: "ACTIVE",
    bio: "Biology lessons with field notes and playlists.",
    followerCount: 86,
  },
  {
    id: "u-student1",
    displayName: "Sam Student",
    imageUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=Sam",
    role: "STUDENT",
    banState: "ACTIVE",
    bio: "Undergrad grinding calc and discrete math.",
  },
  {
    id: "u-student2",
    displayName: "Riley Reader",
    imageUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=Riley",
    role: "STUDENT",
    banState: "WARNING",
    bio: "Sharing notes; warned once for spam links.",
    banDetails: {
      bannedAt: "2026-08-10T17:00:00Z",
      duration: "Account Warning (Formal Notice)",
      durationDays: 0,
      cooldownExpiresAt: "2026-09-10T17:00:00Z",
      reason: "Off-topic promotional links in lesson comment sections.",
      ruleViolated: "Community Guidelines — Section 3.1: Off-topic Promotion",
      issuedBy: "Alex Admin (Staff Moderator)",
      cooldownRemaining: "Warning active on record for 30 days",
      readOnlyRestriction: "Full write access maintained. Further infractions will incur a temporary or permanent write lock.",
    },
  },
  {
    id: "u-student3",
    displayName: "Jordan Justice",
    imageUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=Jordan",
    role: "STUDENT",
    banState: "BANNED_7D",
    bio: "Undergraduate student studying computer science & discrete math.",
    banDetails: {
      bannedAt: "2026-08-18T10:30:00Z",
      duration: "7 Days (Temporary Suspension)",
      durationDays: 7,
      cooldownExpiresAt: "2026-08-25T10:30:00Z",
      reason: "Repeatedly posting promotional referral links and unauthorized commercial spam across calculus forum threads.",
      ruleViolated: "Community Guidelines — Section 3.2: Commercial Spam & Unsolicited Links",
      issuedBy: "Alex Admin (Staff Moderator)",
      cooldownRemaining: "4 days remaining",
      readOnlyRestriction: "Read-only restriction active. Creating posts, writing comments, voting, and editing are locked until the cooldown concludes.",
    },
  },
];

export const posts: Post[] = [
  {
    id: "p1",
    title: "How do I approach integration by parts?",
    body: "I keep mixing u and dv. Looking for a checklist or mnemonic that works for definite integrals too.",
    postType: "QUESTION",
    authorId: "u-student1",
    subjectId: "sub-math",
    levelId: "lvl-ug",
    tagIds: ["tag-calc"],
    voteScore: 14,
    commentCount: 3,
    createdAt: "2026-08-08T10:00:00Z",
    expiresAt: "2026-09-07T10:00:00Z",
  },
  {
    id: "p2",
    title: "Shared: Big-O cheat sheet for common sorts",
    body: "Quick table for merge, heap, and quicksort average/worst cases. Happy to expand if useful.",
    postType: "SHARING",
    authorId: "u-student2",
    subjectId: "sub-cs",
    levelId: "lvl-ug",
    tagIds: ["tag-alg"],
    voteScore: 22,
    commentCount: 2,
    createdAt: "2026-08-10T14:30:00Z",
    expiresAt: "2026-09-09T14:30:00Z",
    attachmentName: "big-o-sheet.pdf",
  },
  {
    id: "p3",
    title: "Platform maintenance window — Aug 15",
    body: "Lesson uploads will pause from 02:00–04:00 UTC while we rotate storage credentials. Forum stays read-only during the window.",
    postType: "ANNOUNCEMENT",
    authorId: "u-admin",
    tagIds: [],
    voteScore: 0,
    commentCount: 1,
    createdAt: "2026-08-12T09:00:00Z",
    expiresAt: "2026-09-11T09:00:00Z",
  },
  {
    id: "p4",
    title: "New playlist: Graph traversals in 20 minutes",
    body: "BFS/DFS walkthrough with three practice graphs. Link is in the attached lesson on my board.",
    postType: "ANNOUNCEMENT",
    authorId: "u-creator1",
    subjectId: "sub-cs",
    levelId: "lvl-ug",
    tagIds: ["tag-alg", "tag-py"],
    voteScore: 31,
    commentCount: 4,
    createdAt: "2026-08-11T16:00:00Z",
    expiresAt: "2026-09-10T16:00:00Z",
  },
  {
    id: "p5",
    title: "Field notes template for ecology labs",
    body: "Sharing a one-page template I use with HS students before transect work.",
    postType: "SHARING",
    authorId: "u-creator2",
    subjectId: "sub-bio",
    levelId: "lvl-hs",
    tagIds: ["tag-eco"],
    voteScore: 18,
    commentCount: 2,
    createdAt: "2026-08-09T11:20:00Z",
    expiresAt: "2026-09-08T11:20:00Z",
  },
  {
    id: "p6",
    title: "Thesis statement workshop tips?",
    body: "Need sharper claims for persuasive essays. What prompts do you use?",
    postType: "QUESTION",
    authorId: "u-student1",
    subjectId: "sub-eng",
    levelId: "lvl-hs",
    tagIds: ["tag-essay"],
    voteScore: 7,
    commentCount: 1,
    createdAt: "2026-08-13T08:15:00Z",
    expiresAt: "2026-09-12T08:15:00Z",
  },
];

export const comments: Comment[] = [
  {
    id: "c1",
    postId: "p1",
    authorId: "u-creator1",
    body: "Try LIATE for choosing u. Work one textbook example with the table method before jumping to applications.",
    createdAt: "2026-08-08T12:00:00Z",
  },
  {
    id: "c2",
    postId: "p1",
    authorId: "u-student2",
    body: "Also write dv as what you can integrate cleanly — that alone fixed half my mistakes.",
    createdAt: "2026-08-08T13:40:00Z",
  },
  {
    id: "c3",
    postId: "p1",
    authorId: "u-admin",
    body: "Linking Casey’s calc warm-up lesson in Lessons if you want more drills.",
    createdAt: "2026-08-08T15:00:00Z",
  },
  {
    id: "c4",
    postId: "p2",
    authorId: "u-creator1",
    body: "Nice sheet. Consider adding space complexity in a follow-up.",
    createdAt: "2026-08-10T18:00:00Z",
  },
  {
    id: "c5",
    postId: "p4",
    authorId: "u-student1",
    body: "Watched the DFS section twice — the recursion tree diagram clicked.",
    createdAt: "2026-08-11T20:00:00Z",
  },
];

export const lessons: Lesson[] = [
  {
    id: "l1",
    title: "Integration warm-ups: parts & substitution",
    body: "Five worked examples with common traps. Pause after each problem and rewrite the substitution without looking.",
    authorId: "u-creator1",
    subjectId: "sub-math",
    levelId: "lvl-ug",
    tagIds: ["tag-calc"],
    state: "PUBLISHED",
    voteScore: 44,
    embeddedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    attachments: ["parts-worksheet.pdf", "answer-key.pdf"],
    createdAt: "2026-07-20T10:00:00Z",
    followedAuthor: true,
  },
  {
    id: "l2",
    title: "Graph traversals crash course",
    body: "BFS queues vs DFS stacks, adjacency lists, and three practice graphs. Embed covers the walkthrough.",
    authorId: "u-creator1",
    subjectId: "sub-cs",
    levelId: "lvl-ug",
    tagIds: ["tag-alg", "tag-py"],
    state: "PUBLISHED",
    voteScore: 67,
    embeddedVideoUrl: "https://www.youtube.com/playlist?list=PLdemo",
    attachments: ["graphs.zip"],
    createdAt: "2026-08-01T09:00:00Z",
    followedAuthor: true,
  },
  {
    id: "l3",
    title: "Ecology transect field guide",
    body: "Safety checklist, sampling squares, and how to log species without overcounting.",
    authorId: "u-creator2",
    subjectId: "sub-bio",
    levelId: "lvl-hs",
    tagIds: ["tag-eco"],
    state: "PUBLISHED",
    voteScore: 29,
    attachments: ["transect-guide.pdf", "data-sheet.docx"],
    createdAt: "2026-07-28T12:00:00Z",
    followedAuthor: false,
  },
  {
    id: "l4",
    title: "Python list patterns (draft)",
    body: "Comprehensions, slicing, and when not to mutate in place. Still adding exercises.",
    authorId: "u-creator1",
    subjectId: "sub-cs",
    levelId: "lvl-hs",
    tagIds: ["tag-py"],
    state: "DRAFT",
    voteScore: 0,
    attachments: [],
    createdAt: "2026-08-12T07:00:00Z",
    followedAuthor: true,
  },
  {
    id: "l5",
    title: "Essay outlines that actually argue",
    body: "Claim → warrant → evidence loops. Archived after the unit ended; still useful for review.",
    authorId: "u-creator2",
    subjectId: "sub-eng",
    levelId: "lvl-hs",
    tagIds: ["tag-essay"],
    state: "ARCHIVED",
    voteScore: 12,
    attachments: ["outline-template.pptx"],
    createdAt: "2026-06-01T10:00:00Z",
    followedAuthor: false,
  },
];

export const studyPlans: StudyPlan[] = [
  {
    id: "sp1",
    title: "Calc midterm sprint",
    ownerId: "u-admin",
    isPublic: true,
    lessonIds: ["l1"],
  },
  {
    id: "sp2",
    title: "Algorithms week",
    ownerId: "u-admin",
    isPublic: false,
    lessonIds: ["l2"],
  },
  {
    id: "sp3",
    title: "Undergrad Math & CS Foundations",
    ownerId: "u-student1",
    isPublic: true,
    lessonIds: ["l1", "l2"],
  },
  {
    id: "sp4",
    title: "Ecology Field Preparation",
    ownerId: "u-student1",
    isPublic: false,
    lessonIds: ["l3"],
  },
  {
    id: "sp5",
    title: "Curriculum Showcase",
    ownerId: "u-creator1",
    isPublic: true,
    lessonIds: ["l1", "l2"],
  },
];

export const savedSessions: SavedSession[] = [
  {
    id: "ss1",
    title: "Forum catch-up",
    ownerId: "u-admin",
    isPublic: true,
    postIds: ["p1", "p2"],
    lessonIds: ["l2"],
  },
  {
    id: "ss2",
    title: "Bio side quest",
    ownerId: "u-admin",
    isPublic: false,
    postIds: ["p5"],
    lessonIds: ["l3"],
  },
  {
    id: "ss3",
    title: "Weekly Problem Solving Set",
    ownerId: "u-student1",
    isPublic: true,
    postIds: ["p1", "p4"],
    lessonIds: ["l1"],
  },
  {
    id: "ss4",
    title: "Personal Study Reference",
    ownerId: "u-student1",
    isPublic: false,
    postIds: ["p2"],
    lessonIds: ["l2"],
  },
  {
    id: "ss5",
    title: "Casey's Teaching Archive",
    ownerId: "u-creator1",
    isPublic: true,
    postIds: ["p4"],
    lessonIds: ["l1", "l2"],
  },
];

export const reports: Report[] = [
  {
    id: "r1",
    targetType: "POST",
    targetId: "p2",
    reporterId: "u-student1",
    reason: "Attachment looks unrelated / possible spam PDF",
    status: "PENDING",
    createdAt: "2026-08-12T11:00:00Z",
  },
  {
    id: "r2",
    targetType: "LESSON",
    targetId: "l3",
    reporterId: "u-student2",
    reason: "Broken download link on data sheet",
    status: "PENDING",
    createdAt: "2026-08-11T09:30:00Z",
  },
  {
    id: "r3",
    targetType: "USER",
    targetId: "u-student2",
    reporterId: "u-creator1",
    reason: "Repeated off-topic promotion in comments",
    status: "PENDING",
    createdAt: "2026-08-10T17:00:00Z",
  },
  {
    id: "r4",
    targetType: "POST",
    targetId: "p6",
    reporterId: "u-admin",
    reason: "Duplicate of older thread (resolved — kept)",
    status: "DISMISSED",
    createdAt: "2026-08-09T08:00:00Z",
  },
  {
    id: "r5",
    targetType: "USER",
    targetId: "u-student3",
    reporterId: "u-creator1",
    reason: "Mass posting external discord affiliate links in comments",
    status: "RESOLVED",
    createdAt: "2026-08-18T09:15:00Z",
  },
];

export const auditLogs: AuditLog[] = [
  {
    id: "a1",
    adminId: "u-admin",
    action: "BAN_WARNING",
    target: "user:u-student2",
    createdAt: "2026-08-10T17:30:00Z",
  },
  {
    id: "a2",
    adminId: "u-admin",
    action: "DELETE_POST",
    target: "post:p-old-spam",
    createdAt: "2026-08-07T12:00:00Z",
  },
  {
    id: "a3",
    adminId: "u-admin",
    action: "ARCHIVE_LESSON",
    target: "lesson:l5",
    createdAt: "2026-07-15T10:00:00Z",
  },
  {
    id: "a4",
    adminId: "u-admin",
    action: "BAN_7D",
    target: "user:u-student3",
    createdAt: "2026-08-18T10:30:00Z",
  },
];

export function getCurrentUser(): User {
  return users.find((u) => u.id === CURRENT_USER_ID) ?? users[0];
}

export function getUser(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getSubject(id?: string): Subject | undefined {
  return subjects.find((s) => s.id === id);
}

export function getLevel(id?: string): Level | undefined {
  return levels.find((l) => l.id === id);
}

export function getTagNames(ids: string[]): string[] {
  return ids
    .map((id) => tags.find((t) => t.id === id)?.name)
    .filter((n): n is string => Boolean(n));
}

export function getPost(id: string): Post | undefined {
  return posts.find((p) => p.id === id);
}

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
