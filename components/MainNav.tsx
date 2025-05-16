// components/MainNav.tsx
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Mails, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GetStartedModal } from "@/components/GetStartedModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccountMenu } from "@/components/AccountModal";
import { useDemoAuth } from "@/contexts/DemoContext";
import { NotificationBell } from "@/components/NotificationBell";
import { useRole } from "@/contexts/RoleContext";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 1) **Dynamic import** of a _named_ export must wrap it in `{ default: … }`
const WalletConnector = dynamic(
  () =>
    import("@/components/WalletConnector").then((mod) => ({
      default: mod.WalletConnector,
    })),
  { ssr: false }
);

const authenticatedNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/vault", label: "Vault" },
];
const unauthenticatedNavItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export function MainNav() {
  const pathname = usePathname();
  const { user, setUser } = useAuth();
  const { isDemoAuthenticated } = useDemoAuth();
  const { role, setRole } = useRole();

  // UI state
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  // Supabase auth state
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [emailForAuth, setEmailForAuth] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [authError, setAuthError] = useState("");

  // 2) Check session _and_ subscribe, then clean up correctly
  useEffect(() => {
    let subscription: any;

    const checkSession = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          setSupabaseUser(user);
          setUser?.(user);
        }
      } catch (e) {
        console.error("Error getting session:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();

    const { data } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (session) {
        setSupabaseUser(session.user);
        setUser?.(session.user);
      } else {
        setSupabaseUser(null);
        setUser?.(null);
      }
    });
    subscription = data.subscription;

    return () => subscription?.unsubscribe();
  }, [setUser]);

  // 3) Hide navbar on scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.pageYOffset;
      setVisible(prevScrollPos > y || y < 10);
      setPrevScrollPos(y);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [prevScrollPos]);

  // 4) OTP flows
  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailForAuth,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtpSent(true);
    } catch (e: any) {
      console.error("sendOTP error:", e);
      setAuthError(e.message || "Failed to send code");
    } finally {
      setIsAuthenticating(false);
    }
  };
  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailForAuth,
        token: otpCode,
        type: "email",
      });
      if (error) throw error;
      setIsLoginOpen(false);
      setOtpSent(false);
      setOtpCode("");
      setEmailForAuth("");
    } catch (e: any) {
      console.error("verifyOTP error:", e);
      setAuthError(e.message || "Failed to verify code");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };
  const handleLoginModalClose = () => {
    setIsLoginOpen(false);
    setOtpSent(false);
    setOtpCode("");
    setEmailForAuth("");
    setAuthError("");
  };

  const isAuthenticated = !!(user || supabaseUser || isDemoAuthenticated);

  if (isLoading) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 bg-background flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-50 bg-background transition-transform duration-300",
          visible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        {/* Role selector */}
        {isAuthenticated && (
          <div className="w-full flex justify-center py-2 border-b border-gray-300 dark:border-gray-700">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[180px] focus:ring-0">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Freelancer">Freelancer</SelectItem>
                <SelectItem value="Buyer">Buyer</SelectItem>
                <SelectItem value="Adjudicator">Adjudicator</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-gray-300 dark:border-gray-700">
          <Link href="/" className="text-xl font-bold">
            SmarTrust
          </Link>

          <div className="flex-1 flex justify-center space-x-6">
            {(
              isAuthenticated
                ? authenticatedNavItems
                : unauthenticatedNavItems
            ).map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "text-sm font-medium hover:text-primary",
                  pathname === it.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {it.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <WalletConnector />
                <Link
                  href="/messages"
                  className="border rounded-md p-2 hover:text-primary"
                >
                  <Mails className="h-5 w-5" />
                </Link>
                <NotificationBell />
                <ThemeToggle />
                <AccountMenu onSignOut={handleSignOut} />
              </>
            ) : (
              <>
                <ThemeToggle />
                <Button variant="outline" onClick={() => setIsLoginOpen(true)}>
                  Log In
                </Button>
                <Button onClick={() => setIsGetStartedOpen(true)}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* ——— Login Dialog ——— */}
      <Dialog open={isLoginOpen} onOpenChange={handleLoginModalClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {otpSent ? "Enter Verification Code" : "Log In to SmarTrust"}
            </DialogTitle>
            <DialogDescription>
              {otpSent
                ? "We've sent you a code—paste it here."
                : "Enter your email to receive a verification code."}
            </DialogDescription>
          </DialogHeader>

          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          {!otpSent ? (
            <form onSubmit={sendOTP} className="space-y-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={emailForAuth}
                onChange={(e) => setEmailForAuth(e.target.value)}
                required
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full"
                >
                  {isAuthenticating && (
                    <Loader2 className="animate-spin mr-2" />
                  )}
                  Send Code
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={verifyOTP} className="space-y-4">
              <Label htmlFor="otp">Code</Label>
              <Input
                id="otp"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
              <DialogFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full"
                >
                  {isAuthenticating && (
                    <Loader2 className="animate-spin mr-2" />
                  )}
                  Verify
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOtpSent(false)}
                  disabled={isAuthenticating}
                  className="w-full"
                >
                  Use different email
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ——— Get Started Modal ——— */}
      <GetStartedModal
        open={isGetStartedOpen}
        onOpenChange={setIsGetStartedOpen}
      />
    </>
  );
}
