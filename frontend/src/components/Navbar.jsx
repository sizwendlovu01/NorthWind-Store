import { useAuth } from "../lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Link } from "react-router";

import {
  LogInIcon,
  LogOutIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  StoreIcon,
} from "lucide-react";
import { useCart } from "../store/cart";

const Navbar = () => {
  const { getToken, isSignedIn, user, signOut } = useAuth();

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  const role = meData?.user?.role;

  // the count badge is only shown to signed-in users
  const itemCount = useCart((s) => s.items.reduce((n, line) => n + line.quantity, 0));
  const cartCount = isSignedIn ? itemCount : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur-md">
      <div className="navbar mx-auto min-h-14 max-w-7xl px-4 py-2.5 md:px-6 md:py-3">
        <div className="flex-1">
          <Link
            to="/"
            className="btn btn-ghost gap-2 px-2 font-mono text-lg font-semibold uppercase tracking-wide md:text-xl"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 p-1 text-primary">
              <StoreIcon className="size-8" aria-hidden />
            </span>
            <span className="leading-none">Northwind</span>
          </Link>
        </div>

        <nav className="flex items-center gap-1 md:gap-1.5">
          <Link to="/" className="btn btn-ghost gap-2 font-medium">
            <ShoppingBagIcon className="size-6 opacity-90" aria-hidden />
            <span className="hidden sm:inline">Shop</span>
          </Link>

          {isSignedIn ? (
            <>
              <Link to="/orders" className="btn btn-ghost gap-2 font-medium">
                <PackageIcon className="size-6 opacity-90" aria-hidden />
                <span className="hidden sm:inline">Orders</span>
              </Link>

              {role === "admin" ? (
                <Link to="/admin" className="btn btn-ghost gap-2 font-medium text-secondary">
                  <SettingsIcon className="size-6" aria-hidden />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              ) : null}
            </>
          ) : null}

          <Link
            to="/cart"
            className="btn btn-ghost gap-2 font-medium indicator"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            {cartCount > 0 ? (
              <span className="indicator-item badge badge-sm badge-primary min-w-2 px-1.5 font-sans text-xs tabular-nums">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
            <ShoppingCartIcon className="size-6 opacity-90" aria-hidden />
            <span className="hidden sm:inline">Cart</span>
          </Link>

          {isSignedIn ? (
            <div className="flex items-center gap-2 border-l border-base-300 pl-3">
              <div className="dropdown dropdown-end">
                <button
                  type="button"
                  tabIndex={0}
                  className="btn btn-circle btn-ghost"
                  aria-label="Account menu"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-semibold uppercase text-primary ring-2 ring-base-300">
                    {(user?.displayName || user?.email || "?").charAt(0)}
                  </span>
                </button>
                <div
                  tabIndex={0}
                  className="dropdown-content z-50 mt-3 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
                >
                  <div className="px-3 py-2">
                    {user?.displayName ? (
                      <p className="truncate font-medium text-base-content">{user.displayName}</p>
                    ) : null}
                    <p className="truncate text-sm text-base-content/65">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="btn btn-ghost btn-sm w-full justify-start gap-2"
                  >
                    <LogOutIcon className="size-4" aria-hidden />
                    Sign out
                  </button>
                </div>
              </div>
              {role === "support" || role === "admin" ? (
                <span className="badge badge-primary badge-sm hidden capitalize md:inline-flex">
                  {role}
                </span>
              ) : null}
            </div>
          ) : (
            <Link to="/sign-in" className="btn btn-primary btn-sm gap-1.5 px-3 shadow-md">
              <LogInIcon className="size-4 drop-shadow-sm" aria-hidden />
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
