import React, { useState, useEffect } from 'react';
import { SalesReport, ProductSales, ComparisonData } from '../types';

// Helper function to get local date string (YYYY-MM-DD)
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ReportsView() {
  const [activeTab, setActiveTab] = useState<'daily' | 'products' | 'comparison'>('daily');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalDateString(d);
  });
  const [endDate, setEndDate] = useState(() => getLocalDateString());
  const [salesData, setSalesData] = useState<SalesReport[]>([]);
  const [productData, setProductData] = useState<ProductSales[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const today = getLocalDateString();

  useEffect(() => {
    if (activeTab === 'daily' || activeTab === 'products') {
      loadReportData();
    } else if (activeTab === 'comparison') {
      loadComparisonData();
    }
  }, [activeTab, startDate, endDate]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [salesRes, productRes] = await Promise.all([
        window.electronAPI.getSalesReport(startDate, endDate) as Promise<{ success: boolean; data?: SalesReport[] }>,
        window.electronAPI.getProductSales(startDate, endDate) as Promise<{ success: boolean; data?: ProductSales[] }>
      ]);

      if (salesRes.success && salesRes.data) {
        setSalesData(salesRes.data);
      }
      if (productRes.success && productRes.data) {
        setProductData(productRes.data);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getComparison(today) as Promise<{ success: boolean; data?: ComparisonData }>;
      if (result.success && result.data) {
        setComparisonData(result.data);
      }
    } catch (error) {
      console.error('Error loading comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportDaily = async () => {
    setExportLoading(true);
    try {
      const result = await window.electronAPI.exportDailyExcel(today);
      if (result.success) {
        alert(`报表已导出: ${result.data}`);
      } else {
        alert('导出失败: ' + result.error);
      }
    } catch (error) {
      console.error('Error exporting daily excel:', error);
      alert('导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportMonthly = async () => {
    setExportLoading(true);
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const result = await window.electronAPI.exportMonthlyExcel(year, month);
      if (result.success) {
        alert(`报表已导出: ${result.data}`);
      } else {
        alert('导出失败: ' + result.error);
      }
    } catch (error) {
      console.error('Error exporting monthly excel:', error);
      alert('导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `¥${amount.toFixed(2)}`;
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  const getTotalSales = () => salesData.reduce((sum, d) => sum + d.total, 0);
  const getTotalOrders = () => salesData.reduce((sum, d) => sum + d.order_count, 0);

  return (
    <div className="reports-view">
      <div className="reports-header">
        <h2>销售报表</h2>
        <div className="export-buttons">
          <button
            className="export-btn"
            onClick={handleExportDaily}
            disabled={exportLoading}
          >
            {exportLoading ? '导出中...' : '导出今日Excel'}
          </button>
          <button
            className="export-btn"
            onClick={handleExportMonthly}
            disabled={exportLoading}
          >
            {exportLoading ? '导出中...' : '导出本月Excel'}
          </button>
        </div>
      </div>

      <div className="reports-tabs">
        <button
          className={`tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          销售汇总
        </button>
        <button
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          产品销量
        </button>
        <button
          className={`tab ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          同比环比
        </button>
      </div>

      <div className="reports-filters">
        <label>
          开始日期:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          结束日期:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          {activeTab === 'daily' && (
            <div className="report-content">
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-label">总销售额</div>
                  <div className="card-value">{formatCurrency(getTotalSales())}</div>
                </div>
                <div className="summary-card">
                  <div className="card-label">总订单数</div>
                  <div className="card-value">{getTotalOrders()}</div>
                </div>
                <div className="summary-card">
                  <div className="card-label">平均客单价</div>
                  <div className="card-value">
                    {getTotalOrders() > 0 ? formatCurrency(getTotalSales() / getTotalOrders()) : '¥0.00'}
                  </div>
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>订单数</th>
                    <th>小计</th>
                    <th>优惠</th>
                    <th>总计</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.length > 0 ? (
                    salesData.map((item) => (
                      <tr key={item.date}>
                        <td>{item.date}</td>
                        <td>{item.order_count}</td>
                        <td>{formatCurrency(item.subtotal)}</td>
                        <td>{formatCurrency(item.discount)}</td>
                        <td className="total">{formatCurrency(item.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="no-data">暂无数据</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="report-content">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>产品名称</th>
                    <th>销售数量</th>
                    <th>销售额</th>
                  </tr>
                </thead>
                <tbody>
                  {productData.length > 0 ? (
                    productData.map((item, index) => (
                      <tr key={item.product_name}>
                        <td>{index + 1}</td>
                        <td>{item.product_name}</td>
                        <td>{item.total_quantity}</td>
                        <td className="total">{formatCurrency(item.total_revenue)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="no-data">暂无数据</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'comparison' && comparisonData && (
            <div className="report-content">
              <div className="comparison-cards">
                <div className="comparison-card today">
                  <div className="card-header">今日 ({today})</div>
                  <div className="card-value">{formatCurrency(comparisonData.today.total)}</div>
                  <div className="card-orders">{comparisonData.today.order_count} 单</div>
                </div>
                <div className="comparison-card">
                  <div className="card-header">昨日</div>
                  <div className="card-value">{formatCurrency(comparisonData.yesterday.total)}</div>
                  <div className="card-orders">{comparisonData.yesterday.order_count} 单</div>
                  <div className={`change ${comparisonData.changes.yoy >= 0 ? 'positive' : 'negative'}`}>
                    同比: {formatPercent(comparisonData.changes.yoy)}
                  </div>
                </div>
                <div className="comparison-card">
                  <div className="card-header">上月同日</div>
                  <div className="card-value">{formatCurrency(comparisonData.last_month.total)}</div>
                  <div className="card-orders">{comparisonData.last_month.order_count} 单</div>
                  <div className={`change ${comparisonData.changes.mom >= 0 ? 'positive' : 'negative'}`}>
                    环比: {formatPercent(comparisonData.changes.mom)}
                  </div>
                </div>
              </div>

              <h3>今日支付方式分布</h3>
              <div className="payment-breakdown">
                {comparisonData.today.payment_breakdown.length > 0 ? (
                  comparisonData.today.payment_breakdown.map((p) => (
                    <div key={p.payment_method} className="payment-item">
                      <span className="payment-method">{p.payment_method || '未知'}</span>
                      <span className="payment-count">{p.order_count} 单</span>
                      <span className="payment-amount">{formatCurrency(p.total)}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-data">暂无数据</div>
                )}
              </div>

              <h3>今日小时分布</h3>
              <div className="hourly-breakdown">
                {comparisonData.today.hourly_breakdown.length > 0 ? (
                  <div className="hourly-chart">
                    {comparisonData.today.hourly_breakdown.map((h) => (
                      <div key={h.hour} className="hourly-item">
                        <div className="hour-label">{h.hour}:00</div>
                        <div className="hour-bar" style={{ width: `${Math.min(100, (h.total / (comparisonData.today.total || 1)) * 100)}%` }}></div>
                        <div className="hour-value">{formatCurrency(h.total)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">暂无数据</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
