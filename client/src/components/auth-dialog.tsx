import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, signInSchema, forgotPasswordSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { z } from "zod";

interface AuthDialogProps {
  onAuthSuccess: (user: any) => void;
}

export default function AuthDialog({ onAuthSuccess }: AuthDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onChange",
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: "",
      email: "",
    },
    mode: "onChange",
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: z.infer<typeof signUpSchema>) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "✓ Account created successfully!", 
        description: "Welcome to Voice Mate!"
      });
      onAuthSuccess(data.user);
      setIsOpen(false);
      signUpForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Sign up failed", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (data: z.infer<typeof signInSchema>) => {
      const response = await apiRequest("POST", "/api/auth/signin", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "✓ Signed in successfully!", 
        description: `Welcome back, ${data.user.username}!`
      });
      onAuthSuccess(data.user);
      setIsOpen(false);
      signInForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Sign in failed", 
        description: error.message || "Invalid username or password",
        variant: "destructive" 
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof forgotPasswordSchema>) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "✓ Password reset successful!", 
        description: `Your temporary password has been sent to your email`,
      });
      setShowForgotPassword(false);
      setActiveTab("signin");
      forgotPasswordForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Password reset failed", 
        description: error.message || "User not found with provided details",
        variant: "destructive" 
      });
    },
  });

  const onSignUp = (values: z.infer<typeof signUpSchema>) => {
    signUpMutation.mutate(values);
  };

  const onSignIn = (values: z.infer<typeof signInSchema>) => {
    signInMutation.mutate(values);
  };

  const onForgotPassword = (values: z.infer<typeof forgotPasswordSchema>) => {
    forgotPasswordMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-8 h-8 p-0 bg-pink-400 hover:bg-pink-500 border-2 border-border"
        >
          <User className="w-4 h-4 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            {showForgotPassword ? "Reset Your Password" : "Welcome to Voice Mate"}
          </DialogTitle>
        </DialogHeader>

        {showForgotPassword ? (
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  Enter your username and email to reset your password
                </p>
              </div>

              <FormField
                control={forgotPasswordForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your username" 
                        {...field}
                        disabled={forgotPasswordMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email" 
                        {...field}
                        disabled={forgotPasswordMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2 pt-2">
                <Button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending || !forgotPasswordForm.formState.isValid}
                  className="flex-1"
                >
                  {forgotPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1"
                >
                  Back
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4">
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your username" 
                            {...field}
                            disabled={signInMutation.isPending}
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Enter your password" 
                              {...field}
                              disabled={signInMutation.isPending}
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4 text-gray-500" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={signInMutation.isPending || !signInForm.formState.isValid}
                    className="w-full"
                  >
                    {signInMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowForgotPassword(true)}
                    className="w-full text-sm"
                  >
                    Forgot Password?
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a username (3-20 chars)" 
                            {...field}
                            disabled={signUpMutation.isPending}
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            {...field}
                            disabled={signUpMutation.isPending}
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Create a password (min 8 chars)" 
                              {...field}
                              disabled={signUpMutation.isPending}
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4 text-gray-500" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm your password" 
                              {...field}
                              disabled={signUpMutation.isPending}
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4 text-gray-500" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password requirements indicator */}
                  {signUpForm.watch("password") && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                      <div className={`text-xs flex items-center gap-2 ${signUpForm.watch("password").length >= 8 ? "text-green-600" : "text-gray-400"}`}>
                        {signUpForm.watch("password").length >= 8 ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        At least 8 characters
                      </div>
                      <div className={`text-xs flex items-center gap-2 ${/[A-Z]/.test(signUpForm.watch("password")) ? "text-green-600" : "text-gray-400"}`}>
                        {/[A-Z]/.test(signUpForm.watch("password")) ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        One uppercase letter
                      </div>
                      <div className={`text-xs flex items-center gap-2 ${/[0-9]/.test(signUpForm.watch("password")) ? "text-green-600" : "text-gray-400"}`}>
                        {/[0-9]/.test(signUpForm.watch("password")) ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        One number
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={signUpMutation.isPending || !signUpForm.formState.isValid}
                    className="w-full"
                  >
                    {signUpMutation.isPending ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
