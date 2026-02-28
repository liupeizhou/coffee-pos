import React, { useState } from 'react';
import { Product, CartItem } from '../types';

interface ProductModalProps {
  product: Product;
  onAdd: (item: CartItem) => void;
  onClose: () => void;
}

export default function ProductModal({ product, onAdd, onClose }: ProductModalProps) {
  const [size, setSize] = useState<string>('中杯');
  const [temperature, setTemperature] = useState<string>('热');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Only coffee and tea have size and temperature options
  const hasOptions = product.category_name === '咖啡' || product.category_name === '茶饮';

  const handleAdd = () => {
    const item: CartItem = {
      id: `${product.id}-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: product.price,
      size: hasOptions ? size : undefined,
      temperature: hasOptions ? temperature : undefined,
      notes: notes || undefined
    };
    onAdd(item);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="checkout-section">
          <div className="checkout-row">
            <span>单价</span>
            <span>¥{product.price}</span>
          </div>
          {product.description && (
            <div className="checkout-row" style={{ color: '#666', fontSize: '12px' }}>
              <span>描述</span>
              <span>{product.description}</span>
            </div>
          )}
        </div>

        {hasOptions && (
          <>
            <div className="option-section">
              <h4>规格 (杯型)</h4>
              <div className="option-buttons">
                {['小杯', '中杯', '大杯'].map(s => (
                  <button
                    key={s}
                    className={`option-btn ${size === s ? 'selected' : ''}`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="option-section">
              <h4>温度</h4>
              <div className="option-buttons">
                {['热', '冷'].map(t => (
                  <button
                    key={t}
                    className={`option-btn ${temperature === t ? 'selected' : ''}`}
                    onClick={() => setTemperature(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="option-section">
          <h4>数量</h4>
          <div className="option-buttons">
            <button
              className="option-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </button>
            <span style={{ padding: '8px 16px', fontSize: '16px' }}>{quantity}</span>
            <button
              className="option-btn"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="option-section">
          <h4>备注</h4>
          <div className="input-group">
            <input
              type="text"
              placeholder="可选备注（如：少糖、去冰等）"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="checkout-total">
          <div className="label">小计</div>
          <div className="amount">¥{(product.price * quantity).toFixed(2)}</div>
        </div>

        <div className="order-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            加入订单
          </button>
        </div>
      </div>
    </div>
  );
}
