export interface Category {
  id: number;
  name: string;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  price: number;
  image?: string;
  description?: string;
  is_available: number;
}

export interface ProductOption {
  id: number;
  product_id: number;
  option_type: 'size' | 'temperature' | 'preparation';
  option_name: string;
  price_modifier: number;
}

export interface ProductPreparation {
  id: number;
  product_id: number;
  preparation_name: string;
  price_modifier: number;
}

export interface CartItem {
  id: string;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  size?: string;
  temperature?: string;
  notes?: string;
}

export interface Order {
  id: number;
  order_number: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method?: string;
  amount_paid: number;
  change: number;
  status: string;
  notes?: string;
  staff_id?: number;
  shift_id?: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  size?: string;
  temperature?: string;
  notes?: string;
}

export interface Settings {
  shop_name: string;
  member_discount: string;
  payment_methods: string[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Staff types
export interface Staff {
  id: number;
  employee_id: string;
  name: string;
  password?: string;
  role: 'admin' | 'staff';
  is_active: number;
  created_at?: string;
}

// Shift types
export interface Shift {
  id: number;
  shift_date: string;
  shift_type: '早班' | '中班' | '晚班';
  staff_id: number;
  staff_name?: string;
  employee_id?: string;
  start_time: string;
  end_time?: string;
  opening_cash: number;
  closing_cash?: number;
  total_sales: number;
  total_orders: number;
  status: 'active' | 'completed';
  notes?: string;
  created_at?: string;
}

// Report types
export interface SalesReport {
  date: string;
  order_count: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface ProductSales {
  product_name: string;
  order_count: number;
  total_quantity: number;
  total_revenue: number;
}

export interface DailyStats {
  date: string;
  order_count: number;
  subtotal: number;
  discount: number;
  total: number;
  hourly_breakdown: { hour: string; order_count: number; total: number }[];
  payment_breakdown: { payment_method: string; order_count: number; total: number }[];
}

export interface ComparisonData {
  today: DailyStats;
  yesterday: DailyStats;
  last_month: DailyStats;
  changes: {
    yoy: number;
    mom: number;
  };
}
