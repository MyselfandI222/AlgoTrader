/**
 * Automated Stop-Loss and Take-Profit Management System
 * Handles real-time monitoring and execution of protective orders
 */

import { marketDataService } from './market-data-service.ts';

export interface StopLossOrder {
  id: string;
  symbol: string;
  quantity: number;
  originalPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  trailingStop: boolean;
  trailingStopPercent?: number;
  currentHighWaterMark?: number; // For trailing stops
  status: 'active' | 'triggered' | 'cancelled' | 'expired';
  triggerType?: 'stop_loss' | 'take_profit' | 'trailing_stop';
  createdAt: Date;
  triggeredAt?: Date;
  reason?: string;
}

export interface StopLossSettings {
  enableStopLoss: boolean;
  defaultStopLossPercent: number; // 5-25%
  enableTakeProfit: boolean;
  defaultTakeProfitPercent: number; // 10-50%
  enableTrailingStop: boolean;
  defaultTrailingStopPercent: number; // 5-15%
  maxLossPerPosition: number; // Maximum loss per position in dollars
  emergencyStopPercent: number; // Emergency stop for extreme losses
  autoRebalanceAfterTrigger: boolean; // Auto-rebalance portfolio after stop triggers
}

export class StopLossManager {
  private activeOrders: Map<string, StopLossOrder> = new Map();
  private settings: StopLossSettings;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private triggeredOrders: StopLossOrder[] = [];

  constructor(settings: StopLossSettings) {
    this.settings = settings;
    this.startMonitoring();
  }

  // Create a new stop-loss order
  createStopLossOrder(
    symbol: string,
    quantity: number,
    originalPrice: number,
    customStopLoss?: number,
    customTakeProfit?: number,
    useTrailingStop?: boolean
  ): StopLossOrder {
    const id = this.generateOrderId();
    
    const stopLossPrice = customStopLoss || (originalPrice * (1 - this.settings.defaultStopLossPercent / 100));
    const takeProfitPrice = this.settings.enableTakeProfit 
      ? customTakeProfit || (originalPrice * (1 + this.settings.defaultTakeProfitPercent / 100))
      : undefined;

    const order: StopLossOrder = {
      id,
      symbol,
      quantity,
      originalPrice,
      stopLossPrice,
      takeProfitPrice,
      trailingStop: useTrailingStop || this.settings.enableTrailingStop,
      trailingStopPercent: this.settings.defaultTrailingStopPercent,
      currentHighWaterMark: originalPrice,
      status: 'active',
      createdAt: new Date()
    };

    this.activeOrders.set(id, order);
    console.log(`📋 Created stop-loss order for ${symbol}: Stop at $${stopLossPrice.toFixed(2)}, Take profit at $${takeProfitPrice?.toFixed(2) || 'N/A'}`);
    
    return order;
  }

  // Start real-time monitoring
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.checkAllOrders();
    }, 10000); // Check every 10 seconds

    console.log('🔍 Stop-loss monitoring started (checking every 10 seconds)');
  }

  // Check all active orders for triggers
  private async checkAllOrders(): Promise<void> {
    if (this.activeOrders.size === 0) return;

    try {
      const marketData = await marketDataService.refreshMarketData();
      const marketPrices = new Map(marketData.map(stock => [stock.symbol, parseFloat(stock.price)]));

      for (const [orderId, order] of this.activeOrders.entries()) {
        const currentPrice = marketPrices.get(order.symbol);
        if (!currentPrice) continue;

        const triggerResult = this.checkOrderTrigger(order, currentPrice);
        if (triggerResult.shouldTrigger) {
          await this.triggerOrder(order, triggerResult.triggerType, triggerResult.reason, currentPrice);
        } else if (order.trailingStop) {
          this.updateTrailingStop(order, currentPrice);
        }
      }
    } catch (error) {
      console.error('Error checking stop-loss orders:', error);
    }
  }

  // Check if an order should be triggered
  private checkOrderTrigger(order: StopLossOrder, currentPrice: number): {
    shouldTrigger: boolean;
    triggerType?: 'stop_loss' | 'take_profit' | 'trailing_stop';
    reason?: string;
  } {
    // Check emergency stop (extreme loss)
    const currentLossPercent = ((order.originalPrice - currentPrice) / order.originalPrice) * 100;
    if (currentLossPercent >= this.settings.emergencyStopPercent) {
      return {
        shouldTrigger: true,
        triggerType: 'stop_loss',
        reason: `Emergency stop triggered: ${currentLossPercent.toFixed(1)}% loss exceeds ${this.settings.emergencyStopPercent}% threshold`
      };
    }

    // Check regular stop-loss
    if (this.settings.enableStopLoss && currentPrice <= order.stopLossPrice) {
      return {
        shouldTrigger: true,
        triggerType: 'stop_loss',
        reason: `Stop-loss triggered: Price $${currentPrice.toFixed(2)} hit stop-loss level $${order.stopLossPrice.toFixed(2)}`
      };
    }

    // Check take-profit
    if (order.takeProfitPrice && currentPrice >= order.takeProfitPrice) {
      return {
        shouldTrigger: true,
        triggerType: 'take_profit',
        reason: `Take-profit triggered: Price $${currentPrice.toFixed(2)} hit target $${order.takeProfitPrice.toFixed(2)}`
      };
    }

    // Check trailing stop
    if (order.trailingStop && order.currentHighWaterMark && order.trailingStopPercent) {
      const trailingStopPrice = order.currentHighWaterMark * (1 - order.trailingStopPercent / 100);
      if (currentPrice <= trailingStopPrice) {
        return {
          shouldTrigger: true,
          triggerType: 'trailing_stop',
          reason: `Trailing stop triggered: Price $${currentPrice.toFixed(2)} fell ${order.trailingStopPercent}% from high of $${order.currentHighWaterMark.toFixed(2)}`
        };
      }
    }

    return { shouldTrigger: false };
  }

  // Update trailing stop high watermark
  private updateTrailingStop(order: StopLossOrder, currentPrice: number): void {
    if (!order.currentHighWaterMark || currentPrice > order.currentHighWaterMark) {
      order.currentHighWaterMark = currentPrice;
      
      // Update the stop-loss price based on new high
      if (order.trailingStopPercent) {
        const newStopLoss = currentPrice * (1 - order.trailingStopPercent / 100);
        if (newStopLoss > order.stopLossPrice) {
          order.stopLossPrice = newStopLoss;
          console.log(`📈 Updated trailing stop for ${order.symbol}: New stop at $${newStopLoss.toFixed(2)} (High: $${currentPrice.toFixed(2)})`);
        }
      }
    }
  }

  // Execute order trigger
  private async triggerOrder(
    order: StopLossOrder, 
    triggerType: 'stop_loss' | 'take_profit' | 'trailing_stop',
    reason: string,
    currentPrice: number
  ): Promise<void> {
    order.status = 'triggered';
    order.triggerType = triggerType;
    order.triggeredAt = new Date();
    order.reason = reason;

    // Move to triggered orders history
    this.triggeredOrders.unshift(order);
    this.activeOrders.delete(order.id);

    // Calculate P&L
    const pnl = (currentPrice - order.originalPrice) * order.quantity;
    const pnlPercent = ((currentPrice - order.originalPrice) / order.originalPrice) * 100;

    console.log(`🚨 ${triggerType.toUpperCase()} TRIGGERED for ${order.symbol}:`);
    console.log(`   ${reason}`);
    console.log(`   P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)`);

    // In a real system, this would execute the actual trade
    // For now, we'll just log the action
    console.log(`💰 Executing ${triggerType} sell order: ${order.quantity} shares of ${order.symbol} at $${currentPrice.toFixed(2)}`);

    // Optionally trigger portfolio rebalancing
    if (this.settings.autoRebalanceAfterTrigger) {
      console.log('🔄 Auto-rebalancing portfolio after stop-loss trigger...');
      // This would trigger the AI engine to rebalance
    }
  }

  // Get all active orders
  getActiveOrders(): StopLossOrder[] {
    return Array.from(this.activeOrders.values());
  }

  // Get triggered orders history
  getTriggeredOrders(limit: number = 50): StopLossOrder[] {
    return this.triggeredOrders.slice(0, limit);
  }

  // Get order by ID
  getOrder(orderId: string): StopLossOrder | undefined {
    return this.activeOrders.get(orderId);
  }

  // Cancel an order
  cancelOrder(orderId: string): boolean {
    const order = this.activeOrders.get(orderId);
    if (order) {
      order.status = 'cancelled';
      this.activeOrders.delete(orderId);
      console.log(`❌ Cancelled stop-loss order ${orderId} for ${order.symbol}`);
      return true;
    }
    return false;
  }

  // Update order parameters
  updateOrder(
    orderId: string, 
    updates: Partial<Pick<StopLossOrder, 'stopLossPrice' | 'takeProfitPrice' | 'trailingStopPercent'>>
  ): boolean {
    const order = this.activeOrders.get(orderId);
    if (order && order.status === 'active') {
      Object.assign(order, updates);
      console.log(`📝 Updated stop-loss order ${orderId} for ${order.symbol}`);
      return true;
    }
    return false;
  }

  // Update settings
  updateSettings(newSettings: Partial<StopLossSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('⚙️ Stop-loss settings updated:', this.settings);
  }

  // Get current settings
  getSettings(): StopLossSettings {
    return { ...this.settings };
  }

  // Generate statistics
  getStatistics(): {
    totalActiveOrders: number;
    totalTriggered: number;
    successfulTakeProfits: number;
    triggeredStopLosses: number;
    trailingStopTriggers: number;
    averagePnL: number;
    totalProtectedValue: number;
  } {
    const successfulTakeProfits = this.triggeredOrders.filter(o => o.triggerType === 'take_profit').length;
    const triggeredStopLosses = this.triggeredOrders.filter(o => o.triggerType === 'stop_loss').length;
    const trailingStopTriggers = this.triggeredOrders.filter(o => o.triggerType === 'trailing_stop').length;
    
    const totalPnL = this.triggeredOrders.reduce((sum, order) => {
      if (!order.triggeredAt) return sum;
      // This is a simplified P&L calculation
      return sum + ((order.originalPrice - order.stopLossPrice) * order.quantity);
    }, 0);
    
    const averagePnL = this.triggeredOrders.length > 0 ? totalPnL / this.triggeredOrders.length : 0;
    
    const totalProtectedValue = Array.from(this.activeOrders.values()).reduce(
      (sum, order) => sum + (order.originalPrice * order.quantity), 0
    );

    return {
      totalActiveOrders: this.activeOrders.size,
      totalTriggered: this.triggeredOrders.length,
      successfulTakeProfits,
      triggeredStopLosses,
      trailingStopTriggers,
      averagePnL,
      totalProtectedValue
    };
  }

  // Generate unique order ID
  private generateOrderId(): string {
    return `SL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup method
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🛑 Stop-loss monitoring stopped');
  }
}

// Default stop-loss settings
export const DEFAULT_STOP_LOSS_SETTINGS: StopLossSettings = {
  enableStopLoss: true,
  defaultStopLossPercent: 8, // 8% stop-loss
  enableTakeProfit: true,
  defaultTakeProfitPercent: 15, // 15% take-profit
  enableTrailingStop: true,
  defaultTrailingStopPercent: 10, // 10% trailing stop
  maxLossPerPosition: 5000, // $5,000 max loss per position
  emergencyStopPercent: 20, // 20% emergency stop
  autoRebalanceAfterTrigger: true
};

// Global stop-loss manager instance
export const stopLossManager = new StopLossManager(DEFAULT_STOP_LOSS_SETTINGS);