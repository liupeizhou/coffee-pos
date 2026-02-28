import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Staff } from '../types';

export default function LoginView() {
  const { dispatch } = useApp();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await window.electronAPI.staffLogin(employeeId, password);
      if (result.success && result.data) {
        const staff = result.data as Staff;
        dispatch({ type: 'SET_CURRENT_STAFF', payload: staff });
        dispatch({ type: 'SET_LOGGED_IN', payload: true });

        // Check for active shift
        const shiftResult = await window.electronAPI.getCurrentShift(staff.id);
        if (shiftResult.success && shiftResult.data) {
          dispatch({ type: 'SET_CURRENT_SHIFT', payload: shiftResult.data });
        }
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-view">
      <div className="login-container">
        <div className="login-logo">
          <span className="logo-icon">☕</span>
          <h1>咖啡店点单系统</h1>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="employeeId">工号</label>
            <input
              type="text"
              id="employeeId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="请输入工号"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
