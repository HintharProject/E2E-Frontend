"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCog, LogOut, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SHIM_DEV_USERS, getValidDevToken, getDevUserByToken, DevUserShim } from "@/lib/dev-auth";

export { SHIM_DEV_USERS, getValidDevToken, getDevUserByToken };
export type { DevUserShim };

interface AuthContextValue {
  devToken: string | null;
  activeUser: DevUserShim | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  getToken: () => Promise<string | null>;
  setDevUser: (userId: string) => void;
  signOut: () => Promise<void>;
}

const defaultDevToken = `dev_${SHIM_DEV_USERS[0].id}`;
const defaultDevUser = SHIM_DEV_USERS[0];

const AuthContext = createContext<AuthContextValue>({
  devToken: defaultDevToken,
  activeUser: defaultDevUser,
  isSignedIn: true,
  isLoaded: true,
  getToken: async () => defaultDevToken,
  setDevUser: () => {},
  signOut: async () => {},
});

export function ClerkProvider({
  children,
}: {
  children: React.ReactNode;
  [key: string]: any;
}) {
  const [devToken, setDevTokenState] = useState<string>(defaultDevToken);
  const [activeUser, setActiveUser] = useState<DevUserShim>(defaultDevUser);
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    // Read and sanitize dev_token from localStorage on mount
    const raw = localStorage.getItem("dev_token");
    const valid = getValidDevToken(raw);

    if (raw !== valid) {
      localStorage.setItem("dev_token", valid);
      document.cookie = `dev_token=${valid}; path=/; max-age=86400`;
    }

    setDevTokenState(valid);
    setActiveUser(getDevUserByToken(valid));
    setIsLoaded(true);
  }, []);

  const getToken = useCallback(async () => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("dev_token") : null;
    return getValidDevToken(raw || devToken);
  }, [devToken]);

  const setDevUser = useCallback((id: string) => {
    const token = getValidDevToken(id);
    localStorage.setItem("dev_token", token);
    document.cookie = `dev_token=${token}; path=/; max-age=86400`;
    setDevTokenState(token);
    setActiveUser(getDevUserByToken(token));
    window.location.reload();
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem("dev_token");
    document.cookie = "dev_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.reload();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        devToken,
        activeUser,
        isSignedIn: true,
        isLoaded,
        getToken,
        setDevUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return {
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
    userId: ctx.activeUser?.clerk_id ?? null,
    sessionId: ctx.activeUser ? `sess_${ctx.activeUser.id}` : null,
    actor: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    has: () => true,
    signOut: ctx.signOut,
    getToken: ctx.getToken,
  };
}

export function useUser() {
  const ctx = useContext(AuthContext);
  const user = ctx.activeUser
    ? {
        id: ctx.activeUser.clerk_id,
        fullName: ctx.activeUser.display_name,
        firstName: ctx.activeUser.display_name.split(" ")[0],
        lastName: ctx.activeUser.display_name.split(" ")[1] || "",
        imageUrl: ctx.activeUser.profile_image_url,
        primaryEmailAddress: { emailAddress: ctx.activeUser.email },
        emailAddresses: [{ emailAddress: ctx.activeUser.email }],
        publicMetadata: { role: ctx.activeUser.role },
      }
    : null;

  return {
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
    user,
  };
}

export function useClerk() {
  const ctx = useContext(AuthContext);
  return {
    signOut: ctx.signOut,
    openSignIn: () => {
      window.dispatchEvent(new CustomEvent("open-dev-tools"));
    },
    openSignUp: () => {
      window.dispatchEvent(new CustomEvent("open-dev-tools"));
    },
  };
}

export function UserButton({
  appearance,
}: {
  appearance?: { elements?: { avatarBox?: string } };
}) {
  const ctx = useContext(AuthContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !ctx.activeUser) {
    return <div className={appearance?.elements?.avatarBox || "h-9 w-9 rounded-full bg-muted/60"} />;
  }

  const initials = ctx.activeUser.display_name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition cursor-pointer outline-none"
        title="Account menu"
      >
        <Avatar className={appearance?.elements?.avatarBox || "h-9 w-9"}>
          <AvatarImage src={ctx.activeUser.profile_image_url} alt={ctx.activeUser.display_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold leading-none">{ctx.activeUser.display_name}</p>
              <Badge variant="outline" className="text-[10px]">
                {ctx.activeUser.role}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">{ctx.activeUser.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => window.dispatchEvent(new CustomEvent("open-dev-tools"))}
          className="cursor-pointer"
        >
          <UserCog className="mr-2 h-4 w-4" />
          <span>Switch Dev Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={ctx.signOut} className="text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Clear Login</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SignIn({
  forceRedirectUrl = "/forum",
}: {
  routing?: string;
  path?: string;
  signUpUrl?: string;
  forceRedirectUrl?: string;
}) {
  const ctx = useContext(AuthContext);
  const router = useRouter();

  const handleSelect = (userId: string) => {
    ctx.setDevUser(userId);
    router.push(forceRedirectUrl);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div className="mb-4 text-center">
        <h2 className="font-heading text-xl font-bold">Select Dev Account</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Clerk is currently bypassed. Click any persona below to log in instantly.
        </p>
      </div>

      <div className="space-y-2">
        {SHIM_DEV_USERS.map((user) => {
          const isActive = ctx.activeUser?.id === user.id;
          return (
            <button
              key={user.id}
              onClick={() => handleSelect(user.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left cursor-pointer ${
                isActive
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={user.profile_image_url} />
                <AvatarFallback>{user.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{user.display_name}</span>
                  {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                </div>
                <span className="text-xs text-muted-foreground truncate block">{user.email}</span>
              </div>
              <Badge
                variant={user.role === "ADMIN" ? "destructive" : user.role === "CREATOR" ? "default" : "secondary"}
                className="shrink-0 text-[10px]"
              >
                {user.role}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SignUp(props: any) {
  return <SignIn {...props} />;
}

export function UserProfile({
  appearance,
}: {
  routing?: string;
  appearance?: any;
}) {
  const ctx = useContext(AuthContext);
  const user = ctx.activeUser;

  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">No active user logged in.</div>;
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.profile_image_url} />
          <AvatarFallback>{user.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold font-heading">{user.display_name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={user.role === "ADMIN" ? "destructive" : "default"}>{user.role}</Badge>
            <span className="text-xs text-muted-foreground">ID: {user.id}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Local development account shim</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.dispatchEvent(new CustomEvent("open-dev-tools"))}
          className="cursor-pointer"
        >
          <UserCog className="mr-2 h-4 w-4" />
          Switch Account
        </Button>
      </div>
    </div>
  );
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return !isSignedIn ? <>{children}</> : null;
}

export function RedirectToSignIn() {
  const router = useRouter();
  useEffect(() => {
    router.push("/sign-in");
  }, [router]);
  return null;
}

export function RedirectToSignUp() {
  const router = useRouter();
  useEffect(() => {
    router.push("/sign-up");
  }, [router]);
  return null;
}
