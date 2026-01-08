import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
            formFieldInput: "border-input bg-background",
            card: "bg-card border-border",
          },
          layout: {
            socialButtonsPlacement: "top",
          },
          variables: {
            colorPrimary: "hsl(var(--primary))",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
}

