import React from 'react';
import { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

const productIcons: Record<string, string> = {
  '咖啡': '☕',
  '茶饮': '🍵',
  '糕点': '🧁',
  '配料': '🧋'
};

function getProductIcon(categoryName: string | undefined): string {
  if (!categoryName) return '☕';
  return productIcons[categoryName] || '☕';
}

export default function ProductGrid({ products, onProductClick }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🛒</div>
        <p>该分类暂无产品</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map(product => (
        <div
          key={product.id}
          className={`product-card ${!product.is_available ? 'unavailable' : ''}`}
          onClick={() => onProductClick(product)}
        >
          {product.image ? (
            <div className="product-image">
              <img src={product.image} alt={product.name} />
            </div>
          ) : (
            <div className="product-icon">
              {getProductIcon(product.category_name)}
            </div>
          )}
          <div className="product-name">{product.name}</div>
          <div className="product-price">¥{product.price}</div>
        </div>
      ))}
    </div>
  );
}
