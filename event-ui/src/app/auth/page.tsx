"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  return (
    <AuthCard>
      <SocialButtons />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login" className="mt-6">
          <LoginForm />
        </TabsContent>
        
        <TabsContent value="register" className="mt-6">
          <RegisterForm />
        </TabsContent>
      </Tabs>
    </AuthCard>
  );
}
