import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTradeSchema, insertTransactionSchema, updateProfileSchema, updateNotificationsSchema, changePasswordSchema } from "@shared/schema";
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
    const marketData = await storage.getAllMarketData();
    res.json(marketData);
  });

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

  const httpServer = createServer(app);
  return httpServer;
}
