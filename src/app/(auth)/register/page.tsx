"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerContractor } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerContractor, null);

  if (state && "success" in state) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a confirmation link to your email address. Click it to
              activate your account, then complete your contractor profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Contractor sign-up</CardTitle>
          <CardDescription>
            Create your account, then add your company details on the next step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" required autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            {state && "error" in state && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
