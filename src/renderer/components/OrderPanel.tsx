import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { CartItem, Product } from '../types';
import ProductModal from './ProductModal';
import CheckoutModal from './CheckoutModal';

interface OrderPanelProps {
  selectedProduct: Product | null;
  onCloseProductModal: () => void;
}

export default function OrderPanel({ selectedProduct, onCloseProductModal }: OrderPanelProps) {
  const { state, dispatch } = useApp();
  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = useMemo(() => {
    return state.cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [state.cart]);

  const handleAddToCart = (item: CartItem) => {
    dispatch({ type: 'ADD_TO_CART', payload: item });
    onCloseProductModal();
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: id });
    } else {
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { id, quantity: newQty } });
    }
  };

  const handleRemoveItem = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const handleClearCart = () => {
    if (state.cart.length > 0) {
      dispatch({ type: 'CLEAR_CART' });
    }
  };

  const handleCheckout = () => {
    if (state.cart.length > 0) {
      setShowCheckout(true);
    }
  };

  const handleOrderComplete = () => {
    dispatch({ type: 'CLEAR_CART' });
    setShowCheckout(false);
  };

  // Apply discount (member discount)
  const discount = parseFloat(state.settings.member_discount) || 0;
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  return (
    <>
      <div className="order-panel">
        <div className="order-header">
          <h2>当前订单</h2>
          <div className="order-count">已选: {state.cart.length} 件</div>
        </div>

        <div className="order-items">
          {state.cart.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">🛒</div>
              <p>购物车为空</p>
              <p style={{ fontSize: '12px' }}>点击产品添加到订单</p>
            </div>
          ) : (
            state.cart.map(item => (
              <div key={item.id} className="order-item">
                <div className="order-item-info">
                  <div className="order-item-name">{item.product_name}</div>
                  <div className="order-item-spec">
                    {item.size && `${item.size}/`}
                    {item.temperature}
                    {item.notes && ` - ${item.notes}`}
                  </div>
                </div>
                <div className="order-item-qty">
                  <button className="qty-btn" onClick={() => handleUpdateQuantity(item.id, -1)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button className="qty-btn" onClick={() => handleUpdateQuantity(item.id, 1)}>
                    +
                  </button>
                </div>
                <div className="order-item-price">¥{item.unit_price * item.quantity}</div>
                <button className="order-item-delete" onClick={() => handleRemoveItem(item.id)}>
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="order-summary">
          <div className="summary-row">
            <span>小计</span>
            <span>¥{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="summary-row">
              <span>会员折扣</span>
              <span>-{discount}%</span>
            </div>
          )}
          <div className="summary-row total">
            <span>总计</span>
            <span>¥{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="order-actions">
          <button className="btn btn-secondary" onClick={handleClearCart} disabled={state.cart.length === 0}>
            清空
          </button>
          <button className="btn btn-primary" onClick={handleCheckout} disabled={state.cart.length === 0}>
            结算
          </button>
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onAdd={handleAddToCart}
          onClose={onCloseProductModal}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          cart={state.cart}
          subtotal={subtotal}
          discount={discount}
          discountAmount={discountAmount}
          total={total}
          onComplete={handleOrderComplete}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  );
}
