import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Products
  getProducts: () => ipcRenderer.invoke('get-products'),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  getProduct: (id: number) => ipcRenderer.invoke('get-product', id),
  createProduct: (product: any) => ipcRenderer.invoke('create-product', product),
  updateProduct: (id: number, product: any) => ipcRenderer.invoke('update-product', id, product),
  deleteProduct: (id: number) => ipcRenderer.invoke('delete-product', id),

  // Categories CRUD
  createCategory: (category: any) => ipcRenderer.invoke('create-category', category),
  updateCategory: (id: number, category: any) => ipcRenderer.invoke('update-category', id, category),
  deleteCategory: (id: number) => ipcRenderer.invoke('delete-category', id),

  // Product Options
  getProductOptions: (productId?: number) => ipcRenderer.invoke('get-product-options', productId),
  createProductOption: (option: any) => ipcRenderer.invoke('create-product-option', option),
  updateProductOption: (id: number, option: any) => ipcRenderer.invoke('update-product-option', id, option),
  deleteProductOption: (id: number) => ipcRenderer.invoke('delete-product-option', id),

  // Product Preparations
  getProductPreparations: (productId: number) => ipcRenderer.invoke('get-product-preparations', productId),
  createProductPreparation: (preparation: any) => ipcRenderer.invoke('create-product-preparation', preparation),
  updateProductPreparation: (id: number, preparation: any) => ipcRenderer.invoke('update-product-preparation', id, preparation),
  deleteProductPreparation: (id: number) => ipcRenderer.invoke('delete-product-preparation', id),

  // Orders
  getOrders: (limit?: number) => ipcRenderer.invoke('get-orders', limit),
  createOrder: (order: any) => ipcRenderer.invoke('create-order', order),
  createOrderWithStaff: (order: any) => ipcRenderer.invoke('create-order-with-staff', order),
  getOrderItems: (orderId: number) => ipcRenderer.invoke('get-order-items', orderId),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),

  // Staff Management
  getStaff: () => ipcRenderer.invoke('get-staff'),
  getStaffById: (id: number) => ipcRenderer.invoke('get-staff-by-id', id),
  createStaff: (staff: any) => ipcRenderer.invoke('create-staff', staff),
  updateStaff: (id: number, staff: any) => ipcRenderer.invoke('update-staff', id, staff),
  deleteStaff: (id: number) => ipcRenderer.invoke('delete-staff', id),
  staffLogin: (employeeId: string, password: string) => ipcRenderer.invoke('staff-login', employeeId, password),

  // Shift Management
  getShifts: (limit?: number) => ipcRenderer.invoke('get-shifts', limit),
  getCurrentShift: (staffId: number) => ipcRenderer.invoke('get-current-shift', staffId),
  getActiveShift: () => ipcRenderer.invoke('get-active-shift'),
  startShift: (shift: any) => ipcRenderer.invoke('start-shift', shift),
  endShift: (id: number, closingCash: number, notes?: string) => ipcRenderer.invoke('end-shift', id, closingCash, notes),

  // Reports
  getSalesReport: (startDate: string, endDate: string) => ipcRenderer.invoke('get-sales-report', startDate, endDate),
  getProductSales: (startDate: string, endDate: string) => ipcRenderer.invoke('get-product-sales', startDate, endDate),
  getDailyStats: (date: string) => ipcRenderer.invoke('get-daily-stats', date),
  getComparison: (date: string) => ipcRenderer.invoke('get-comparison', date),
  exportDailyExcel: (date: string) => ipcRenderer.invoke('export-daily-excel', date),
  exportMonthlyExcel: (year: number, month: number) => ipcRenderer.invoke('export-monthly-excel', year, month),

  // Admin
  clearAllData: () => ipcRenderer.invoke('clear-all-data')
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
