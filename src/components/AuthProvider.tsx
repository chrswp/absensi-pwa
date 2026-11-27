import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return <NeonAuthUIProvider authClient={authClient} defaultTheme="light" navigate={(href) => navigate(href)} replace={(href) => navigate(href, { replace: true })} Link={({ href, ...props }) => <Link to={href} {...props} />}>
    {children}
  </NeonAuthUIProvider>;
}
