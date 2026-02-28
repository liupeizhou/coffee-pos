import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Category, Product, CartItem, Order, Settings, ProductOption, ProductPreparation, APIResponse, Staff, Shift } from '../types';

interface AppState {
  categories: Category[];
  products: Product[];
  productOptions: ProductOption[];
  productPreparations: ProductPreparation[];
  cart: CartItem[];
  orders: Order[];
  settings: Settings;
  selectedCategory: number | null;
  isLoading: boolean;
  activeView: 'order' | 'history' | 'settings' | 'products' | 'reports' | 'shift' | 'debug';
  // Staff and shift state
  currentStaff: Staff | null;
  currentShift: Shift | null;
  isLoggedIn: boolean;
}

type AppAction =
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_PRODUCT_OPTIONS'; payload: ProductOption[] }
  | { type: 'SET_PRODUCT_PREPARATIONS'; payload: ProductPreparation[] }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'UPDATE_CART_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'SET_SELECTED_CATEGORY'; payload: number | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_VIEW'; payload: 'order' | 'history' | 'settings' | 'products' | 'reports' | 'shift' }
  | { type: 'SET_CURRENT_STAFF'; payload: Staff | null }
  | { type: 'SET_CURRENT_SHIFT'; payload: Shift | null }
  | { type: 'SET_LOGGED_IN'; payload: boolean };

const initialState: AppState = {
  categories: [],
  products: [],
  productOptions: [],
  productPreparations: [],
  cart: [],
  orders: [],
  settings: {
    shop_name: '咖啡店',
    member_discount: '10',
    payment_methods: ['现金', '支付宝', '微信', '银行卡']
  },
  selectedCategory: null,
  isLoading: true,
  activeView: 'order',
  currentStaff: null,
  currentShift: null,
  isLoggedIn: false
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_PRODUCT_OPTIONS':
      return { ...state, productOptions: action.payload };
    case 'SET_PRODUCT_PREPARATIONS':
      return { ...state, productPreparations: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload };
    case 'ADD_TO_CART':
      return { ...state, cart: [...state.cart, action.payload] };
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload)
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_CURRENT_STAFF':
      return { ...state, currentStaff: action.payload };
    case 'SET_CURRENT_SHIFT':
      return { ...state, currentShift: action.payload };
    case 'SET_LOGGED_IN':
      return { ...state, isLoggedIn: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesRes, productsRes, ordersRes, settingsRes, productOptionsRes] = await Promise.all([
          window.electronAPI.getCategories() as Promise<APIResponse<Category[]>>,
          window.electronAPI.getProducts() as Promise<APIResponse<Product[]>>,
          window.electronAPI.getOrders(50) as Promise<APIResponse<Order[]>>,
          window.electronAPI.getSettings() as Promise<APIResponse<Settings>>,
          window.electronAPI.getProductOptions() as Promise<APIResponse<ProductOption[]>>
        ]);

        if (categoriesRes.success && categoriesRes.data) {
          dispatch({ type: 'SET_CATEGORIES', payload: categoriesRes.data });
          if (categoriesRes.data.length > 0) {
            dispatch({ type: 'SET_SELECTED_CATEGORY', payload: categoriesRes.data[0].id });
          }
        }

        if (productsRes.success && productsRes.data) {
          dispatch({ type: 'SET_PRODUCTS', payload: productsRes.data });
        }

        if (ordersRes.success && ordersRes.data) {
          dispatch({ type: 'SET_ORDERS', payload: ordersRes.data });
        }

        if (settingsRes.success && settingsRes.data) {
          dispatch({ type: 'SET_SETTINGS', payload: settingsRes.data });
        }

        if (productOptionsRes.success && productOptionsRes.data) {
          dispatch({ type: 'SET_PRODUCT_OPTIONS', payload: productOptionsRes.data });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    loadData();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
