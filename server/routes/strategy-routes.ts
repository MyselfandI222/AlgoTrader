import { Router } from "express";
import { IStorage } from "../storage.js";
import { tradingEngine } from "../algorithms/trading-engine.js";

export function createStrategyRoutes(storage: IStorage): Router {
  const router = Router();

  // Get advanced strategy configuration
  router.get("/api/strategies/:id/config", async (req, res) => {
    try {
      const strategy = await storage.getStrategy(req.params.id);
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      
      // Return the configuration from the strategy's configuration field
      const config = strategy.configuration || {};
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to get strategy configuration" });
    }
  });

  // Update advanced strategy configuration
  router.put("/api/strategies/:id/config", async (req, res) => {
    try {
      const strategy = await storage.getStrategy(req.params.id);
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      const updatedStrategy = await storage.updateStrategy(req.params.id, {
        configuration: req.body
      });

      if (!updatedStrategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      res.json(updatedStrategy);
    } catch (error) {
      res.status(400).json({ error: "Failed to update strategy configuration" });
    }
  });

  // Generate trading signal for a symbol using specific strategy
  router.post("/api/strategies/:id/signal", async (req, res) => {
    try {
      const { symbol, marketData } = req.body;
      const strategy = await storage.getStrategy(req.params.id);
      
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      const signal = await tradingEngine.generateTradingSignal(
        symbol,
        strategy.name,
        marketData || []
      );

      res.json(signal);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate trading signal" });
    }
  });

  // Run backtest for a strategy
  router.post("/api/strategies/:id/backtest", async (req, res) => {
    try {
      const strategy = await storage.getStrategy(req.params.id);
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      const { historicalData, config } = req.body;
      
      // Simulate backtest execution
      const results = await tradingEngine.runBacktest(
        strategy.name,
        historicalData || [],
        config || {}
      );

      res.json({
        strategyId: req.params.id,
        strategyName: strategy.name,
        results,
        timestamp: new Date()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to run backtest" });
    }
  });

  // Get real-time algorithm status
  router.get("/api/algorithms/status", async (req, res) => {
    try {
      // Simulate algorithm status data
      const algorithms = [
        {
          id: "momentum-1",
          name: "Momentum Growth",
          status: "running",
          lastSignal: "buy",
          signalStrength: 85,
          lastExecution: new Date(Date.now() - 120000), // 2 minutes ago
          positions: 12,
          pnl: 2847.32,
          winRate: 73.5,
          sharpeRatio: 1.89,
          maxDrawdown: 6.2,
          trades: 147
        },
        {
          id: "value-1",
          name: "AI Value Discovery", 
          status: "running",
          lastSignal: "hold",
          signalStrength: 62,
          lastExecution: new Date(Date.now() - 300000), // 5 minutes ago
          positions: 8,
          pnl: 1923.45,
          winRate: 68.9,
          sharpeRatio: 2.12,
          maxDrawdown: 4.1,
          trades: 89
        },
        {
          id: "sentiment-1",
          name: "Market Sentiment AI",
          status: "paused",
          lastSignal: "sell",
          signalStrength: 78,
          lastExecution: new Date(Date.now() - 480000), // 8 minutes ago
          positions: 15,
          pnl: 3241.78,
          winRate: 71.2,
          sharpeRatio: 1.64,
          maxDrawdown: 8.7,
          trades: 203
        }
      ];

      res.json(algorithms);
    } catch (error) {
      res.status(500).json({ error: "Failed to get algorithm status" });
    }
  });

  // Control algorithm (start, pause, stop)
  router.post("/api/algorithms/:id/:action", async (req, res) => {
    try {
      const { id, action } = req.params;
      
      if (!["start", "pause", "stop"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      // Simulate algorithm control
      res.json({
        algorithmId: id,
        action,
        status: action === "start" ? "running" : action,
        timestamp: new Date()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to control algorithm" });
    }
  });

  // Run market scan
  router.post("/api/algorithms/scan", async (req, res) => {
    try {
      // Simulate market scanning
      setTimeout(() => {
        // This would normally trigger real market analysis
      }, 100);

      res.json({
        scanId: `scan-${Date.now()}`,
        status: "started",
        timestamp: new Date(),
        estimatedDuration: 30000 // 30 seconds
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start market scan" });
    }
  });

  // Get strategy performance metrics
  router.get("/api/strategies/:id/performance", async (req, res) => {
    try {
      const strategy = await storage.getStrategy(req.params.id);
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      // Get trades for this strategy
      const portfolio = await storage.getPortfolioByUserId("demo-user-123");
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      const trades = await storage.getTrades(portfolio.id);
      const strategyTrades = trades.filter(t => t.strategyName === strategy.name);

      // Calculate performance metrics
      const totalTrades = strategyTrades.length;
      const profitableTrades = strategyTrades.filter(t => parseFloat(t.pnl || "0") > 0);
      const winRate = totalTrades > 0 ? (profitableTrades.length / totalTrades) * 100 : 0;
      const totalPnl = strategyTrades.reduce((sum, t) => sum + parseFloat(t.pnl || "0"), 0);
      const avgTrade = totalTrades > 0 ? totalPnl / totalTrades : 0;

      res.json({
        strategyId: req.params.id,
        strategyName: strategy.name,
        metrics: {
          totalTrades,
          winRate: winRate.toFixed(1),
          totalPnl: totalPnl.toFixed(2),
          avgTrade: avgTrade.toFixed(2),
          sharpeRatio: (1.2 + Math.random() * 1.5).toFixed(2), // Simulated
          maxDrawdown: (Math.random() * 10 + 3).toFixed(1), // Simulated
          volatility: (Math.random() * 15 + 10).toFixed(1) // Simulated
        },
        lastUpdated: new Date()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get strategy performance" });
    }
  });

  // Execute manual trade with strategy
  router.post("/api/strategies/:id/trade", async (req, res) => {
    try {
      const { symbol, side, quantity, price } = req.body;
      const strategy = await storage.getStrategy(req.params.id);
      
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      // Get portfolio
      const portfolio = await storage.getPortfolioByUserId("demo-user-123");
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      // Create trade
      const trade = await storage.createTrade({
        portfolioId: portfolio.id,
        symbol,
        side,
        quantity: quantity.toString(),
        price: price.toString(),
        amount: (parseFloat(quantity) * parseFloat(price)).toString(),
        isAutomatic: false,
        strategyName: strategy.name
      });

      res.json(trade);
    } catch (error) {
      res.status(400).json({ error: "Failed to execute trade" });
    }
  });

  return router;
}