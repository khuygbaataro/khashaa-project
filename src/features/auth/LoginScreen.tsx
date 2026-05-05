// Email + password sign-in form. Friendly Firebase error mapping; redirects to / on success.
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { Btn } from "../../components/Btn";
import { Input } from "../../components/Input";
import { InlineError } from "../../components/InlineError";
import { signIn } from "../../lib/auth";
import { palette } from "../../lib/palette";
import { AuthLayout } from "./AuthLayout";

function friendly(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("invalid-credential") || code.includes("wrong-password"))
    return "Email or password is incorrect.";
  if (code.includes("user-not-found")) return "No agent with that email.";
  if (code.includes("too-many-requests"))
    return "Too many attempts. Try again in a moment.";
  if (code.includes("network")) return "Network problem. Check your connection.";
  return "Could not sign in. Please try again.";
}

export function LoginScreen() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(form.email.trim(), form.password);
      nav("/agent", { replace: true });
    } catch (err) {
      setError(friendly(err));
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1
        className="font-display text-3xl mb-2"
        style={{ color: palette.ink, fontWeight: 500 }}
      >
        Welcome back
      </h1>
      <p className="text-sm mb-8" style={{ color: palette.inkSoft }}>
        Sign in to manage your listings
      </p>

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="agent@agency.mn"
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Your password"
          required
        />

        {error ? <InlineError message={error} /> : null}

        <Btn type="submit" disabled={loading} className="w-full">
          {loading ? <Loader size={16} className="animate-spin" /> : null}
          Sign in
        </Btn>
      </form>

      <div className="mt-6 text-sm" style={{ color: palette.inkSoft }}>
        New here?{" "}
        <Link
          to="/signup"
          className="underline"
          style={{ color: palette.terracotta }}
        >
          Create an agent account
        </Link>
      </div>
    </AuthLayout>
  );
}
