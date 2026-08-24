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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/constants";

interface DevUser {
  id: string;
  display_name: string;
  email: string;
  role: string;
  profile_image_url: string;
}

export function DevTools() {
  const [open, setOpen] = useState(false);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveToken(localStorage.getItem("dev_token"));
  }, []);

  const { data: users, isLoading, error } = useQuery<DevUser[]>({
    queryKey: ["dev-users"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/dev-users/`);
      if (!res.ok) throw new Error("Failed to fetch dev users. Is ALLOW_DEV_LOGIN=True?");
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || data.results || []);
    },
    enabled: open, // Only fetch when modal is open
  });



  const handleLogin = (userId: string) => {
    localStorage.setItem("dev_token", `dev_${userId}`);
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem("dev_token");
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[9999] p-3 bg-red-500 text-white rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
        title="Dev Tools"
      >
        <UserCog className="h-6 w-6" />
      </button>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Dev User Switching</span>
            {activeToken && (
              <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 text-xs text-destructive">
                <LogOut className="h-3 w-3 mr-2" />
                Clear Login
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 space-y-2 mt-4">
          {isLoading && <div className="p-4 text-center text-muted-foreground text-sm">Loading users...</div>}
          {error && <div className="p-4 text-center text-destructive text-sm">Failed to load. Did you set ALLOW_DEV_LOGIN=True in the backend?</div>}
          
          {users?.map((user) => {
            const isActive = activeToken === `dev_${user.id}`;
            return (
              <button
                key={user.id}
                onClick={() => handleLogin(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left
                  ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
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

                <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'} className="shrink-0 text-[10px]">
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
