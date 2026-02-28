import React from 'react';
import { useApp } from '../store/AppContext';
import OrderView from './OrderView';
import HistoryView from './HistoryView';
import SettingsView from './SettingsView';
import ProductManagementView from './ProductManagementView';
import LoginView from './LoginView';
import ReportsView from './ReportsView';
import ShiftView from './ShiftView';

export default function Layout() {
  const { state, dispatch } = useApp();

  if (state.isLoading) {
    return <div className="loading">加载中...</div>;
  }

  // Show login view if not logged in
  if (!state.isLoggedIn) {
    return <LoginView />;
  }

  const handleLogout = () => {
    if (state.currentShift) {
      alert('请先完成交班再退出');
      return;
    }
    dispatch({ type: 'SET_LOGGED_IN', payload: false });
    dispatch({ type: 'SET_CURRENT_STAFF', payload: null });
    dispatch({ type: 'SET_CURRENT_SHIFT', payload: null });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>{state.settings.shop_name || '咖啡店'} - 点单系统</h1>
        <div className="header-actions">
          <button
            className={`header-btn ${state.activeView === 'order' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'order' })}
          >
            点单
          </button>
          <button
            className={`header-btn ${state.activeView === 'history' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'history' })}
          >
            历史订单
          </button>
          <button
            className={`header-btn ${state.activeView === 'reports' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'reports' })}
          >
            报表
          </button>
          <button
            className={`header-btn ${state.activeView === 'shift' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'shift' })}
          >
            换班
          </button>
          {state.currentStaff?.role === 'admin' && (
            <button
              className={`header-btn ${state.activeView === 'products' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'products' })}
            >
              产品管理
            </button>
          )}
          <button
            className={`header-btn ${state.activeView === 'settings' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'settings' })}
          >
            设置
          </button>
        </div>
        <div className="header-user">
          <span className="user-info">
            {state.currentStaff?.name} ({state.currentStaff?.role === 'admin' ? '管理员' : '员工'})
            {state.currentShift && <span className="shift-badge">{state.currentShift.shift_type}</span>}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </header>
      <main className="app-body">
        {state.activeView === 'order' && <OrderView />}
        {state.activeView === 'history' && <HistoryView />}
        {state.activeView === 'reports' && <ReportsView />}
        {state.activeView === 'shift' && <ShiftView />}
        {state.activeView === 'products' && <ProductManagementView />}
        {state.activeView === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}
