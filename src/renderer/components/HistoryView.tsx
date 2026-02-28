import React, { useMemo } from 'react';
import { useApp } from '../store/AppContext';

// Helper function to get local date string (YYYY-MM-DD)
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function HistoryView() {
  const { state } = useApp();

  const stats = useMemo(() => {
    const orders = state.orders;
    const todayStr = getLocalDateString();
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    const todayOrders = orders.filter(o => {
      if (!o.created_at) return false;
      // Extract date part from created_at (format: YYYY-MM-DD HH:MM:SS)
      const orderDate = o.created_at.split(' ')[0];
      return orderDate === todayStr;
    });
    const monthOrders = orders.filter(o => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const todayTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const monthTotal = monthOrders.reduce((sum, o) => sum + o.total, 0);

    return {
      todayOrders: todayOrders.length,
      todayTotal,
      monthOrders: monthOrders.length,
      monthTotal,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0)
    };
  }, [state.orders]);

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>订单历史</h2>
      </div>

      <div className="stats-cards">
        <div className="stats-card">
          <div className="label">今日订单</div>
          <div className="value">{stats.todayOrders} 单</div>
        </div>
        <div className="stats-card">
          <div className="label">今日营收</div>
          <div className="value">¥{stats.todayTotal.toFixed(2)}</div>
        </div>
        <div className="stats-card">
          <div className="label">本月订单</div>
          <div className="value">{stats.monthOrders} 单</div>
        </div>
        <div className="stats-card">
          <div className="label">本月营收</div>
          <div className="value">¥{stats.monthTotal.toFixed(2)}</div>
        </div>
        <div className="stats-card">
          <div className="label">总订单</div>
          <div className="value">{stats.totalOrders} 单</div>
        </div>
        <div className="stats-card">
          <div className="label">总收入</div>
          <div className="value">¥{stats.totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>时间</th>
              <th>金额</th>
              <th>支付方式</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {state.orders.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                  暂无订单记录
                </td>
              </tr>
            ) : (
              state.orders.map(order => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '-'}</td>
                  <td>¥{order.total.toFixed(2)}</td>
                  <td>{order.payment_method || '-'}</td>
                  <td>{order.status === 'completed' ? '已完成' : order.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
