// Creates a Firebase Auth user + matching /agents/{uid} doc, then redirects into the dashboard.
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { Btn } from "../../components/Btn";
import { Input } from "../../components/Input";
import { InlineError } from "../../components/InlineError";
import { signUp } from "../../lib/auth";
import { palette } from "../../lib/palette";
import { AuthLayout } from "./AuthLayout";

function friendly(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("email-already-in-use"))
    return "An agent with this email already exists.";
  if (code.includes("invalid-email")) return "That email looks invalid.";
  if (code.includes("weak-password"))
    return "Password is too weak. Use 6+ characters.";
  if (code.includes("network")) return "Network problem. Check your connection.";
  return "Could not create account. Please try again.";
}

export function SignupScreen() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setError("Name, valid email, and password (6+ characters) are required.");
      return;
    }
    setLoading(true);
    try {
      await signUp(form.email.trim(), form.password, form.name.trim());
      nav("/", { replace: true });
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
        Create your account
      </h1>
      <p className="text-sm mb-8" style={{ color: palette.inkSoft }}>
        Start adding properties in minutes
      </p>

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Bat-Erdene Ganbold"
          autoComplete="name"
          required
        />
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
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="At least 6 characters"
          required
        />

        {error ? <InlineError message={error} /> : null}

        <Btn type="submit" disabled={loading} className="w-full">
          {loading ? <Loader size={16} className="animate-spin" /> : null}
          Create account
        </Btn>
      </form>

      <div className="mt-6 text-sm" style={{ color: palette.inkSoft }}>
        Already have an account?{" "}
        <Link
          to="/login"
          className="underline"
          style={{ color: palette.terracotta }}
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
