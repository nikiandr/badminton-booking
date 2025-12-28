import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <header className="w-full">
      <div className="flex items-center justify-between px-4 py-2">
        <nav className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Button asChild key={to} size="sm" variant="ghost">
              <Link to={to}>{label}</Link>
            </Button>
          ))}
        </nav>
        <UserMenu />
      </div>
      <Separator />
    </header>
  );
}
