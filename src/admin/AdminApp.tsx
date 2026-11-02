import { saveAdminSession } from "../lib/adminApi";
import { AdminLogin } from "./AdminLogin";

export function AdminApp() {
  const handleSignedIn = (accessToken: string) => {
    saveAdminSession(accessToken);
    window.location.href = window.location.pathname;
  };

  return <AdminLogin onSignedIn={handleSignedIn} />;
}
