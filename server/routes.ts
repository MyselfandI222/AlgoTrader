import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTradeSchema, insertTransactionSchema, updateProfileSchema, updateNotificationsSchema, changePasswordSchema } from "@shared/schema";
import { createStrategyRoutes } from "./routes/strategy-routes.js";
import { marketDataService } from "./services/market-data-service.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Don't return password in API responses
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.patch("/api/users/:id/profile", async (req, res) => {
    try {
      const profileData = updateProfileSchema.parse(req.body);
      const user = await storage.updateUser(req.params.id, profileData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  app.patch("/api/users/:id/notifications", async (req, res) => {
    try {
      const notificationData = updateNotificationsSchema.parse(req.body);
      const user = await storage.updateUser(req.params.id, notificationData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ error: "Invalid notification settings" });
    }
  });

  app.patch("/api/users/:id/password", async (req, res) => {
    try {
      const passwordData = changePasswordSchema.parse(req.body);
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // In a real app, you'd hash and verify passwords
      if (user.password !== passwordData.currentPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      const success = await storage.changePassword(req.params.id, passwordData.newPassword);
      if (!success) {
        return res.status(500).json({ error: "Failed to change password" });
      }
      
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      res.status(400).json({ error: "Invalid password data" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    const success = await storage.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, message: "Account deleted successfully" });
  });

  app.post("/api/users/:id/export", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const portfolio = await storage.getPortfolioByUserId(req.params.id);
    const trades = portfolio ? await storage.getTrades(portfolio.id) : [];
    const positions = portfolio ? await storage.getPositions(portfolio.id) : [];
    const transactions = await storage.getTransactions(req.params.id);
    
    const exportData = {
      user: { ...user, password: undefined },
      portfolio,
      trades,
      positions,
      transactions,
      exportDate: new Date().toISOString(),
    };
    
    res.json(exportData);
  });

  // Portfolio routes
  app.get("/api/portfolios/user/:userId", async (req, res) => {
    const portfolio = await storage.getPortfolioByUserId(req.params.userId);
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }
    res.json(portfolio);
  });

  app.patch("/api/portfolios/:id", async (req, res) => {
    const portfolio = await storage.updatePortfolio(req.params.id, req.body);
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }
    res.json(portfolio);
  });

  // Position routes
  app.get("/api/positions/portfolio/:portfolioId", async (req, res) => {
    const positions = await storage.getPositions(req.params.portfolioId);
    res.json(positions);
  });

  // Trade routes
  app.get("/api/trades/portfolio/:portfolioId", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const trades = limit 
      ? await storage.getRecentTrades(req.params.portfolioId, limit)
      : await storage.getTrades(req.params.portfolioId);
    res.json(trades);
  });

  app.post("/api/trades", async (req, res) => {
    try {
      const tradeData = insertTradeSchema.parse(req.body);
      const trade = await storage.createTrade(tradeData);
      res.json(trade);
    } catch (error) {
      res.status(400).json({ error: "Invalid trade data" });
    }
  });

  // Strategy routes
  app.get("/api/strategies/portfolio/:portfolioId", async (req, res) => {
    const strategies = await storage.getStrategies(req.params.portfolioId);
    res.json(strategies);
  });

  app.post("/api/strategies", async (req, res) => {
    try {
      const strategy = await storage.createStrategy(req.body);
      res.json(strategy);
    } catch (error) {
      res.status(400).json({ error: "Invalid strategy data" });
    }
  });

  app.patch("/api/strategies/:id", async (req, res) => {
    const strategy = await storage.updateStrategy(req.params.id, req.body);
    if (!strategy) {
      return res.status(404).json({ error: "Strategy not found" });
    }
    res.json(strategy);
  });

  // Market data routes
  app.get("/api/market", async (req, res) => {
    try {
      // Try to get real-time data first
      const realTimeData = await marketDataService.refreshMarketData();
      
      // Update storage with real-time data
      for (const quote of realTimeData) {
        await storage.updateMarketData(quote.symbol, {
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          volume: quote.volume,
          updatedAt: quote.timestamp
        });
      }
      
      const marketData = await storage.getAllMarketData();
      res.json(marketData);
    } catch (error) {
      console.error("Failed to fetch real-time market data:", error);
      // Fallback to stored data
      const marketData = await storage.getAllMarketData();
      res.json(marketData);
    }
  });

  // Real-time market data endpoints (specific routes first)
  app.get("/api/market/quote/:symbol", async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const quote = await marketDataService.getQuote(symbol);
      
      // Update storage with real-time data
      await storage.updateMarketData(symbol, {
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        updatedAt: quote.timestamp
      });
      
      res.json(quote);
    } catch (error) {
      console.error(`Failed to fetch quote for ${req.params.symbol}:`, error);
      
      // Fallback to stored data
      const stored = await storage.getMarketData(req.params.symbol.toUpperCase());
      if (stored) {
        res.json(stored);
      } else {
        res.status(404).json({ error: "Symbol not found" });
      }
    }
  });

  app.get("/api/market/providers", async (req, res) => {
    const providers = marketDataService.getConfiguredProviders();
    const current = marketDataService.getCurrentProvider();
    
    res.json({
      current: current.name,
      available: providers.map(p => ({
        name: p.name,
        configured: p.isConfigured()
      }))
    });
  });

  app.post("/api/market/refresh", async (req, res) => {
    try {
      const quotes = await marketDataService.refreshMarketData();
      res.json({
        success: true,
        updated: quotes.length,
        provider: marketDataService.getCurrentProvider().name,
        data: quotes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to refresh market data"
      });
    }
  });

  // Historical data endpoint
  app.get("/api/market/historical/:symbol/:period", async (req, res) => {
    try {
      const { symbol, period } = req.params;
      const historicalData = await marketDataService.getHistoricalData(symbol, period);
      res.json(historicalData);
    } catch (error) {
      console.error(`Historical data error for ${req.params.symbol}:`, error);
      res.status(500).json({ error: "Failed to fetch historical data" });
    }
  });

  // AI Investment Engine endpoints
  app.post("/api/ai/analyze-and-invest", async (req, res) => {
    try {
      const { aiInvestmentEngine } = await import("./services/ai-investment-engine.ts");
      const { portfolioTracker } = await import("./services/portfolio-tracker.ts");
      const { marketDataService } = await import("./services/market-data-service.ts");
      
      console.log('🤖 Starting AI investment analysis...');
      
      // Get AI decisions
      const decisions = await aiInvestmentEngine.analyzeMarketAndMakeDecisions();
      
      // Execute the trades (only buy/sell, not hold)
      const marketData = await marketDataService.refreshMarketData();
      for (const decision of decisions) {
        if (decision.action !== 'hold') {
          const marketStock = marketData.find(stock => stock.symbol === decision.symbol);
          if (marketStock) {
            const price = parseFloat(marketStock.price);
            portfolioTracker.executeTrade(decision.symbol, decision.action, decision.quantity, price);
          }
        }
      }
      
      // Update portfolio snapshot
      await portfolioTracker.updatePortfolioSnapshot(marketData);
      
      res.json({
        success: true,
        decisions,
        executedTrades: decisions.length
      });
    } catch (error) {
      console.error('AI investment error:', error);
      res.status(500).json({ error: "Failed to execute AI investment analysis" });
    }
  });

  app.get("/api/ai/portfolio-performance/:period?", async (req, res) => {
    try {
      const { portfolioTracker } = await import("./services/portfolio-tracker.ts");
      const period = req.params.period as '1D' | '1W' | '1M' | '3M' | '1Y' || '1D';
      const chartData = portfolioTracker.getChartData(period);
      res.json(chartData);
    } catch (error) {
      console.error('Portfolio performance error:', error);
      res.status(500).json({ error: "Failed to fetch portfolio performance" });
    }
  });

  app.get("/api/ai/portfolio-summary", async (req, res) => {
    try {
      const { portfolioTracker } = await import("./services/portfolio-tracker.ts");
      const summary = portfolioTracker.getCurrentPortfolioSummary();
      res.json(summary);
    } catch (error) {
      console.error('Portfolio summary error:', error);
      res.status(500).json({ error: "Failed to fetch portfolio summary" });
    }
  });

  app.post("/api/ai/settings", async (req, res) => {
    try {
      const { aiInvestmentEngine } = await import("./services/ai-investment-engine.ts");
      aiInvestmentEngine.updateSettings(req.body);
      res.json({ success: true, settings: aiInvestmentEngine.getSettings() });
    } catch (error) {
      console.error('AI settings error:', error);
      res.status(500).json({ error: "Failed to update AI settings" });
    }
  });

  app.get("/api/ai/settings", async (req, res) => {
    try {
      const { aiInvestmentEngine } = await import("./services/ai-investment-engine.ts");
      res.json(aiInvestmentEngine.getSettings());
    } catch (error) {
      console.error('AI settings error:', error);
      res.status(500).json({ error: "Failed to fetch AI settings" });
    }
  });

  app.get("/api/ai/allocation", async (req, res) => {
    try {
      const { aiInvestmentEngine } = await import("./services/ai-investment-engine.ts");
      const { portfolioTracker } = await import("./services/portfolio-tracker.ts");
      
      // Get current market data for analysis
      const { marketDataService } = await import("./services/market-data-service.ts");
      const marketData = await marketDataService.refreshMarketData();
      
      // Simulate getting allocation data (in a real system, this would be stored)
      const mockAllocationData = marketData.slice(0, 4).map((stock, index) => {
        const weights = [0.3, 0.25, 0.25, 0.2];
        const expectedReturns = [12.5, 8.7, 15.2, 6.8];
        const riskScores = [6.2, 4.1, 8.5, 3.2];
        const sectors = ['Technology', 'Technology', 'Technology', 'Consumer'];
        const strategies = ['Momentum Growth', 'AI Value Discovery', 'Volatility Harvesting', 'Defensive AI Shield'];
        const priorities = ['high', 'medium', 'high', 'low'];
        
        return {
          symbol: stock.symbol,
          targetWeight: weights[index],
          currentWeight: weights[index], // Simplified
          value: weights[index] * 100000, // Based on $100k portfolio
          expectedReturn: expectedReturns[index],
          riskScore: riskScores[index],
          sector: sectors[index],
          priority: priorities[index],
          strategy: strategies[index]
        };
      });
      
      res.json(mockAllocationData);
    } catch (error) {
      console.error('AI allocation error:', error);
      res.status(500).json({ error: "Failed to fetch AI allocation data" });
    }
  });

  // Paper Trading AI endpoints
  app.post("/api/paper-ai/analyze-and-invest", async (req, res) => {
    try {
      const { paperAIEngine } = await import("./services/paper-ai-engine.ts");
      
      console.log('🧪 Starting Paper AI investment analysis...');
      
      const result = await paperAIEngine.analyzeAndExecutePaperTrades();
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Paper AI investment error:', error);
      res.status(500).json({ error: "Failed to execute Paper AI investment analysis" });
    }
  });

  app.get("/api/paper-ai/status", async (req, res) => {
    try {
      const { paperAIEngine } = await import("./services/paper-ai-engine.ts");
      
      res.json({
        balance: paperAIEngine.getPaperBalance(),
        positions: Array.from(paperAIEngine.getPaperPositions().entries()).map(([symbol, pos]) => ({
          symbol,
          ...pos
        })),
        recentTrades: paperAIEngine.getPaperTrades().slice(0, 10)
      });
    } catch (error) {
      console.error('Paper AI status error:', error);
      res.status(500).json({ error: "Failed to fetch Paper AI status" });
    }
  });

  app.post("/api/paper-ai/settings", async (req, res) => {
    try {
      const { paperAIEngine } = await import("./services/paper-ai-engine.ts");
      paperAIEngine.updateSettings(req.body);
      res.json({ success: true, settings: paperAIEngine.getSettings() });
    } catch (error) {
      console.error('Paper AI settings error:', error);
      res.status(500).json({ error: "Failed to update Paper AI settings" });
    }
  });

  app.get("/api/paper-ai/settings", async (req, res) => {
    try {
      const { paperAIEngine } = await import("./services/paper-ai-engine.ts");
      res.json(paperAIEngine.getSettings());
    } catch (error) {
      console.error('Paper AI settings error:', error);
      res.status(500).json({ error: "Failed to fetch Paper AI settings" });
    }
  });

  app.get("/api/paper-ai/comparisons", async (req, res) => {
    try {
      // Mock strategy comparison data for now
      const mockStrategies = [
        {
          id: "conservative-strategy",
          name: "Conservative Growth",
          settings: {
            riskTolerance: "conservative",
            strategies: ["value", "defensive"],
            maxPositions: 4
          },
          performance: {
            totalReturn: 3200,
            totalReturnPercent: 3.2,
            maxDrawdown: -2.1,
            sharpeRatio: 1.4,
            winRate: 72.5,
            totalTrades: 18,
            avgTradeReturn: 1.8,
            volatility: 8.2
          },
          chartData: Array.from({ length: 30 }, (_, i) => ({
            time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            value: 100000 + (i * 100) + Math.random() * 500,
            strategy: "Conservative Growth"
          })),
          lastUpdated: new Date()
        },
        {
          id: "aggressive-strategy",
          name: "Aggressive Momentum",
          settings: {
            riskTolerance: "aggressive",
            strategies: ["momentum", "volatility"],
            maxPositions: 8
          },
          performance: {
            totalReturn: 8750,
            totalReturnPercent: 8.75,
            maxDrawdown: -12.3,
            sharpeRatio: 1.1,
            winRate: 58.2,
            totalTrades: 42,
            avgTradeReturn: 3.2,
            volatility: 18.7
          },
          chartData: Array.from({ length: 30 }, (_, i) => ({
            time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            value: 100000 + (i * 200) + Math.random() * 1000 - 500,
            strategy: "Aggressive Momentum"
          })),
          lastUpdated: new Date()
        },
        {
          id: "balanced-strategy",
          name: "Balanced AI Mix",
          settings: {
            riskTolerance: "moderate",
            strategies: ["momentum", "value", "sentiment"],
            maxPositions: 6
          },
          performance: {
            totalReturn: 5480,
            totalReturnPercent: 5.48,
            maxDrawdown: -6.8,
            sharpeRatio: 1.7,
            winRate: 64.1,
            totalTrades: 28,
            avgTradeReturn: 2.4,
            volatility: 12.3
          },
          chartData: Array.from({ length: 30 }, (_, i) => ({
            time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            value: 100000 + (i * 150) + Math.random() * 800 - 200,
            strategy: "Balanced AI Mix"
          })),
          lastUpdated: new Date()
        }
      ];

      res.json(mockStrategies);
    } catch (error) {
      console.error('Paper AI comparisons error:', error);
      res.status(500).json({ error: "Failed to fetch Paper AI comparisons" });
    }
  });

  // Generic market data routes (less specific routes last)
  app.get("/api/market/:symbol", async (req, res) => {
    const data = await storage.getMarketData(req.params.symbol);
    if (!data) {
      return res.status(404).json({ error: "Market data not found" });
    }
    res.json(data);
  });

  app.patch("/api/market/:symbol", async (req, res) => {
    const data = await storage.updateMarketData(req.params.symbol, req.body);
    res.json(data);
  });

  // Transaction routes
  app.get("/api/transactions/user/:userId", async (req, res) => {
    const transactions = await storage.getTransactions(req.params.userId);
    res.json(transactions);
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      
      // Update user balance for completed deposits/withdrawals
      if (transactionData.status === "COMPLETED") {
        const user = await storage.getUser(transactionData.userId);
        if (user) {
          const currentBalance = parseFloat(user.balance);
          const amount = parseFloat(transactionData.amount);
          const newBalance = transactionData.type === "DEPOSIT" 
            ? currentBalance + amount 
            : currentBalance - amount;
          await storage.updateUserBalance(transactionData.userId, newBalance.toFixed(2));
        }
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    const transaction = await storage.updateTransaction(req.params.id, req.body);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  });

  // Demo data initialization
  app.post("/api/demo/init", async (req, res) => {
    try {
      // Create demo user
      const demoUser = await storage.createUser({
        username: "demo",
        email: "demo@autotrade.com",
        password: "demo123",
        balance: "127543.89"
      });

      const portfolio = await storage.getPortfolioByUserId(demoUser.id);
      if (!portfolio) {
        return res.status(500).json({ error: "Failed to create portfolio" });
      }

      // Create AI investment strategies
      await storage.createStrategy({
        portfolioId: portfolio.id,
        name: "AI Growth Portfolio",
        description: "Diversified growth stocks with AI analysis",
        riskAllocation: "45.00",
        isActive: true,
        totalPnl: "3247.89",
      });

      await storage.createStrategy({
        portfolioId: portfolio.id,
        name: "AI Tech Focus",
        description: "Technology sector concentration",
        riskAllocation: "30.00",
        isActive: true,
        totalPnl: "1876.23",
      });

      await storage.createStrategy({
        portfolioId: portfolio.id,
        name: "AI Conservative",
        description: "Low-risk diversified holdings",
        riskAllocation: "25.00",
        isActive: true,
        totalPnl: "654.77",
      });

      // Create AI investment positions
      const aiHoldings = [
        { symbol: 'AAPL', quantity: '150.00', avgPrice: '170.23' },
        { symbol: 'NVDA', quantity: '75.00', avgPrice: '885.67' },
        { symbol: 'MSFT', quantity: '125.00', avgPrice: '408.92' },
        { symbol: 'TSLA', quantity: '50.00', avgPrice: '252.45' },
        { symbol: 'GOOGL', quantity: '80.00', avgPrice: '169.12' },
        { symbol: 'AMZN', quantity: '60.00', avgPrice: '176.33' },
      ];

      for (const holding of aiHoldings) {
        const marketData = await storage.getMarketData(holding.symbol);
        const currentPrice = parseFloat(marketData?.price || holding.avgPrice);
        const avgPrice = parseFloat(holding.avgPrice);
        const quantity = parseFloat(holding.quantity);
        const marketValue = (currentPrice * quantity).toFixed(2);
        const unrealizedPnl = ((currentPrice - avgPrice) * quantity).toFixed(2);
        const unrealizedPnlPercent = (((currentPrice - avgPrice) / avgPrice) * 100).toFixed(2);

        // Create the position
        await storage.createPosition({
          portfolioId: portfolio.id,
          symbol: holding.symbol,
          quantity: holding.quantity,
          averagePrice: holding.avgPrice,
          currentPrice: currentPrice.toFixed(2),
          marketValue,
          unrealizedPnl,
          unrealizedPnlPercent,
        });

        // Create the initial AI buy trade
        await storage.createTrade({
          portfolioId: portfolio.id,
          symbol: holding.symbol,
          side: 'BUY',
          quantity: holding.quantity,
          price: holding.avgPrice,
          amount: (avgPrice * quantity).toFixed(2),
          pnl: unrealizedPnl,
          isAutomatic: true,
          strategyName: 'AI Growth Portfolio',
        });
      }

      // Calculate and update portfolio values based on AI investments
      const positions = await storage.getPositions(portfolio.id);
      const totalInvested = positions.reduce((sum, pos) => sum + parseFloat(pos.marketValue), 0);
      const totalPnl = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealizedPnl), 0);
      const cashBalance = parseFloat(demoUser.balance) - totalInvested;
      const totalValue = totalInvested + cashBalance;
      const dailyPnlPercent = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : "0.00";

      await storage.updatePortfolio(portfolio.id, {
        totalValue: totalValue.toFixed(2),
        dailyPnl: totalPnl.toFixed(2),
        dailyPnlPercent,
      });

      res.json({ user: demoUser, portfolio });
    } catch (error) {
      res.status(500).json({ error: "Failed to initialize demo data" });
    }
  });


  // Register strategy routes
  app.use(createStrategyRoutes(storage));

  const httpServer = createServer(app);
  return httpServer;
}
