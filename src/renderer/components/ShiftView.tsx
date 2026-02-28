import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Shift } from '../types';

export default function ShiftView() {
  const { state, dispatch } = useApp();
  const { currentStaff, currentShift } = state;
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [openingCash, setOpeningCash] = useState(0);
  const [closingCash, setClosingCash] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const result = await window.electronAPI.getShifts(20) as Promise<{ success: boolean; data?: Shift[] }>;
      if (result.success && result.data) {
        setShifts(result.data);
      }
    } catch (error) {
      console.error('Error loading shifts:', error);
    }
  };

  const handleStartShift = async () => {
    if (!currentStaff) return;
    setLoading(true);

    try {
      const result = await window.electronAPI.startShift({
        staff_id: currentStaff.id,
        opening_cash: openingCash
      });

      if (result.success && result.data) {
        dispatch({ type: 'SET_CURRENT_SHIFT', payload: result.data });
        setOpeningCash(0);
        alert('上班打卡成功！');
      } else {
        alert('打卡失败: ' + result.error);
      }
    } catch (error) {
      console.error('Error starting shift:', error);
      alert('打卡失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!currentShift) return;
    setLoading(true);

    try {
      const result = await window.electronAPI.endShift(
        currentShift.id,
        closingCash,
        notes
      );

      if (result.success) {
        dispatch({ type: 'SET_CURRENT_SHIFT', payload: null });
        setShowEndShiftModal(false);
        setClosingCash(0);
        setNotes('');
        loadShifts();
        alert('交班成功！请重新登录。');
        // Force logout after shift ends
        dispatch({ type: 'SET_LOGGED_IN', payload: false });
        dispatch({ type: 'SET_CURRENT_STAFF', payload: null });
      } else {
        alert('交班失败: ' + result.error);
      }
    } catch (error) {
      console.error('Error ending shift:', error);
      alert('交班失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (datetime: string) => {
    const d = new Date(datetime);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => `¥${(amount || 0).toFixed(2)}`;

  return (
    <div className="shift-view">
      <div className="shift-header">
        <h2>换班管理</h2>
        {currentStaff && (
          <div className="current-staff">
            当前员工: {currentStaff.name} ({currentStaff.role === 'admin' ? '管理员' : '员工'})
          </div>
        )}
      </div>

      <div className="shift-status">
        {currentShift ? (
          <div className="shift-active">
            <div className="shift-info">
              <div className="shift-type">{currentShift.shift_type}</div>
              <div className="shift-time">
                开始时间: {formatDateTime(currentShift.start_time)}
              </div>
              <div className="shift-cash">
                备用金: {formatCurrency(currentShift.opening_cash)}
              </div>
              <div className="shift-stats">
                <span>订单数: {currentShift.total_orders}</span>
                <span>销售额: {formatCurrency(currentShift.total_sales)}</span>
              </div>
            </div>
            <button
              className="end-shift-btn"
              onClick={() => setShowEndShiftModal(true)}
            >
              交班下班
            </button>
          </div>
        ) : (
          <div className="shift-inactive">
            <p>您当前没有上班打卡</p>
            <div className="start-shift-form">
              <label>
                备用金:
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </label>
              <button
                className="start-shift-btn"
                onClick={handleStartShift}
                disabled={loading}
              >
                {loading ? '处理中...' : '上班打卡'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showEndShiftModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>交班确认</h3>
            <div className="modal-content">
              <div className="shift-summary">
                <div className="summary-item">
                  <span className="label">班次:</span>
                  <span className="value">{currentShift?.shift_type}</span>
                </div>
                <div className="summary-item">
                  <span className="label">上班时间:</span>
                  <span className="value">{currentShift && formatDateTime(currentShift.start_time)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">备用金:</span>
                  <span className="value">{formatCurrency(currentShift?.opening_cash || 0)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">销售金额:</span>
                  <span className="value highlight">{formatCurrency(currentShift?.total_sales || 0)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">订单数:</span>
                  <span className="value">{currentShift?.total_orders || 0}</span>
                </div>
              </div>
              <div className="form-group">
                <label>交接金额:</label>
                <input
                  type="number"
                  value={closingCash}
                  onChange={(e) => setClosingCash(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>备注:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="可选备注"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowEndShiftModal(false)}
                disabled={loading}
              >
                取消
              </button>
              <button
                className="confirm-btn"
                onClick={handleEndShift}
                disabled={loading}
              >
                {loading ? '处理中...' : '确认交班'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="shift-history">
        <h3>上班记录</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>班次</th>
              <th>员工</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>备用金</th>
              <th>交接金额</th>
              <th>销售额</th>
              <th>订单数</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length > 0 ? (
              shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>{shift.shift_date}</td>
                  <td>{shift.shift_type}</td>
                  <td>{shift.staff_name}</td>
                  <td>{formatDateTime(shift.start_time)}</td>
                  <td>{shift.end_time ? formatDateTime(shift.end_time) : '-'}</td>
                  <td>{formatCurrency(shift.opening_cash)}</td>
                  <td>{shift.closing_cash ? formatCurrency(shift.closing_cash) : '-'}</td>
                  <td>{formatCurrency(shift.total_sales)}</td>
                  <td>{shift.total_orders}</td>
                  <td>
                    <span className={`status ${shift.status}`}>
                      {shift.status === 'active' ? '上班中' : '已下班'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="no-data">暂无记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
