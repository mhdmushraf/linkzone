import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, User, Building2, Check } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

const inputCls = "h-12 rounded-[10px] bg-white border-border";

export default function Register() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpState, setOtpState] = useState("default"); // "default" | "error" | "success"
  const [shakeKey, setShakeKey] = useState(0);
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem("lz_name", name);
      localStorage.setItem("lz_company", company);
      await base44.auth.register({ email, password });
      setOtpCode("");
      setOtpState("default");
      setResendIn(30);
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const doVerify = async (code) => {
    const value = (code ?? otpCode).replace(/\D/g, "");
    if (value.length < 6) return;
    setError("");
    setOtpState("default");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode: value });
      setOtpState("success");
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      setTimeout(() => {
        window.location.href = "/onboarding";
      }, 750);
    } catch (err) {
      setOtpState("error");
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const onOtpChange = (val) => {
    const cleaned = (val || "").replace(/\D/g, "").slice(0, 6);
    setOtpCode(cleaned);
    if (otpState === "error") setOtpState("default");
    if (cleaned.length === 6 && !loading && otpState !== "success") {
      doVerify(cleaned);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError("");
    try {
      await base44.auth.resendOtp(email);
      setResendIn(30);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleChangeEmail = () => {
    setShowOtp(false);
    setOtpCode("");
    setOtpState("default");
    setError("");
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={
          <div className="w-12 h-12 rounded-full bg-tint flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" strokeWidth={2.5} />
          </div>
        }
        title="Verify your email"
        subtitle={`We sent a code to ${email}`}
      >
        {error && otpState !== "error" && (
          <div className="mb-4 p-3 rounded-[10px] bg-destructive/10 text-destructive text-sm font-500">
            {error}
          </div>
        )}
        {otpState === "error" && (
          <p className="mb-4 text-sm font-600 text-destructive">That code isn't right. Try again.</p>
        )}

        <div className="flex justify-center mb-6">
          <div key={shakeKey} className={otpState === "error" ? "animate-otp-shake" : ""}>
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={onOtpChange}
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="\d*"
              disabled={loading || otpState === "success"}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} state={otpState} />
                <InputOTPSlot index={1} state={otpState} />
                <InputOTPSlot index={2} state={otpState} />
                <InputOTPSeparator />
                <InputOTPSlot index={3} state={otpState} />
                <InputOTPSlot index={4} state={otpState} />
                <InputOTPSlot index={5} state={otpState} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <Button
          className="w-full h-12 font-600 rounded-xl"
          onClick={() => doVerify()}
          disabled={loading || otpCode.length < 6 || otpState === "success"}
        >
          {otpState === "success" ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Verified
            </>
          ) : loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          {resendIn > 0 ? (
            <span className="text-faint font-500">Resend in {resendIn}s</span>
          ) : (
            <button onClick={handleResend} className="text-primary font-600 hover:underline">
              Resend
            </button>
          )}
        </p>

        <button
          type="button"
          onClick={handleChangeEmail}
          className="mt-3 block w-full text-center text-sm text-faint hover:text-foreground underline underline-offset-2"
        >
          Wrong email? Change it
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your 14-day free trial — no card required today"
      footer={
        <>
          Already have an account?{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-primary font-600 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-600 mb-5 rounded-[10px] bg-white"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground font-500">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[10px] bg-destructive/10 text-destructive text-sm font-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="font-600">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" aria-hidden="true" />
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`pl-10 ${inputCls}`}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company" className="font-600">Company name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" aria-hidden="true" />
            <Input
              id="company"
              type="text"
              placeholder="Acme Distribution Ltd"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={`pl-10 ${inputCls}`}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-600">Work email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 ${inputCls}`}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-600">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" aria-hidden="true" />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 ${inputCls}`}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="font-600">Confirm</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" aria-hidden="true" />
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`pl-10 ${inputCls}`}
                required
              />
            </div>
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-600 rounded-[10px]" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}