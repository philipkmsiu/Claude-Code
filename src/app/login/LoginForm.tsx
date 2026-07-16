"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          defaultValue="admin@kmclaim.test"
          autoComplete="username"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          defaultValue="demo1234"
          autoComplete="current-password"
        />
      </div>
      {state?.error && (
        <p className="text-[color:var(--danger)] text-[13px]">{state.error}</p>
      )}
      <button type="submit" className="btn btn-primary w-full justify-center" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
