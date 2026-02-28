import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Settings } from '../types';

export default function SettingsView() {
  const { state, dispatch } = useApp();
  const { currentStaff } = state;
  const [settings, setSettings] = useState<Settings>(state.settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    setSettings(state.settings);
  }, [state.settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await window.electronAPI.updateSettings(settings);
      if (result.success) {
        dispatch({ type: 'SET_SETTINGS', payload: settings });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert('保存失败: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = async () => {
    if (!currentStaff || currentStaff.role !== 'admin') {
      alert('只有管理员才能清除数据');
      return;
    }

    const confirm = window.confirm('确定要清除所有数据吗？\n此操作将删除所有订单、班次记录，但保留员工账号。\n此操作不可撤销！');

    if (!confirm) return;

    const doubleConfirm = window.confirm('再次确认：删除所有订单和班次数据？');

    if (!doubleConfirm) return;

    setIsClearing(true);
    try {
      const result = await window.electronAPI.clearAllData();
      if (result.success) {
        alert('数据已清除');

        // Refresh orders
        const ordersRes = await window.electronAPI.getOrders(50);
        if (ordersRes.success && ordersRes.data) {
          dispatch({ type: 'SET_ORDERS', payload: ordersRes.data });
        }
      } else {
        alert('清除失败: ' + result.error);
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('清除失败');
    } finally {
      setIsClearing(false);
    }
  };

  const handlePaymentMethodsChange = (methods: string[]) => {
    setSettings({ ...settings, payment_methods: methods });
  };

  const togglePaymentMethod = (method: string) => {
    const current = settings.payment_methods || [];
    if (current.includes(method)) {
      handlePaymentMethodsChange(current.filter(m => m !== method));
    } else {
      handlePaymentMethodsChange([...current, method]);
    }
  };

  const allPaymentMethods = ['现金', '支付宝', '微信', '银行卡', '会员卡', '其他'];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>系统设置</h2>
      </div>

      <div className="settings-section">
        <h3>产品管理</h3>
        <p style={{ color: '#666', marginBottom: '12px' }}>管理分类、产品、图片和做法选项</p>
        <button
          className="btn btn-primary"
          onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'products' })}
        >
          打开产品管理
        </button>
      </div>

      <div className="settings-section">
        <h3>基本设置</h3>
        <div className="form-row">
          <label>店铺名称</label>
          <input
            type="text"
            value={settings.shop_name || ''}
            onChange={e => setSettings({ ...settings, shop_name: e.target.value })}
          />
        </div>
        <div className="form-row">
          <label>会员折扣 (%)</label>
          <input
            type="number"
            value={settings.member_discount || '0'}
            onChange={e => setSettings({ ...settings, member_discount: e.target.value })}
            min="0"
            max="100"
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>支付方式</h3>
        <div className="payment-methods" style={{ padding: '0' }}>
          {allPaymentMethods.map(method => (
            <button
              key={method}
              className={`payment-method ${(settings.payment_methods || []).includes(method) ? 'selected' : ''}`}
              onClick={() => togglePaymentMethod(method)}
              style={{ marginBottom: '8px' }}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>关于</h3>
        <div className="form-row">
          <label>版本</label>
          <span>1.0.0</span>
        </div>
        <div className="form-row">
          <label>系统</label>
          <span>咖啡店点单和结算系统</span>
        </div>
      </div>

      {currentStaff?.role === 'admin' && (
        <div className="settings-section" style={{ border: '1px solid #ff4d4f' }}>
          <h3 style={{ color: '#ff4d4f' }}>数据管理 (仅管理员)</h3>
          <p style={{ color: '#666', marginBottom: '12px' }}>清除所有订单、班次记录，但保留员工账号</p>
          <button
            className="btn btn-danger"
            onClick={handleClearData}
            disabled={isClearing}
          >
            {isClearing ? '清除中...' : '清除所有数据'}
          </button>
        </div>
      )}

      <div className="order-actions" style={{ padding: 0, border: 'none' }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving}
          style={{ maxWidth: '200px' }}
        >
          {isSaving ? '保存中...' : saved ? '已保存' : '保存设置'}
        </button>
      </div>
    </div>
  );
}
