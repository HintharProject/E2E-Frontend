"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BanState } from "@/types/user";
import { Clock, ShieldAlert, AlertCircle, CheckCircle2 } from "lucide-react";

interface BanCountdownBadgeProps {
  banStatus: BanState;
  banExpiresAt?: string | null;
  onExpire?: () => void;
}

export function BanCountdownBadge({
  banStatus,
  banExpiresAt,
  onExpire,
}: BanCountdownBadgeProps) {
  const [now, setNow] = useState(() => Date.now());

  const isTemporaryBan = banStatus === "BANNED_24H" || banStatus === "BANNED_7D";

  useEffect(() => {
    if (!isTemporaryBan || !banExpiresAt) return;

    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);

      if (banExpiresAt && new Date(banExpiresAt).getTime() <= current) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTemporaryBan, banExpiresAt, onExpire]);

  if (banStatus === "ACTIVE") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium gap-1"
      >
        <CheckCircle2 className="size-3 text-emerald-500" />
        Active
      </Badge>
    );
  }

  if (banStatus === "WARNING") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium gap-1"
      >
        <AlertCircle className="size-3 text-amber-500" />
        Warning
      </Badge>
    );
  }

  if (banStatus === "PERMANENT_BAN") {
    return (
      <Badge
        variant="destructive"
        className="bg-destructive/15 text-destructive border border-destructive/30 font-semibold gap-1"
      >
        <ShieldAlert className="size-3" />
        Permanent Suspension
      </Badge>
    );
  }

  // Temporary Ban with Countdown
  if (isTemporaryBan) {
    if (!banExpiresAt) {
      return (
        <Badge
          variant="destructive"
          className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-medium"
        >
          {banStatus === "BANNED_24H" ? "Banned (24h)" : "Banned (7d)"}
        </Badge>
      );
    }

    const expiryTime = new Date(banExpiresAt).getTime();
    const diff = Math.max(0, expiryTime - now);

    if (diff <= 0) {
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium gap-1"
        >
          <CheckCircle2 className="size-3 text-emerald-500" />
          Active (Expired)
        </Badge>
      );
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let countdownText = "";
    if (days > 0) {
      countdownText = `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      countdownText = `${hours}h ${minutes}m remaining`;
    } else {
      countdownText = `${minutes}m ${seconds}s remaining`;
    }

    return (
      <Badge
        variant="outline"
        className="border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold gap-1.5 tabular-nums text-xs"
      >
        <Clock className="size-3 animate-pulse text-rose-500" />
        Banned ({countdownText})
      </Badge>
    );
  }

  return <Badge variant="outline">{banStatus}</Badge>;
}
