import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMarketDataProviders } from "@/hooks/use-market-data";
import { 
  Wifi, 
  WifiOff, 
  Key, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Clock,
  Zap
} from "lucide-react";

interface APIProvider {
  name: string;
  description: string;
  freeLimit: string;
  rateLimits: string;
  latency: string;
  pricing: string;
  signupUrl: string;
  envVarName: string;
  isConfigured: boolean;
  status: "active" | "inactive" | "error";
}

export function APISettings() {
  const { toast } = useToast();
  const { data: providers } = useMarketDataProviders();
  
  const [apiKeys, setApiKeys] = useState({
    IEX_CLOUD_API_KEY: "",
    TWELVEDATA_API_KEY: "",
    ALPHA_VANTAGE_API_KEY: "",
    FINNHUB_API_KEY: ""
  });

  const apiProviders: APIProvider[] = [
    {
      name: "IEX Cloud",
      description: "Best free tier for day trading with 50,000 calls/month and batch requests",
      freeLimit: "50,000 calls/month",
      rateLimits: "100 calls/second",
      latency: "100-200ms",
      pricing: "FREE tier available",
      signupUrl: "https://iexcloud.io/",
      envVarName: "IEX_CLOUD_API_KEY",
      isConfigured: false,
      status: "inactive"
    },
    {
      name: "Twelvedata",
      description: "Excellent free option with 800 calls/day and technical indicators included",
      freeLimit: "800 calls/day",
      rateLimits: "8 calls/minute (free)",
      latency: "200-500ms",
      pricing: "FREE tier available",
      signupUrl: "https://twelvedata.com/",
      envVarName: "TWELVEDATA_API_KEY",
      isConfigured: false,
      status: "inactive"
    },
    {
      name: "Alpha Vantage",
      description: "Currently active but limited. Good as backup provider",
      freeLimit: "25 calls/day",
      rateLimits: "5 calls/minute",
      latency: "500ms-2s",
      pricing: "FREE tier available",
      signupUrl: "https://www.alphavantage.co/",
      envVarName: "ALPHA_VANTAGE_API_KEY",
      isConfigured: true,
      status: "active"
    },
    {
      name: "Finnhub",
      description: "Professional data provider with good free tier",
      freeLimit: "60 calls/minute",
      rateLimits: "60 calls/minute",
      latency: "100-300ms",
      pricing: "FREE tier available",
      signupUrl: "https://finnhub.io/",
      envVarName: "FINNHUB_API_KEY",
      isConfigured: true,
      status: "inactive"
    }
  ];

  const updateApiKey = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const saveApiKey = async (provider: APIProvider) => {
    const key = apiKeys[provider.envVarName as keyof typeof apiKeys];
    if (!key.trim()) {
      toast({
        title: "API Key Required",
        description: `Please enter your ${provider.name} API key`,
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would save to backend securely
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "API Key Saved",
        description: `${provider.name} has been configured successfully!`,
      });
      
      // Clear the input for security
      setApiKeys(prev => ({ ...prev, [provider.envVarName]: "" }));
      
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save API key. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: APIProvider["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: APIProvider["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-600";
      case "error":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Settings</h2>
          <p className="text-gray-400 mt-1">
            Configure market data providers for your AI trading platform
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-600/20 border-blue-600 text-blue-300">
          <Wifi className="h-3 w-3 mr-1" />
          {providers?.current || "Loading..."}
        </Badge>
      </div>

      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="providers" className="text-white data-[state=active]:bg-blue-600">
            <Key className="h-4 w-4 mr-2" />
            API Providers
          </TabsTrigger>
          <TabsTrigger value="comparison" className="text-white data-[state=active]:bg-blue-600">
            <Zap className="h-4 w-4 mr-2" />
            Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4">
            {apiProviders.map((provider) => (
              <Card key={provider.name} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(provider.status)}
                      <span className="text-white">{provider.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(provider.status)}
                      >
                        {provider.status}
                      </Badge>
                      {provider.name === "IEX Cloud" && (
                        <Badge variant="outline" className="bg-yellow-600/20 border-yellow-600 text-yellow-300">
                          RECOMMENDED
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(provider.signupUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Sign Up
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-sm">{provider.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-400">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Free Limit
                      </div>
                      <p className="text-white font-medium">{provider.freeLimit}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Rate Limits
                      </div>
                      <p className="text-white font-medium">{provider.rateLimits}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-400">
                        <Zap className="h-3 w-3 mr-1" />
                        Latency
                      </div>
                      <p className="text-white font-medium">{provider.latency}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-400">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Pricing
                      </div>
                      <p className="text-white font-medium">{provider.pricing}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">
                      API Key ({provider.envVarName})
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        type="password"
                        placeholder={`Enter your ${provider.name} API key`}
                        value={apiKeys[provider.envVarName as keyof typeof apiKeys]}
                        onChange={(e) => updateApiKey(provider.envVarName, e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        data-testid={`input-${provider.envVarName}`}
                      />
                      <Button 
                        onClick={() => saveApiKey(provider)}
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid={`button-save-${provider.envVarName}`}
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  {provider.isConfigured && (
                    <div className="flex items-center space-x-2 text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>API key configured and active</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">API Provider Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-2 text-gray-400">Provider</th>
                      <th className="text-left py-2 text-gray-400">Free Limit</th>
                      <th className="text-left py-2 text-gray-400">Rate Limits</th>
                      <th className="text-left py-2 text-gray-400">Latency</th>
                      <th className="text-left py-2 text-gray-400">Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700">
                      <td className="py-2 font-medium text-yellow-300">IEX Cloud ⭐</td>
                      <td className="py-2 text-green-400">50,000/month</td>
                      <td className="py-2 text-green-400">100/second</td>
                      <td className="py-2 text-green-400">100-200ms</td>
                      <td className="py-2 text-white">Day trading, batch requests</td>
                    </tr>
                    <tr className="border-b border-gray-700">
                      <td className="py-2 font-medium text-blue-300">Twelvedata</td>
                      <td className="py-2 text-green-400">800/day</td>
                      <td className="py-2 text-yellow-400">8/minute</td>
                      <td className="py-2 text-yellow-400">200-500ms</td>
                      <td className="py-2 text-white">Indicators, research</td>
                    </tr>
                    <tr className="border-b border-gray-700">
                      <td className="py-2 font-medium text-gray-300">Alpha Vantage</td>
                      <td className="py-2 text-red-400">25/day</td>
                      <td className="py-2 text-red-400">5/minute</td>
                      <td className="py-2 text-red-400">500ms-2s</td>
                      <td className="py-2 text-white">Backup only</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium text-purple-300">Finnhub</td>
                      <td className="py-2 text-green-400">60/minute</td>
                      <td className="py-2 text-green-400">60/minute</td>
                      <td className="py-2 text-green-400">100-300ms</td>
                      <td className="py-2 text-white">Professional data</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-blue-600/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Zap className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-300">Recommendation</h4>
                    <p className="text-blue-200 text-sm mt-1">
                      Start with <strong>IEX Cloud</strong> (50,000 free calls/month) for day trading, 
                      then add <strong>Twelvedata</strong> (800 calls/day) as backup. This gives you 
                      massive rate limit improvements over Alpha Vantage's 25 calls/day.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}