"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="admin-login-form" suppressHydrationWarning>
      <label htmlFor="admin-password">Password</label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" required autoFocus suppressHydrationWarning />
      {state.error && <p className="admin-form-error" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Opening…" : "Open admin panel"}</button>
    </form>
  );
}
