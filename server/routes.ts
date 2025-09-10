import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTradeSchema, insertTransactionSchema, updateProfileSchema, updateNotificationsSchema, changePasswordSchema } from "@shared/schema";
import { createStrategyRoutes } from "./routes/strategy-routes.js";
import { marketDataService } from "./services/market-data-service.js";
import { setupAuth, requireAuth } from "./auth";
import { aiInvestmentEngine } from "./services/ai-investment-engine.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Local authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password, // In production, hash this password
      });
      
      // Log them in by setting session
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed after signup" });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, message: "Account created successfully" });
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt:', email);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      console.log('User found:', user ? 'Yes' : 'No');
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Check password (in production, compare hashed passwords)
      if (user.password !== password) {
        console.log('Password mismatch');
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      console.log('Password correct, manually setting session...');
      console.log('Session ID before:', req.sessionID);
      console.log('Session data before:', req.session);
      
      // Manually set session instead of using req.login
      if (req.session) {
        (req.session as any).userId = user.id;
        (req.session as any).user = user;
        
        // Force session save
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: "Session save failed" });
          }
          console.log('Session saved successfully');
          console.log('Session ID after:', req.sessionID);
          console.log('Session data after:', req.session);
          
          const { password: _, ...userWithoutPassword } = user;
          res.json({ user: userWithoutPassword, message: "Login successful" });
        });
      } else {
        console.error('No session available');
        res.status(500).json({ error: "Session not available" });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  
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
      
      // Execute the trades (only buy/sell, not hold) with detailed logging
      const marketData = await marketDataService.refreshMarketData();
      let executedCount = 0;
      
      for (const decision of decisions) {
        if (decision.action !== 'hold') {
          const marketStock = marketData.find(stock => stock.symbol === decision.symbol);
          if (marketStock) {
            const price = parseFloat(marketStock.price);
            console.log(`💰 EXECUTING: ${decision.action.toUpperCase()} ${decision.quantity} ${decision.symbol} @ $${price} - Strategy: ${decision.strategy}`);
            console.log(`📝 Reasoning: ${decision.reasoning}`);
            
            portfolioTracker.executeTrade(decision.symbol, decision.action, decision.quantity, price);
            executedCount++;
          }
        }
      }
      
      console.log(`✅ Executed ${executedCount} trades using world-class trading strategies`);
      
      // Update portfolio snapshot
      await portfolioTracker.updatePortfolioSnapshot(marketData);
      
      res.json({
        success: true,
        decisions,
        executedTrades: executedCount,
        totalDecisions: decisions.length,
        strategies: decisions.map(d => `${d.symbol}: ${d.strategy}`)
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
      const { marketDataService } = await import("./services/market-data-service.ts");
      
      console.log('📊 Getting REAL AI allocation decisions (not mock data)');
      
      // Get actual AI decisions using world-class trader strategies
      const decisions = await aiInvestmentEngine.analyzeMarketAndMakeDecisions();
      const marketData = await marketDataService.refreshMarketData();
      
      // Convert AI decisions to allocation format with REAL strategy reasoning
      const realAllocationData = decisions
        .filter(decision => decision.action === 'buy') // Show buy decisions as allocations
        .map(decision => {
          const marketStock = marketData.find(stock => stock.symbol === decision.symbol);
          const currentPrice = marketStock ? parseFloat(marketStock.price) : 0;
          
          return {
            symbol: decision.symbol,
            targetWeight: decision.allocationWeight,
            currentWeight: 0, // Will be updated as trades execute
            value: decision.allocationWeight * aiInvestmentEngine.getSettings().investmentAmount,
            expectedReturn: decision.expectedReturn,
            riskScore: decision.riskScore,
            sector: aiInvestmentEngine.getSectorForSymbol(decision.symbol),
            priority: decision.priority,
            strategy: decision.strategy, // Real world-class trader strategy!
            reasoning: decision.reasoning, // Real AI reasoning!
            confidence: decision.confidence,
            quantity: decision.quantity,
            currentPrice: currentPrice,
            stopLossPrice: decision.stopLossPrice,
            takeProfitPrice: decision.takeProfitPrice
          };
        });
      
      console.log(`📈 Returning ${realAllocationData.length} REAL AI allocations with world-class strategies`);
      res.json(realAllocationData);
    } catch (error) {
      console.error('AI allocation error:', error);
      res.status(500).json({ error: "Failed to fetch AI allocation data" });
    }
  });

  app.get("/api/ai/exit-signals", async (req, res) => {
    try {
      const { marketDataService } = await import("./services/market-data-service.ts");
      const marketData = await marketDataService.refreshMarketData();
      
      // Generate mock exit signals based on current market conditions
      const exitSignals = [];
      
      for (const stock of marketData.slice(0, 3)) {
        const changePercent = parseFloat(stock.changePercent);
        const price = parseFloat(stock.price);
        
        // Create exit signals based on market conditions
        if (changePercent < -5) {
          exitSignals.push({
            symbol: stock.symbol,
            triggerType: 'stop_loss',
            urgency: changePercent < -8 ? 'high' : 'medium',
            currentPrice: price,
            targetPrice: price * 0.92, // 8% stop loss
            reason: `Stock down ${Math.abs(changePercent).toFixed(1)}%, approaching stop-loss threshold`,
            confidence: 0.85
          });
        }
        
        if (changePercent > 10) {
          exitSignals.push({
            symbol: stock.symbol,
            triggerType: 'take_profit',
            urgency: 'medium',
            currentPrice: price,
            targetPrice: price * 1.15, // 15% take profit
            reason: `Strong gains of ${changePercent.toFixed(1)}%, consider taking profits`,
            confidence: 0.75
          });
        }
        
        // Simulate trend reversal detection
        if (changePercent < -3 && Math.random() > 0.7) {
          exitSignals.push({
            symbol: stock.symbol,
            triggerType: 'trend_reversal',
            urgency: 'medium',
            currentPrice: price,
            targetPrice: price * 0.95,
            reason: 'Multiple bearish indicators detected, trend may be reversing',
            confidence: 0.65
          });
        }
      }
      
      // Add emergency signal if market is very volatile
      const avgVolatility = marketData.reduce((sum, stock) => sum + Math.abs(parseFloat(stock.changePercent)), 0) / marketData.length;
      if (avgVolatility > 6) {
        exitSignals.push({
          symbol: 'MARKET',
          triggerType: 'emergency',
          urgency: 'emergency',
          currentPrice: 0,
          targetPrice: 0,
          reason: 'High market volatility detected, consider defensive positioning',
          confidence: 0.9
        });
      }
      
      res.json(exitSignals);
    } catch (error) {
      console.error('Exit signals error:', error);
      res.status(500).json({ error: "Failed to fetch exit signals" });
    }
  });

  // Stop-Loss Management API endpoints
  app.get("/api/stop-loss/orders", async (req, res) => {
    try {
      const { stopLossManager } = await import("./services/stop-loss-manager.ts");
      
      const activeOrders = stopLossManager.getActiveOrders();
      const triggeredOrders = stopLossManager.getTriggeredOrders(20);
      
      res.json([...activeOrders, ...triggeredOrders]);
    } catch (error) {
      console.error('Stop-loss orders error:', error);
      res.status(500).json({ error: "Failed to fetch stop-loss orders" });
    }
  });

  app.get("/api/stop-loss/stats", async (req, res) => {
    try {
      const { stopLossManager } = await import("./services/stop-loss-manager.ts");
      res.json(stopLossManager.getStatistics());
    } catch (error) {
      console.error('Stop-loss stats error:', error);
      res.status(500).json({ error: "Failed to fetch stop-loss statistics" });
    }
  });

  app.get("/api/stop-loss/settings", async (req, res) => {
    try {
      const { stopLossManager } = await import("./services/stop-loss-manager.ts");
      res.json(stopLossManager.getSettings());
    } catch (error) {
      console.error('Stop-loss settings error:', error);
      res.status(500).json({ error: "Failed to fetch stop-loss settings" });
    }
  });

  app.post("/api/stop-loss/settings", async (req, res) => {
    try {
      const { stopLossManager } = await import("./services/stop-loss-manager.ts");
      stopLossManager.updateSettings(req.body);
      res.json({ success: true, settings: stopLossManager.getSettings() });
    } catch (error) {
      console.error('Stop-loss settings update error:', error);
      res.status(500).json({ error: "Failed to update stop-loss settings" });
    }
  });

  app.post("/api/stop-loss/orders/:orderId/cancel", async (req, res) => {
    try {
      const { stopLossManager } = await import("./services/stop-loss-manager.ts");
      const success = stopLossManager.cancelOrder(req.params.orderId);
      res.json({ success });
    } catch (error) {
      console.error('Cancel stop-loss order error:', error);
      res.status(500).json({ error: "Failed to cancel stop-loss order" });
    }
  });

  app.post("/api/stop-loss/create", async (req, res) => {
    try {
      const { stopLossManager } = await import("./services/stop-loss-manager.ts");
      const { symbol, quantity, originalPrice, stopLossPrice, takeProfitPrice, useTrailingStop } = req.body;
      
      const order = stopLossManager.createStopLossOrder(
        symbol,
        quantity,
        originalPrice,
        stopLossPrice,
        takeProfitPrice,
        useTrailingStop
      );
      
      res.json({ success: true, order });
    } catch (error) {
      console.error('Create stop-loss order error:', error);
      res.status(500).json({ error: "Failed to create stop-loss order" });
    }
  });

  // Advanced Risk Management API endpoints
  app.get("/api/risk/config", async (req, res) => {
    try {
      const { riskExitEngine } = await import("./services/risk-exit-engine.ts");
      res.json(riskExitEngine.getConfig());
    } catch (error) {
      console.error('Risk config error:', error);
      res.status(500).json({ error: "Failed to fetch risk configuration" });
    }
  });

  app.post("/api/risk/config", async (req, res) => {
    try {
      const { riskExitEngine } = await import("./services/risk-exit-engine.ts");
      riskExitEngine.updateConfig(req.body);
      res.json({ success: true, config: riskExitEngine.getConfig() });
    } catch (error) {
      console.error('Risk config update error:', error);
      res.status(500).json({ error: "Failed to update risk configuration" });
    }
  });

  app.get("/api/risk/analysis", async (req, res) => {
    try {
      const { marketDataService } = await import("./services/market-data-service.ts");
      const { riskExitEngine } = await import("./services/risk-exit-engine.ts");
      
      const marketData = await marketDataService.refreshMarketData();
      
      // Generate mock risk analysis for demo
      const riskAnalysis = marketData.slice(0, 3).map((stock, index) => {
        const changePercent = parseFloat(stock.changePercent);
        const momentum = Math.abs(changePercent) > 3 ? Math.random() * 0.8 : Math.random() * 0.3;
        const volExpansion = Math.abs(changePercent) > 5 ? Math.random() * 0.9 : Math.random() * 0.2;
        const rsiStress = changePercent < -5 ? Math.random() * 0.7 : Math.random() * 0.3;
        const structureBreak = changePercent < -3 ? Math.random() * 0.8 : Math.random() * 0.2;
        const drawdown = Math.random() * 0.4;
        const time = Math.random() * 0.3;
        
        const factors = { momentum, volExpansion, rsiStress, structureBreak, drawdown, time };
        const config = riskExitEngine.getConfig();
        
        const compositeScore = 
          config.wMomentum * momentum +
          config.wVolExpansion * volExpansion +
          config.wRsiStress * rsiStress +
          config.wStructureBreak * structureBreak +
          config.wDrawdown * drawdown +
          config.wTime * time;
          
        const action = compositeScore >= config.exitThreshold ? 'exit' : 'hold';
        const reason = action === 'exit' 
          ? `High composite risk score: ${(compositeScore * 100).toFixed(1)}%`
          : `Risk manageable: ${(compositeScore * 100).toFixed(1)}% risk score`;
        
        return {
          symbol: stock.symbol,
          action,
          reason,
          confidence: action === 'exit' ? compositeScore : 1 - compositeScore,
          factors,
          compositeScore: Math.max(0, Math.min(1, compositeScore))
        };
      });
      
      res.json(riskAnalysis);
    } catch (error) {
      console.error('Risk analysis error:', error);
      res.status(500).json({ error: "Failed to perform risk analysis" });
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

  // Get ranked signals for external consumption (FastAPI integration)
  app.get("/api/signals", async (req, res) => {
    try {
      const limitParam = req.query.limit as string;
      const limit = limitParam ? parseInt(limitParam) : 5;
      
      // Get AI investment decisions with full analysis
      const { aiInvestmentEngine } = await import("./services/ai-investment-engine.ts");
      const decisions = await aiInvestmentEngine.analyzeMarketAndMakeDecisions();
      
      // Filter for buy decisions and sort by confidence/priority
      const buyDecisions = decisions
        .filter(d => d.action === 'buy')
        .sort((a, b) => {
          // Sort by confidence first, then by expected return
          if (b.confidence !== a.confidence) {
            return b.confidence - a.confidence;
          }
          return b.expectedReturn - a.expectedReturn;
        })
        .slice(0, limit);

      // Extract symbols for external API
      const rankedSymbols = buyDecisions.map(d => d.symbol);
      
      // Return in the format expected by the external FastAPI system
      res.json({
        ranked: rankedSymbols,
        meta: {
          total_analyzed: decisions.length,
          buy_signals: buyDecisions.length,
          timestamp: new Date().toISOString(),
          analysis_details: buyDecisions.map(d => ({
            symbol: d.symbol,
            confidence: d.confidence,
            expected_return: d.expectedReturn,
            risk_score: d.riskScore,
            strategy: d.strategy,
            reasoning: d.reasoning
          }))
        }
      });
    } catch (error) {
      console.error('Error getting ranked signals:', error);
      res.status(500).json({ 
        error: "Failed to get ranked signals",
        ranked: [] // Return empty array as fallback for external systems
      });
    }
  });

  // Register strategy routes
  app.use(createStrategyRoutes(storage));

  const httpServer = createServer(app);
  return httpServer;
}
