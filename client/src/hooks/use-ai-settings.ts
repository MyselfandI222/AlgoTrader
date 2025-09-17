import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export interface AISettings {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentAmount: number;
  strategies: string[];
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly';
  maxPositions: number;
  diversificationTarget: number;
  volatilityThreshold: number;
  correlationLimit: number;
  sectorAllocationLimits: Record<string, number>;
  rebalanceThreshold: number;
  enableStopLoss: boolean;
  stopLossPercent: number;
  enableTakeProfit: boolean;
  takeProfitPercent: number;
  enableTrendExit: boolean;
  maxDrawdownPercent: number;
  strategyAllocations?: Record<string, number>;
}

export interface StrategyAllocation {
  id: string;
  name: string;
  enabled: boolean;
  allocation: number; // percentage
}

export function useAISettings() {
  return useQuery({
    queryKey: ['/api/ai/settings'],
    staleTime: 300000, // 5 minutes
  });
}

export function useUpdateAISettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<AISettings>) => {
      const response = await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update AI settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/settings'] });
      toast({
        title: "Settings Updated",
        description: "AI strategy settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed", 
        description: "Failed to save AI strategy settings. Please try again.",
        variant: "destructive",
      });
      console.error('Failed to update AI settings:', error);
    }
  });
}

export function useToggleStrategy() {
  const updateSettings = useUpdateAISettings();
  const { data: settings } = useAISettings();

  return useMutation({
    mutationFn: async ({ strategyId, enabled }: { strategyId: string, enabled: boolean }) => {
      const currentStrategies = (settings as AISettings)?.strategies || [];
      let newStrategies;
      
      if (enabled && !currentStrategies.includes(strategyId)) {
        newStrategies = [...currentStrategies, strategyId];
      } else if (!enabled) {
        newStrategies = currentStrategies.filter(id => id !== strategyId);
      } else {
        newStrategies = currentStrategies;
      }
      
      return updateSettings.mutateAsync({ strategies: newStrategies });
    },
  });
}

export function useUpdateStrategyAllocation() {
  const updateSettings = useUpdateAISettings();
  const { data: settings } = useAISettings();

  return useMutation({
    mutationFn: async ({ strategyId, allocation }: { strategyId: string, allocation: number }) => {
      // For now, we'll store individual strategy allocations in a new field
      const currentSettings = settings as AISettings;
      const strategyAllocations = {
        ...currentSettings?.strategyAllocations,
        [strategyId]: allocation
      };
      
      return updateSettings.mutateAsync({ 
        strategyAllocations 
      } as any);
    },
  });
}