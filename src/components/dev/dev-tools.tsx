"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserCog, LogOut, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/constants";
import { SHIM_DEV_USERS, getValidDevToken, DevUserShim } from "@/lib/dev-auth";

export function DevTools() {
  const [open, setOpen] = useState(false);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("dev_token");
    const valid = getValidDevToken(raw);
    setActiveToken(valid);

    const handleOpen = () => setOpen(true);
    window.addEventListener("open-dev-tools", handleOpen);
    return () => window.removeEventListener("open-dev-tools", handleOpen);
  }, []);

  const { data: users, isLoading } = useQuery<DevUserShim[]>({
    queryKey: ["dev-users"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/dev-users/`);
        if (!res.ok) {
          return SHIM_DEV_USERS;
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || data.results || []);
        return list.length > 0 ? list : SHIM_DEV_USERS;
      } catch {
        return SHIM_DEV_USERS;
      }
    },
    enabled: open,
    initialData: SHIM_DEV_USERS,
  });

  const handleLogin = (userId: string) => {
    const validToken = getValidDevToken(userId);
    localStorage.setItem("dev_token", validToken);
    document.cookie = `dev_token=${validToken}; path=/; max-age=86400`;
    setActiveToken(validToken);
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem("dev_token");
    document.cookie = "dev_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[9999] px-3.5 py-2.5 bg-red-600 text-white rounded-full shadow-2xl hover:scale-105 hover:bg-red-700 transition-all flex items-center gap-2 cursor-pointer font-semibold text-xs border border-white/20 select-none"
        title="Quick Account Switching (Dev Tools)"
      >
        <UserCog className="h-4 w-4 shrink-0" />
        <span className="tracking-wide">Switch Account</span>
      </button>

      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span className="font-heading">Development Quick Account Switching</span>
            {activeToken && (
              <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 text-xs text-destructive">
                <LogOut className="h-3 w-3 mr-2" />
                Clear Login
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground mt-1">
          Select any development persona below to instantly switch roles and inspect role-based views.
        </p>

        <div className="overflow-y-auto flex-1 pr-2 space-y-2 mt-4">
          {isLoading && <div className="p-4 text-center text-muted-foreground text-sm">Loading users...</div>}
          
          {users?.map((user) => {
            const isActive = activeToken === `dev_${user.id}`;
            return (
              <button
                key={user.id}
                onClick={() => handleLogin(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left cursor-pointer
                  ${isActive ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
                `}
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
                  variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'CREATOR' ? 'default' : 'secondary'}
                  className="shrink-0 text-[10px]"
                >
                  {user.role}
                </Badge>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
