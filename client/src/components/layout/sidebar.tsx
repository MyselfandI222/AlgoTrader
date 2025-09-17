import { Link, useLocation } from "wouter";
import { 
  TrendingUp, 
  Briefcase, 
  ArrowRightLeft, 
  Bot, 
  BarChart3, 
  History, 
  Settings,
  Activity,
  Target,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Activity },
  { name: "Data Explorer", href: "/data-explorer", icon: Database, highlight: true },
  { name: "My Investments", href: "/portfolio", icon: Briefcase },
  { name: "AI Holdings", href: "/trading", icon: ArrowRightLeft },
  { name: "Performance", href: "/analytics", icon: BarChart3 },
  { name: "Investment History", href: "/history", icon: History },
  { name: "Paper Trading", href: "/paper-trading", icon: Target },
  { name: "Account", href: "/account", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 trading-sidebar border-r flex-shrink-0" data-testid="sidebar">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">TradeData AI</h1>
            <p className="text-gray-400 text-sm">Advanced Data Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 pb-6" data-testid="nav-menu">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            const isHighlight = item.highlight;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors",
                    isHighlight && !isActive && "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 trading-hover"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-8 p-4 trading-accent rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">AI Status</span>
            <div className="flex items-center">
              <div className="w-2 h-2 success-bg rounded-full mr-2"></div>
              <span className="text-sm success-text">Active</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">AI actively managing your investments</p>
        </div>
      </nav>
    </aside>
  );
}
