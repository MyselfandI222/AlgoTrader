import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { FaGoogle, FaYahoo } from "react-icons/fa";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Get error from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleYahooLogin = () => {
    window.location.href = '/api/auth/yahoo';
  };

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'google':
        return 'Google login failed. Please try again.';
      case 'yahoo':
        return 'Yahoo login failed. Please try again.';
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <Card className="w-full max-w-md bg-gray-800/90 border-gray-700 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-white">
            Welcome to TradeAI
          </CardTitle>
          <CardDescription className="text-gray-300">
            Sign in to access your AI-powered trading platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {getErrorMessage(error)}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3"
              data-testid="button-google-login"
            >
              <FaGoogle className="mr-3 h-4 w-4 text-red-500" />
              Continue with Google
            </Button>

            <Button
              onClick={handleYahooLogin}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3"
              data-testid="button-yahoo-login"
            >
              <FaYahoo className="mr-3 h-4 w-4" />
              Continue with Yahoo
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}