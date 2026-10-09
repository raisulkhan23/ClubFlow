// simple logo dropdown component that can be used to go to the landing page or sign out for the user

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Repeat } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";

/**
 * Account menu used in the organizer sidebar. The "go home" affordance lives
 * next to it as an explicit link, so this menu only carries the account action.
 */
export function LogoDropdown() {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async (goToAuth: boolean) => {
    try {
      await signOut();
      navigate(goToAuth ? "/auth" : "/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 shrink-0" aria-label="Account menu">
          <img
            src={logo}
            alt=""
            width={26}
            height={26}
            className="rounded-md"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-medium">{user?.name ?? "Signed in"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? "Demo session"}</p>
          <Badge variant="outline" className="mt-1.5 border-primary/30 text-[10px] text-primary capitalize">
            {user?.role ?? "participant"}
          </Badge>
        </div>
        <div className="mx-1 h-px bg-border" role="separator" />
        <DropdownMenuItem
          onClick={() => void handleSignOut(true)}
          className="cursor-pointer focus:text-primary"
        >
          <Repeat className="mr-2 h-4 w-4" />
          Switch demo role
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void handleSignOut(false)}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
