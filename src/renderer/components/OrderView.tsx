import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import ProductGrid from './ProductGrid';
import OrderPanel from './OrderPanel';

export default function OrderView() {
  const { state, dispatch } = useApp();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleCategorySelect = (categoryId: number) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: categoryId });
  };

  const handleProductClick = (product: any) => {
    if (!product.is_available) return;
    setSelectedProduct(product);
  };

  return (
    <>
      <aside className="sidebar">
        <ul className="category-list">
          {state.categories.map(category => (
            <li
              key={category.id}
              className={`category-item ${state.selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategorySelect(category.id)}
            >
              {category.name}
            </li>
          ))}
        </ul>
      </aside>
      <div className="main-content">
        <ProductGrid
          products={state.products.filter(
            p => state.selectedCategory === null || p.category_id === state.selectedCategory
          )}
          onProductClick={handleProductClick}
        />
      </div>
      <OrderPanel
        selectedProduct={selectedProduct}
        onCloseProductModal={() => setSelectedProduct(null)}
      />
    </>
  );
}
