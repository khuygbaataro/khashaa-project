// Provides currentAgent + loading state to the whole app via React context.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthChange, signOutUser } from "../../lib/auth";
import type { Agent } from "../../lib/schema";

interface AuthContextValue {
  currentAgent: Agent | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setCurrentAgent: (a: Agent | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange((agent) => {
      setCurrentAgent(agent);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentAgent,
        loading,
        setCurrentAgent,
        signOut: async () => {
          await signOutUser();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
