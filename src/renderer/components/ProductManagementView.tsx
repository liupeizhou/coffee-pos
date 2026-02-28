import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Category, Product, ProductOption, ProductPreparation } from '../types';

type TabType = 'categories' | 'products' | 'preparations';

export default function ProductManagementView() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [productPreparations, setProductPreparations] = useState<ProductPreparation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Category form state
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Product form state
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productCategoryId, setProductCategoryId] = useState<number>(0);
  const [productImage, setProductImage] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Option form state
  const [optionType, setOptionType] = useState<'size' | 'temperature'>('size');
  const [optionName, setOptionName] = useState('');
  const [optionPriceModifier, setOptionPriceModifier] = useState('0');
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null);

  // Preparation form state
  const [preparationName, setPreparationName] = useState('');
  const [preparationPriceModifier, setPreparationPriceModifier] = useState('0');
  const [editingPreparation, setEditingPreparation] = useState<ProductPreparation | null>(null);

  // Set default category when categories load
  useEffect(() => {
    if (state.categories.length > 0 && productCategoryId === 0) {
      setProductCategoryId(state.categories[0].id);
    }
  }, [state.categories]);

  useEffect(() => {
    if (selectedProduct) {
      loadProductOptions(selectedProduct.id);
      loadProductPreparations(selectedProduct.id);
    }
  }, [selectedProduct]);

  const loadProductOptions = async (productId: number) => {
    const res = await window.electronAPI.getProductOptions(productId) as any;
    if (res.success) {
      setProductOptions(res.data || []);
    }
  };

  const loadProductPreparations = async (productId: number) => {
    const res = await window.electronAPI.getProductPreparations(productId) as any;
    if (res.success) {
      setProductPreparations(res.data || []);
    }
  };

  const refreshData = async () => {
    const [productsRes, categoriesRes, optionsRes] = await Promise.all([
      window.electronAPI.getProducts() as any,
      window.electronAPI.getCategories() as any,
      window.electronAPI.getProductOptions() as any
    ]);

    if (productsRes.success) {
      dispatch({ type: 'SET_PRODUCTS', payload: productsRes.data });
    }
    if (categoriesRes.success) {
      dispatch({ type: 'SET_CATEGORIES', payload: categoriesRes.data });
    }
    if (optionsRes.success) {
      dispatch({ type: 'SET_PRODUCT_OPTIONS', payload: optionsRes.data });
    }
  };

  // Category handlers
  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    setIsLoading(true);
    try {
      const res = await window.electronAPI.createCategory({ name: categoryName, sort_order: state.categories.length + 1 });
      if (res.success) {
        await refreshData();
        setCategoryName('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryName.trim()) return;
    setIsLoading(true);
    try {
      const res = await window.electronAPI.updateCategory(editingCategory.id, { name: categoryName, sort_order: editingCategory.sort_order });
      if (res.success) {
        await refreshData();
        setEditingCategory(null);
        setCategoryName('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('删除分类将同时删除该分类下的所有产品，确定要删除吗？')) return;
    setIsLoading(true);
    try {
      const res = await window.electronAPI.deleteCategory(id);
      if (res.success) {
        await refreshData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Product handlers
  const handleCreateProduct = async () => {
    if (!productName.trim() || !productCategoryId) return;
    setIsLoading(true);
    try {
      const res = await window.electronAPI.createProduct({
        name: productName,
        category_id: productCategoryId,
        price: parseFloat(productPrice) || 0,
        description: productDescription,
        image: productImage || null
      });
      if (res.success) {
        await refreshData();
        resetProductForm();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !productName.trim()) return;
    setIsLoading(true);
    try {
      const res = await window.electronAPI.updateProduct(editingProduct.id, {
        name: productName,
        category_id: productCategoryId,
        price: parseFloat(productPrice) || 0,
        description: productDescription,
        image: productImage || null,
        is_available: editingProduct.is_available
      });
      if (res.success) {
        await refreshData();
        setEditingProduct(null);
        resetProductForm();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('确定要删除该产品吗？')) return;
    setIsLoading(true);
    try {
      const res = await window.electronAPI.deleteProduct(id);
      if (res.success) {
        await refreshData();
        if (selectedProduct?.id === id) {
          setSelectedProduct(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetProductForm = () => {
    setProductName('');
    setProductPrice('');
    setProductDescription('');
    setProductCategoryId(state.categories[0]?.id || 0);
    setProductImage('');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductDescription(product.description || '');
    setProductCategoryId(product.category_id);
    setProductImage(product.image || '');
  };

  // Option handlers
  const handleCreateOption = async () => {
    if (!selectedProduct || !optionName.trim()) return;
    setIsLoading(true);
    try {
      const res = await window.electronAPI.createProductOption({
        product_id: selectedProduct.id,
        option_type: optionType,
        option_name: optionName,
        price_modifier: parseFloat(optionPriceModifier) || 0
      });
      if (res.success) {
        await loadProductOptions(selectedProduct.id);
        const optionsRes = await window.electronAPI.getProductOptions() as any;
        if (optionsRes.success) {
          dispatch({ type: 'SET_PRODUCT_OPTIONS', payload: optionsRes.data });
        }
        resetOptionForm();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOption = async () => {
    if (!editingOption || !optionName.trim()) return;
    setIsLoading(true);
    try {
      const res = await window.electronAPI.updateProductOption(editingOption.id, {
        option_type: optionType,
        option_name: optionName,
        price_modifier: parseFloat(optionPriceModifier) || 0
      });
      if (res.success) {
        await loadProductOptions(selectedProduct!.id);
        const optionsRes = await window.electronAPI.getProductOptions() as any;
        if (optionsRes.success) {
          dispatch({ type: 'SET_PRODUCT_OPTIONS', payload: optionsRes.data });
        }
        setEditingOption(null);
        resetOptionForm();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOption = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await window.electronAPI.deleteProductOption(id);
      if (res.success) {
        await loadProductOptions(selectedProduct!.id);
        const optionsRes = await window.electronAPI.getProductOptions() as any;
        if (optionsRes.success) {
          dispatch({ type: 'SET_PRODUCT_OPTIONS', payload: optionsRes.data });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetOptionForm = () => {
    setOptionType('size');
    setOptionName('');
    setOptionPriceModifier('0');
  };

  // Preparation handlers
  const handleCreatePreparation = async () => {
    if (!selectedProduct || !preparationName.trim()) return;
    setIsLoading(true);
    try {
      const res = await window.electronAPI.createProductPreparation({
        product_id: selectedProduct.id,
        preparation_name: preparationName,
        price_modifier: parseFloat(preparationPriceModifier) || 0
      });
      if (res.success) {
        await loadProductPreparations(selectedProduct.id);
        resetPreparationForm();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreparation = async () => {
    if (!editingPreparation || !preparationName.trim()) return;
    setIsLoading(true);
    try {
      const res = await window.electronAPI.updateProductPreparation(editingPreparation.id, {
        preparation_name: preparationName,
        price_modifier: parseFloat(preparationPriceModifier) || 0
      });
      if (res.success) {
        await loadProductPreparations(selectedProduct!.id);
        setEditingPreparation(null);
        resetPreparationForm();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePreparation = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await window.electronAPI.deleteProductPreparation(id);
      if (res.success) {
        await loadProductPreparations(selectedProduct!.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetPreparationForm = () => {
    setPreparationName('');
    setPreparationPriceModifier('0');
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="product-management">
      <div className="pm-header">
        <h2>产品管理</h2>
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'settings' })}>
          返回设置
        </button>
      </div>

      <div className="pm-tabs">
        <button className={`pm-tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          分类管理
        </button>
        <button className={`pm-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          产品管理
        </button>
        <button className={`pm-tab ${activeTab === 'preparations' ? 'active' : ''}`} onClick={() => setActiveTab('preparations')} disabled={!selectedProduct}>
          做法配置
        </button>
      </div>

      <div className="pm-content">
        {activeTab === 'categories' && (
          <div className="pm-section">
            <div className="pm-form">
              <h3>{editingCategory ? '编辑分类' : '新增分类'}</h3>
              <div className="form-row">
                <label>分类名称</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  placeholder="请输入分类名称"
                />
              </div>
              <div className="form-actions">
                {editingCategory ? (
                  <>
                    <button className="btn btn-secondary" onClick={() => { setEditingCategory(null); setCategoryName(''); }}>取消</button>
                    <button className="btn btn-primary" onClick={handleUpdateCategory} disabled={isLoading}>保存</button>
                  </>
                ) : (
                  <button className="btn btn-primary" onClick={handleCreateCategory} disabled={isLoading}>新增</button>
                )}
              </div>
            </div>

            <div className="pm-list">
              <h3>分类列表</h3>
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>名称</th>
                    <th>排序</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {state.categories.map(cat => (
                    <tr key={cat.id}>
                      <td>{cat.id}</td>
                      <td>{cat.name}</td>
                      <td>{cat.sort_order}</td>
                      <td>
                        <button className="btn-link" onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); }}>编辑</button>
                        <button className="btn-link btn-danger" onClick={() => handleDeleteCategory(cat.id)}>删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="pm-section pm-products">
            <div className="pm-form">
              <h3>{editingProduct ? '编辑产品' : '新增产品'}</h3>
              <div className="form-row">
                <label>产品名称</label>
                <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="请输入产品名称" />
              </div>
              <div className="form-row">
                <label>分类</label>
                <select value={productCategoryId} onChange={e => setProductCategoryId(Number(e.target.value))}>
                  {state.categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>价格</label>
                <input type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="0" step="0.01" />
              </div>
              <div className="form-row">
                <label>描述</label>
                <input type="text" value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder="产品描述" />
              </div>
              <div className="form-row">
                <label>图片</label>
                <div className="image-upload">
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                  {productImage && <img src={productImage} alt="Preview" className="image-preview" />}
                </div>
              </div>
              <div className="form-actions">
                {editingProduct ? (
                  <>
                    <button className="btn btn-secondary" onClick={() => { setEditingProduct(null); resetProductForm(); }}>取消</button>
                    <button className="btn btn-primary" onClick={handleUpdateProduct} disabled={isLoading}>保存</button>
                  </>
                ) : (
                  <button className="btn btn-primary" onClick={handleCreateProduct} disabled={isLoading}>新增</button>
                )}
              </div>
            </div>

            <div className="pm-list">
              <h3>产品列表</h3>
              <div className="products-grid">
                {state.products.map(product => (
                  <div key={product.id} className={`product-item ${selectedProduct?.id === product.id ? 'selected' : ''}`} onClick={() => setSelectedProduct(product)}>
                    {product.image ? (
                      <div className="product-thumb"><img src={product.image} alt={product.name} /></div>
                    ) : (
                      <div className="product-thumb-placeholder">☕</div>
                    )}
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-meta">
                        <span className="category-tag">{product.category_name}</span>
                        <span className="price">¥{product.price}</span>
                      </div>
                    </div>
                    <div className="product-actions" onClick={e => e.stopPropagation()}>
                      <button className="btn-icon" onClick={() => handleEditProduct(product)}>编辑</button>
                      <button className="btn-icon btn-danger" onClick={() => handleDeleteProduct(product.id)}>删除</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preparations' && selectedProduct && (
          <div className="pm-section">
            <div className="pm-product-header">
              <h3>产品: {selectedProduct.name}</h3>
            </div>

            <div className="pm-tabs-inner">
              <div className="pm-form-half">
                <h4>规格选项</h4>
                <div className="form-row">
                  <select value={optionType} onChange={e => setOptionType(e.target.value as 'size' | 'temperature')}>
                    <option value="size">杯型</option>
                    <option value="temperature">温度</option>
                  </select>
                  <input type="text" value={optionName} onChange={e => setOptionName(e.target.value)} placeholder="选项名称" />
                  <input type="number" value={optionPriceModifier} onChange={e => setOptionPriceModifier(e.target.value)} placeholder="价格调整" step="0.01" style={{ width: '80px' }} />
                  {editingOption ? (
                    <>
                      <button className="btn btn-secondary" onClick={() => { setEditingOption(null); resetOptionForm(); }}>取消</button>
                      <button className="btn btn-primary" onClick={handleUpdateOption} disabled={isLoading}>保存</button>
                    </>
                  ) : (
                    <button className="btn btn-primary" onClick={handleCreateOption} disabled={isLoading}>添加</button>
                  )}
                </div>
                <div className="pm-list-mini">
                  {productOptions.map(opt => (
                    <div key={opt.id} className="list-item">
                      <span>{opt.option_type === 'size' ? '杯型' : '温度'}: {opt.option_name} {opt.price_modifier !== 0 && `(${opt.price_modifier > 0 ? '+' : ''}¥${opt.price_modifier})`}</span>
                      <div>
                        <button className="btn-link" onClick={() => { setEditingOption(opt); setOptionType(opt.option_type); setOptionName(opt.option_name); setOptionPriceModifier(opt.price_modifier.toString()); }}>编辑</button>
                        <button className="btn-link btn-danger" onClick={() => handleDeleteOption(opt.id)}>删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pm-form-half">
                <h4>做法选项</h4>
                <div className="form-row">
                  <input type="text" value={preparationName} onChange={e => setPreparationName(e.target.value)} placeholder="做法名称 (如: 浓郁, 轻盈)" style={{ flex: 1 }} />
                  <input type="number" value={preparationPriceModifier} onChange={e => setPreparationPriceModifier(e.target.value)} placeholder="价格调整" step="0.01" style={{ width: '80px' }} />
                  {editingPreparation ? (
                    <>
                      <button className="btn btn-secondary" onClick={() => { setEditingPreparation(null); resetPreparationForm(); }}>取消</button>
                      <button className="btn btn-primary" onClick={handleUpdatePreparation} disabled={isLoading}>保存</button>
                    </>
                  ) : (
                    <button className="btn btn-primary" onClick={handleCreatePreparation} disabled={isLoading}>添加</button>
                  )}
                </div>
                <div className="pm-list-mini">
                  {productPreparations.map(prep => (
                    <div key={prep.id} className="list-item">
                      <span>{prep.preparation_name} {prep.price_modifier !== 0 && `(${prep.price_modifier > 0 ? '+' : ''}¥${prep.price_modifier})`}</span>
                      <div>
                        <button className="btn-link" onClick={() => { setEditingPreparation(prep); setPreparationName(prep.preparation_name); setPreparationPriceModifier(prep.price_modifier.toString()); }}>编辑</button>
                        <button className="btn-link btn-danger" onClick={() => handleDeletePreparation(prep.id)}>删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
