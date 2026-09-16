export interface DevUserShim {
  id: string;
  clerk_id: string;
  display_name: string;
  email: string;
  role: string;
  profile_image_url: string;
}

/** Dev personas mapped to users currently in the Aiven development database. */
export const SHIM_DEV_USERS: DevUserShim[] = [
  {
    id: "138be9aa-636b-428f-bec8-839a0ff16b98",
    clerk_id: "user_3HaqYXigiVrsP3kTaL8kKvh77wy",
    display_name: "Admin",
    email: "dev.admin.e2e@gmail.com",
    role: "SUPERADMIN",
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
  },
  {
    id: "e57d7f1d-cec7-4561-ae9f-f7f1fffd49eb",
    clerk_id: "user_3HarHCO2RC6jJBfD8EjcztibbQ0",
    display_name: "Creator1",
    email: "dev.admin.e2e+creator1@gmail.com",
    role: "USER",
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  },
  {
    id: "6b63bc67-3bad-4040-88c4-1cd89700d0ae",
    clerk_id: "user_3HariBu9IbfnFIJE92TFojHO2NX",
    display_name: "Creator2",
    email: "dev.admin.e2e+creator2@gmail.com",
    role: "USER",
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: "34274732-8625-4c0e-b17a-5bc35e0c12de",
    clerk_id: "user_3HarcHYyW3k6owT5pEHDyIKnafL",
    display_name: "Student1",
    email: "dev.admin.e2e+student1@gmail.com",
    role: "USER",
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  },
  {
    id: "2f4422da-f179-4e04-a363-c4f38f7c3551",
    clerk_id: "user_3HarfpIlLZXWqvamg1x1orto2vH",
    display_name: "Student2",
    email: "dev.admin.e2e+student2@gmail.com",
    role: "USER",
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana",
  },
];

const ALIAS_MAP: Record<string, string> = {
  admin: "138be9aa-636b-428f-bec8-839a0ff16b98",
  creator1: "e57d7f1d-cec7-4561-ae9f-f7f1fffd49eb",
  creator2: "6b63bc67-3bad-4040-88c4-1cd89700d0ae",
  student1: "34274732-8625-4c0e-b17a-5bc35e0c12de",
  student2: "2f4422da-f179-4e04-a363-c4f38f7c3551",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates and converts any arbitrary or legacy dev token into a valid `dev_<UUID>`
 * recognized by Django backend's DevTokenAuthentication.
 */
export function getValidDevToken(rawToken?: string | null): string {
  if (!rawToken) {
    return `dev_${SHIM_DEV_USERS[0].id}`;
  }

  const clean = rawToken.replace(/^dev_/, "").trim();

  if (ALIAS_MAP[clean]) {
    return `dev_${ALIAS_MAP[clean]}`;
  }

  const match = SHIM_DEV_USERS.find((u) => u.id === clean || u.clerk_id === clean);
  if (match) {
    return `dev_${match.id}`;
  }

  if (UUID_REGEX.test(clean)) {
    return `dev_${clean}`;
  }

  return `dev_${SHIM_DEV_USERS[0].id}`;
}

export function getDevUserByToken(rawToken?: string | null): DevUserShim {
  const token = getValidDevToken(rawToken);
  const userId = token.replace(/^dev_/, "");
  return SHIM_DEV_USERS.find((u) => u.id === userId) || SHIM_DEV_USERS[0];
}
