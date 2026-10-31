import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api.js";
import { AuthContext } from "../lib/auth.js";
import { useCart } from "../store/cart.js";

const TOKEN_KEY = "northwind-token";

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable (private mode); session lasts until reload
  }
}

/** JWT session: token in localStorage, user loaded from /api/me */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(() => !readToken());

  const getToken = useCallback(async () => token, [token]);

  const applySession = useCallback(
    (nextToken, nextUser) => {
      writeToken(nextToken);
      setToken(nextToken);
      setUser(nextUser);
      queryClient.clear();
    },
    [queryClient],
  );

  // validate a stored token on load; drop it if expired or the account is gone
  useEffect(() => {
    if (!token || user) return;
    let cancelled = false;
    apiFetch("/api/me", { getToken: async () => token })
      .then((data) => {
        if (cancelled) return;
        if (data?.user) setUser(data.user);
        else applySession(null, null);
      })
      .catch(() => {
        if (!cancelled) applySession(null, null);
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token, user, applySession]);

  const signIn = useCallback(
    async ({ email, password }) => {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      applySession(data.token, data.user);
      return data.user;
    },
    [applySession],
  );

  const signUp = useCallback(
    async ({ email, password, displayName }) => {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: { email, password, displayName },
      });
      applySession(data.token, data.user);
      return data.user;
    },
    [applySession],
  );

  // the cart lives in localStorage, so empty it to keep it from carrying over to the next user
  const signOut = useCallback(() => {
    useCart.getState().clear();
    applySession(null, null);
  }, [applySession]);

  const value = useMemo(
    () => ({
      isLoaded,
      isSignedIn: Boolean(token && user),
      userId: user?.id ?? null,
      user,
      getToken,
      signIn,
      signUp,
      signOut,
    }),
    [isLoaded, token, user, getToken, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
