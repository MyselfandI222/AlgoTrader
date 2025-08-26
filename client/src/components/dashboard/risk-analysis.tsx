export function RiskAnalysis() {
  return (
    <div className="trading-card rounded-xl p-6 border" data-testid="risk-analysis">
      <h3 className="text-xl font-bold mb-6">Risk Analysis</h3>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Portfolio Risk Score</span>
            <span className="text-yellow-500 font-semibold" data-testid="risk-score">Medium</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">60% risk utilization</p>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Daily VaR (95%)</span>
            <span className="danger-text font-semibold" data-testid="daily-var">$3,247</span>
          </div>
          <p className="text-xs text-gray-400">Maximum potential daily loss</p>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Sharpe Ratio</span>
            <span className="success-text font-semibold" data-testid="sharpe-ratio">1.47</span>
          </div>
          <p className="text-xs text-gray-400">Risk-adjusted return metric</p>
        </div>
        
        <div>
          <h4 className="font-semibold mb-3">Asset Allocation</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Stocks</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-700 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-sm font-semibold w-10" data-testid="stocks-allocation">65%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Options</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-700 rounded-full h-1.5">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <span className="text-sm font-semibold w-10" data-testid="options-allocation">20%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Cash</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-700 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <span className="text-sm font-semibold w-10" data-testid="cash-allocation">15%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
