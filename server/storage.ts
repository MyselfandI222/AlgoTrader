import { 
  type User, 
  type InsertUser,
  type Portfolio,
  type InsertPortfolio,
  type Position,
  type InsertPosition,
  type Trade,
  type InsertTrade,
  type Strategy,
  type InsertStrategy,
  type MarketData,
  type InsertMarketData,
  type Transaction,
  type InsertTransaction
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProvider(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOAuthUser(userData: { email: string; name?: string; avatar?: string; provider: string; providerId: string }): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  updateUserBalance(userId: string, balance: string): Promise<User | undefined>;
  changePassword(userId: string, newPassword: string): Promise<boolean>;
  deleteUser(userId: string): Promise<boolean>;

  // Portfolios
  getPortfolio(id: string): Promise<Portfolio | undefined>;
  getPortfolioByUserId(userId: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: string, portfolio: Partial<Portfolio>): Promise<Portfolio | undefined>;

  // Positions
  getPositions(portfolioId: string): Promise<Position[]>;
  getPosition(id: string): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: string, position: Partial<Position>): Promise<Position | undefined>;
  deletePosition(id: string): Promise<boolean>;

  // Trades
  getTrades(portfolioId: string): Promise<Trade[]>;
  getRecentTrades(portfolioId: string, limit?: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;

  // Strategies
  getStrategies(portfolioId: string): Promise<Strategy[]>;
  getStrategy(id: string): Promise<Strategy | undefined>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: string, strategy: Partial<Strategy>): Promise<Strategy | undefined>;

  // Market Data
  getMarketData(symbol: string): Promise<MarketData | undefined>;
  getAllMarketData(): Promise<MarketData[]>;
  updateMarketData(symbol: string, data: Partial<MarketData>): Promise<MarketData>;

  // Transactions
  getTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private portfolios: Map<string, Portfolio> = new Map();
  private positions: Map<string, Position> = new Map();
  private trades: Map<string, Trade> = new Map();
  private strategies: Map<string, Strategy> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private transactions: Map<string, Transaction> = new Map();

  constructor() {
    this.initializeData().catch(console.error);
  }

  private async initializeData() {
    // Create demo user
    await this.createUser({
      username: "demo_trader",
      email: "demo@tradeai.com",
      password: "demo123"
    });
    
    // Initialize market data for popular stocks
    const stocks = [
      { symbol: 'AAPL', price: '173.42', change: '2.34', changePercent: '1.37' },
      { symbol: 'TSLA', price: '248.91', change: '-5.67', changePercent: '-2.23' },
      { symbol: 'NVDA', price: '891.33', change: '12.45', changePercent: '1.42' },
      { symbol: 'MSFT', price: '412.15', change: '8.23', changePercent: '2.04' },
      { symbol: 'AMZN', price: '178.94', change: '3.21', changePercent: '1.82' },
      { symbol: 'GOOGL', price: '167.89', change: '-2.11', changePercent: '-1.24' },
    ];

    stocks.forEach(stock => {
      this.marketData.set(stock.symbol, {
        id: randomUUID(),
        symbol: stock.symbol,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        volume: Math.floor(Math.random() * 10000000),
        updatedAt: new Date(),
      });
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByProvider(provider: string, providerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.provider === provider && user.providerId === providerId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      username: insertUser.username || null,
      password: insertUser.password || null,
      provider: insertUser.provider || null,
      providerId: insertUser.providerId || null,
      balance: insertUser.balance || "100000.00",
      name: insertUser.name || null,
      bio: insertUser.bio || null,
      avatar: insertUser.avatar || null,
      emailNotifications: insertUser.emailNotifications !== undefined ? insertUser.emailNotifications : true,
      pushNotifications: insertUser.pushNotifications !== undefined ? insertUser.pushNotifications : true,
      twoFactorEnabled: insertUser.twoFactorEnabled !== undefined ? insertUser.twoFactorEnabled : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);

    // Create initial portfolio for user
    await this.createPortfolio({
      userId: id,
      totalValue: user.balance,
      dailyPnl: "0.00",
      dailyPnlPercent: "0.00",
    });

    return user;
  }

  async createOAuthUser(userData: { email: string; name?: string; avatar?: string; provider: string; providerId: string }): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: null,
      email: userData.email,
      password: null,
      provider: userData.provider,
      providerId: userData.providerId,
      name: userData.name || null,
      bio: null,
      avatar: userData.avatar || null,
      emailNotifications: true,
      pushNotifications: true,
      twoFactorEnabled: false,
      balance: "100000.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);

    // Create initial portfolio for user
    await this.createPortfolio({
      userId: id,
      totalValue: user.balance,
      dailyPnl: "0.00",
      dailyPnlPercent: "0.00",
    });

    return user;
  }

  async updateUser(id: string, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserBalance(userId: string, balance: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser = { ...user, balance };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const updatedUser = { ...user, password: newPassword };
    this.users.set(userId, updatedUser);
    return true;
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Also delete related data
    const portfolio = await this.getPortfolioByUserId(userId);
    if (portfolio) {
      // Delete positions
      const positions = await this.getPositions(portfolio.id);
      positions.forEach(pos => this.positions.delete(pos.id));
      
      // Delete trades
      const trades = await this.getTrades(portfolio.id);
      trades.forEach(trade => this.trades.delete(trade.id));
      
      // Delete strategies
      const strategies = await this.getStrategies(portfolio.id);
      strategies.forEach(strategy => this.strategies.delete(strategy.id));
      
      // Delete portfolio
      this.portfolios.delete(portfolio.id);
    }
    
    // Delete transactions
    const transactions = await this.getTransactions(userId);
    transactions.forEach(transaction => this.transactions.delete(transaction.id));
    
    // Delete user
    return this.users.delete(userId);
  }

  // Portfolios
  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }

  async getPortfolioByUserId(userId: string): Promise<Portfolio | undefined> {
    return Array.from(this.portfolios.values()).find(portfolio => portfolio.userId === userId);
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const id = randomUUID();
    const portfolio: Portfolio = {
      ...insertPortfolio,
      id,
      totalValue: insertPortfolio.totalValue || "0.00",
      dailyPnl: insertPortfolio.dailyPnl || "0.00",
      dailyPnlPercent: insertPortfolio.dailyPnlPercent || "0.00",
      updatedAt: new Date(),
    };
    this.portfolios.set(id, portfolio);
    return portfolio;
  }

  async updatePortfolio(id: string, portfolioUpdate: Partial<Portfolio>): Promise<Portfolio | undefined> {
    const portfolio = this.portfolios.get(id);
    if (!portfolio) return undefined;

    const updated = { ...portfolio, ...portfolioUpdate, updatedAt: new Date() };
    this.portfolios.set(id, updated);
    return updated;
  }

  // Positions
  async getPositions(portfolioId: string): Promise<Position[]> {
    return Array.from(this.positions.values()).filter(position => position.portfolioId === portfolioId);
  }

  async getPosition(id: string): Promise<Position | undefined> {
    return this.positions.get(id);
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const id = randomUUID();
    const position: Position = {
      ...insertPosition,
      id,
      unrealizedPnl: insertPosition.unrealizedPnl || "0.00",
      unrealizedPnlPercent: insertPosition.unrealizedPnlPercent || "0.00",
      updatedAt: new Date(),
    };
    this.positions.set(id, position);
    return position;
  }

  async updatePosition(id: string, positionUpdate: Partial<Position>): Promise<Position | undefined> {
    const position = this.positions.get(id);
    if (!position) return undefined;

    const updated = { ...position, ...positionUpdate, updatedAt: new Date() };
    this.positions.set(id, updated);
    return updated;
  }

  async deletePosition(id: string): Promise<boolean> {
    return this.positions.delete(id);
  }

  // Trades
  async getTrades(portfolioId: string): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.portfolioId === portfolioId)
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
  }

  async getRecentTrades(portfolioId: string, limit = 10): Promise<Trade[]> {
    const trades = await this.getTrades(portfolioId);
    return trades.slice(0, limit);
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = randomUUID();
    const trade: Trade = {
      ...insertTrade,
      id,
      pnl: insertTrade.pnl || "0.00",
      isAutomatic: insertTrade.isAutomatic || false,
      strategyName: insertTrade.strategyName || null,
      executedAt: new Date(),
    };
    this.trades.set(id, trade);
    return trade;
  }

  // Strategies
  async getStrategies(portfolioId: string): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(strategy => strategy.portfolioId === portfolioId);
  }

  async getStrategy(id: string): Promise<Strategy | undefined> {
    return this.strategies.get(id);
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    const id = randomUUID();
    const strategy: Strategy = {
      ...insertStrategy,
      id,
      description: insertStrategy.description || null,
      isActive: insertStrategy.isActive || true,
      totalPnl: insertStrategy.totalPnl || "0.00",
      configuration: insertStrategy.configuration || null,
      createdAt: new Date(),
    };
    this.strategies.set(id, strategy);
    return strategy;
  }

  async updateStrategy(id: string, strategyUpdate: Partial<Strategy>): Promise<Strategy | undefined> {
    const strategy = this.strategies.get(id);
    if (!strategy) return undefined;

    const updated = { ...strategy, ...strategyUpdate };
    this.strategies.set(id, updated);
    return updated;
  }

  // Market Data
  async getMarketData(symbol: string): Promise<MarketData | undefined> {
    return this.marketData.get(symbol);
  }

  async getAllMarketData(): Promise<MarketData[]> {
    return Array.from(this.marketData.values());
  }

  async updateMarketData(symbol: string, dataUpdate: Partial<MarketData>): Promise<MarketData> {
    const existing = this.marketData.get(symbol);
    const updated: MarketData = {
      id: existing?.id || randomUUID(),
      symbol,
      price: existing?.price || "0.00",
      change: existing?.change || "0.00",
      changePercent: existing?.changePercent || "0.00",
      volume: existing?.volume || 0,
      updatedAt: new Date(),
      ...dataUpdate,
    };
    this.marketData.set(symbol, updated);
    return updated;
  }

  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      method: insertTransaction.method || null,
      status: insertTransaction.status || "PENDING",
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, transactionUpdate: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updated = { ...transaction, ...transactionUpdate };
    this.transactions.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
