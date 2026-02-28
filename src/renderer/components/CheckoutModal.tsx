import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { CartItem } from '../types';

interface CheckoutModalProps {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  total: number;
  onComplete: () => void;
  onClose: () => void;
}

export default function CheckoutModal({
  cart,
  subtotal,
  discount,
  discountAmount,
  total,
  onComplete,
  onClose
}: CheckoutModalProps) {
  const { state, dispatch } = useApp();
  const { currentStaff, currentShift } = state;
  const [paymentMethod, setPaymentMethod] = useState(state.settings.payment_methods[0] || '现金');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const paidAmount = parseFloat(amountPaid) || 0;
  const change = paidAmount - total;

  const quickAmounts = [20, 50, 100];

  const canComplete = useMemo(() => {
    if (!amountPaid) return false;
    return paidAmount >= total;
  }, [amountPaid, total]);

  const handleComplete = async () => {
    if (!canComplete || isProcessing) return;

    setIsProcessing(true);
    try {
      const order = {
        subtotal,
        discount: discountAmount,
        total,
        payment_method: paymentMethod,
        amount_paid: paidAmount,
        change: Math.max(0, change),
        notes: notes || null,
        staff_id: currentStaff?.id,
        shift_id: currentShift?.id,
        items: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          size: item.size,
          temperature: item.temperature,
          notes: item.notes
        }))
      };

      const result = await window.electronAPI.createOrderWithStaff(order);
      if (result.success) {
        // Refresh orders
        const ordersRes = await window.electronAPI.getOrders(50);
        if (ordersRes.success && ordersRes.data) {
          dispatch({ type: 'SET_ORDERS', payload: ordersRes.data });
        }
        onComplete();
      } else {
        alert('创建订单失败: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('创建订单失败');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '450px' }}>
        <div className="modal-header">
          <h2>结算</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="checkout-section">
          <div className="checkout-row">
            <span>小计</span>
            <span>¥{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="checkout-row">
              <span>会员折扣 ({discount}%)</span>
              <span>-¥{discountAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="checkout-section">
          <h3>支付方式</h3>
          <div className="payment-methods">
            {state.settings.payment_methods.map(method => (
              <button
                key={method}
                className={`payment-method ${paymentMethod === method ? 'selected' : ''}`}
                onClick={() => setPaymentMethod(method)}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="checkout-section">
          <h3>收款</h3>
          <div className="checkout-total">
            <div className="label">应收金额</div>
            <div className="amount">¥{total.toFixed(2)}</div>
          </div>

          <div className="input-group">
            <label>实收金额</label>
            <input
              type="number"
              placeholder="输入收款金额"
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {quickAmounts.map(amt => (
              <button
                key={amt}
                className="option-btn"
                onClick={() => setAmountPaid(String(amt))}
              >
                ¥{amt}
              </button>
            ))}
            <button
              className="option-btn"
              onClick={() => setAmountPaid(String(Math.ceil(total)))}
            >
              整
            </button>
          </div>

          {amountPaid && paidAmount >= total && (
            <div className="checkout-row" style={{ marginTop: '16px', fontSize: '18px', color: '#52c41a' }}>
              <span>找零</span>
              <span>¥{change.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="checkout-section">
          <div className="input-group">
            <label>订单备注</label>
            <input
              type="text"
              placeholder="可选备注"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="order-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleComplete}
            disabled={!canComplete || isProcessing}
            style={{ opacity: canComplete ? 1 : 0.5 }}
          >
            {isProcessing ? '处理中...' : '完成订单'}
          </button>
        </div>
      </div>
    </div>
  );
}
