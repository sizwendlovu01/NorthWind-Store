import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { EyeIcon, EyeOffIcon, LogInIcon, StoreIcon, UserPlusIcon } from "lucide-react";
import { useAuth } from "../lib/auth";

/** sign-in and sign-up form; `mode` is "sign-in" or "sign-up" */
function AuthPage({ mode }) {
  const isSignUp = mode === "sign-up";
  const { isSignedIn, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isSignedIn) return <Navigate to={redirect} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isSignUp) await signUp({ email, password, displayName });
      else await signIn({ email, password });
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const otherHref = `${isSignUp ? "/sign-in" : "/sign-up"}${
    redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""
  }`;

  return (
    <div className="mx-auto max-w-md">
      <div className="card border border-base-300 bg-base-100 shadow-md">
        <form className="card-body gap-4" onSubmit={handleSubmit}>
          <div className="mb-2 flex flex-col items-center gap-3 text-center">
            <span className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <StoreIcon className="size-7" aria-hidden />
            </span>
            <h1 className="text-2xl font-bold text-base-content">
              {isSignUp ? "Create your account" : "Sign in to Northwind"}
            </h1>
            <p className="text-sm text-base-content/65">
              {isSignUp ? "Track orders and chat with support." : "Welcome back."}
            </p>
          </div>

          {error ? (
            <div role="alert" className="alert alert-error alert-soft text-sm">
              {error}
            </div>
          ) : null}

          {isSignUp ? (
            <label className="form-control w-full">
              <span className="label-text mb-1 block text-sm">Name (optional)</span>
              <input
                type="text"
                className="input input-bordered w-full"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
          ) : null}

          <label className="form-control w-full">
            <span className="label-text mb-1 block text-sm">Email</span>
            <input
              type="email"
              required
              className="input input-bordered w-full"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <div className="form-control w-full">
            <label htmlFor="auth-password" className="label-text mb-1 block text-sm">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={isSignUp ? 8 : undefined}
                className="input input-bordered w-full pr-12"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="btn btn-ghost btn-sm btn-square absolute top-1/2 right-1 z-10 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" aria-hidden />
                ) : (
                  <EyeIcon className="size-4" aria-hidden />
                )}
              </button>
            </div>
            {isSignUp ? (
              <span className="mt-1 block text-xs text-base-content/60">At least 8 characters.</span>
            ) : null}
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-2 w-full gap-2"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <span className="loading loading-spinner loading-sm" aria-hidden />
            ) : isSignUp ? (
              <UserPlusIcon className="size-4" aria-hidden />
            ) : (
              <LogInIcon className="size-4" aria-hidden />
            )}
            {isSignUp ? "Create account" : "Sign in"}
          </button>

          <p className="text-center text-sm text-base-content/70">
            {isSignUp ? "Already have an account? " : "New here? "}
            <Link to={otherHref} className="link link-primary">
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
