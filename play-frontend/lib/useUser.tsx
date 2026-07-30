import {
  useCallback,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { auth } from "play";

interface UserState {
  user: auth.accessTokenPayload | null;
  loggedIn: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  updateUser: (user: auth.accessTokenPayload) => void;
}

const UserContext = createContext<UserState | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<auth.accessTokenPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await response.json();
      setUser(data.loggedIn ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((nextUser: auth.accessTokenPayload) => {
    setUser(nextUser);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loggedIn: Boolean(user), loading, refresh, updateUser }),
    [user, loading, refresh, updateUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser precisa estar dentro de UserProvider");
  }
  return context;
}
