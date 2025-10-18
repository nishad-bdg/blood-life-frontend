"use client"

import { JSX, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { RHFText, RHFPassword } from "@/components/forms/inputs"
import { useRouter } from "next/navigation"

const schema = z.object({
  phone: z
    .string()
    .min(10, "Enter a valid mobile number")
    .regex(/^[0-9]+$/, "Only digits allowed"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type FormValues = z.infer<typeof schema>

const SignInPage =(): JSX.Element => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", password: "" },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      await toast.promise(signIn("credentials", { redirect: false, ...values }), {
        loading: "Signing in…",
        success: (res) => {
          if (res?.error) throw new Error(res.error)
          router.push("/")
          return "Welcome back!"
        },
        error: (err) => err.message || "Login failed",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-10">
      <Card className="w-full max-w-md shadow-lg border border-border p-6">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-foreground">Welcome Back</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                <RHFText
                  control={form.control}
                  name="phone"
                  label="Mobile Number"
                  placeholder="01XXXXXXXXX"
                  requiredMarker
                />

                <RHFPassword
                  control={form.control}
                  name="password"
                  label="Password"
                  placeholder="Enter your password"
                  requiredMarker
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-[50px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="pt-2 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Sign up
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SignInPage