import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTradeSchema, insertTransactionSchema } from "@shared/schema";
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
    res.json(user);
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

      // Create demo strategies
      await storage.createStrategy({
        portfolioId: portfolio.id,
        name: "Momentum Scalper",
        description: "High-frequency strategy",
        riskAllocation: "15.00",
        isActive: true,
        totalPnl: "847.00",
      });

      await storage.createStrategy({
        portfolioId: portfolio.id,
        name: "Mean Reversion",
        description: "Conservative approach",
        riskAllocation: "35.00",
        isActive: true,
        totalPnl: "1243.00",
      });

      await storage.createStrategy({
        portfolioId: portfolio.id,
        name: "Trend Following",
        description: "Medium-term strategy",
        riskAllocation: "25.00",
        isActive: false,
        totalPnl: "567.00",
      });

      // Create demo trades
      const stocks = ['AAPL', 'TSLA', 'NVDA', 'MSFT'];
      for (let i = 0; i < 10; i++) {
        const symbol = stocks[Math.floor(Math.random() * stocks.length)];
        const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const quantity = (Math.random() * 100 + 10).toFixed(2);
        const marketData = await storage.getMarketData(symbol);
        const price = marketData?.price || "100.00";
        const amount = (parseFloat(quantity) * parseFloat(price)).toFixed(2);
        const pnl = (Math.random() * 1000 - 500).toFixed(2);

        await storage.createTrade({
          portfolioId: portfolio.id,
          symbol,
          side,
          quantity,
          price,
          amount,
          pnl,
          isAutomatic: Math.random() > 0.3,
          strategyName: Math.random() > 0.3 ? "Momentum Scalper" : undefined,
        });
      }

      // Update portfolio values
      await storage.updatePortfolio(portfolio.id, {
        totalValue: "127543.89",
        dailyPnl: "2847.65",
        dailyPnlPercent: "2.29",
      });

      res.json({ user: demoUser, portfolio });
    } catch (error) {
      res.status(500).json({ error: "Failed to initialize demo data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
