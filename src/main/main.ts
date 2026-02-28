import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import log from 'electron-log';
import XLSX from 'xlsx';
import { initDatabase, getProducts, getCategories, getProductById, createProduct, updateProduct, deleteProduct, getOrders, createOrder, getOrderItems, updateSettings, getSettings, createCategory, updateCategory, deleteCategory, getProductOptions, getAllProductOptions, createProductOption, updateProductOption, deleteProductOption, getProductPreparations, createProductPreparation, updateProductPreparation, deleteProductPreparation, getAllStaff, getStaffById, createStaff, updateStaff, deleteStaff, verifyStaffLogin, getShifts, getCurrentShift, getActiveShift, startShift, endShift, getSalesReport, getProductSales, getDailyStats, getComparisonData, updateDailySummary, createOrderWithStaff, queryAll, clearAllData } from './database';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.info('Application starting...');

// Global exception handlers
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  app.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  log.info('Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    titleBarStyle: 'default'
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  } else {
    // Running from built files but not packaged (npm run start)
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  log.info('Main window created successfully');
}

// Initialize database and set up IPC handlers
function setupIPC() {
  log.info('Setting up IPC handlers...');

  // Products
  ipcMain.handle('get-products', async () => {
    try {
      return { success: true, data: getProducts() };
    } catch (error: any) {
      log.error('Error getting products:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-categories', async () => {
    try {
      return { success: true, data: getCategories() };
    } catch (error: any) {
      log.error('Error getting categories:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-product', async (_event, id: number) => {
    try {
      return { success: true, data: getProductById(id) };
    } catch (error: any) {
      log.error('Error getting product:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-product', async (_event, product: any) => {
    try {
      return { success: true, data: createProduct(product) };
    } catch (error: any) {
      log.error('Error creating product:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-product', async (_event, id: number, product: any) => {
    try {
      return { success: true, data: updateProduct(id, product) };
    } catch (error: any) {
      log.error('Error updating product:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-product', async (_event, id: number) => {
    try {
      deleteProduct(id);
      return { success: true };
    } catch (error: any) {
      log.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }
  });

  // Categories CRUD
  ipcMain.handle('create-category', async (_event, category: any) => {
    try {
      return { success: true, data: createCategory(category) };
    } catch (error: any) {
      log.error('Error creating category:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-category', async (_event, id: number, category: any) => {
    try {
      return { success: true, data: updateCategory(id, category) };
    } catch (error: any) {
      log.error('Error updating category:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-category', async (_event, id: number) => {
    try {
      deleteCategory(id);
      return { success: true };
    } catch (error: any) {
      log.error('Error deleting category:', error);
      return { success: false, error: error.message };
    }
  });

  // Product Options
  ipcMain.handle('get-product-options', async (_event, productId?: number) => {
    try {
      if (productId) {
        return { success: true, data: getProductOptions(productId) };
      }
      return { success: true, data: getAllProductOptions() };
    } catch (error: any) {
      log.error('Error getting product options:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-product-option', async (_event, option: any) => {
    try {
      return { success: true, data: createProductOption(option) };
    } catch (error: any) {
      log.error('Error creating product option:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-product-option', async (_event, id: number, option: any) => {
    try {
      return { success: true, data: updateProductOption(id, option) };
    } catch (error: any) {
      log.error('Error updating product option:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-product-option', async (_event, id: number) => {
    try {
      deleteProductOption(id);
      return { success: true };
    } catch (error: any) {
      log.error('Error deleting product option:', error);
      return { success: false, error: error.message };
    }
  });

  // Product Preparations
  ipcMain.handle('get-product-preparations', async (_event, productId: number) => {
    try {
      return { success: true, data: getProductPreparations(productId) };
    } catch (error: any) {
      log.error('Error getting product preparations:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-product-preparation', async (_event, preparation: any) => {
    try {
      return { success: true, data: createProductPreparation(preparation) };
    } catch (error: any) {
      log.error('Error creating product preparation:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-product-preparation', async (_event, id: number, preparation: any) => {
    try {
      return { success: true, data: updateProductPreparation(id, preparation) };
    } catch (error: any) {
      log.error('Error updating product preparation:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-product-preparation', async (_event, id: number) => {
    try {
      deleteProductPreparation(id);
      return { success: true };
    } catch (error: any) {
      log.error('Error deleting product preparation:', error);
      return { success: false, error: error.message };
    }
  });

  // Orders
  ipcMain.handle('get-orders', async (_event, limit?: number) => {
    try {
      return { success: true, data: getOrders(limit) };
    } catch (error: any) {
      log.error('Error getting orders:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-order', async (_event, order: any) => {
    try {
      return { success: true, data: createOrder(order) };
    } catch (error: any) {
      log.error('Error creating order:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-order-items', async (_event, orderId: number) => {
    try {
      return { success: true, data: getOrderItems(orderId) };
    } catch (error: any) {
      log.error('Error getting order items:', error);
      return { success: false, error: error.message };
    }
  });

  // Settings
  ipcMain.handle('get-settings', async () => {
    try {
      return { success: true, data: getSettings() };
    } catch (error: any) {
      log.error('Error getting settings:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-settings', async (_event, settings: any) => {
    try {
      return { success: true, data: updateSettings(settings) };
    } catch (error: any) {
      log.error('Error updating settings:', error);
      return { success: false, error: error.message };
    }
  });

  // Clear all data (admin only)
  ipcMain.handle('clear-all-data', async () => {
    try {
      return { success: true, data: clearAllData() };
    } catch (error: any) {
      log.error('Error clearing data:', error);
      return { success: false, error: error.message };
    }
  });

  // Staff Management
  ipcMain.handle('get-staff', async () => {
    try {
      return { success: true, data: getAllStaff() };
    } catch (error: any) {
      log.error('Error getting staff:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-staff-by-id', async (_event, id: number) => {
    try {
      return { success: true, data: getStaffById(id) };
    } catch (error: any) {
      log.error('Error getting staff:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-staff', async (_event, staff: any) => {
    try {
      return { success: true, data: createStaff(staff) };
    } catch (error: any) {
      log.error('Error creating staff:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-staff', async (_event, id: number, staff: any) => {
    try {
      return { success: true, data: updateStaff(id, staff) };
    } catch (error: any) {
      log.error('Error updating staff:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-staff', async (_event, id: number) => {
    try {
      deleteStaff(id);
      return { success: true };
    } catch (error: any) {
      log.error('Error deleting staff:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('staff-login', async (_event, employeeId: string, password: string) => {
    try {
      const staff = verifyStaffLogin(employeeId, password);
      if (staff) {
        return { success: true, data: staff };
      }
      return { success: false, error: '工号或密码错误' };
    } catch (error: any) {
      log.error('Error logging in:', error);
      return { success: false, error: error.message };
    }
  });

  // Shift Management
  ipcMain.handle('get-shifts', async (_event, limit?: number) => {
    try {
      return { success: true, data: getShifts(limit) };
    } catch (error: any) {
      log.error('Error getting shifts:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-current-shift', async (_event, staffId: number) => {
    try {
      return { success: true, data: getCurrentShift(staffId) };
    } catch (error: any) {
      log.error('Error getting current shift:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-active-shift', async () => {
    try {
      return { success: true, data: getActiveShift() };
    } catch (error: any) {
      log.error('Error getting active shift:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('start-shift', async (_event, shift: any) => {
    try {
      return { success: true, data: startShift(shift) };
    } catch (error: any) {
      log.error('Error starting shift:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('end-shift', async (_event, id: number, closingCash: number, notes?: string) => {
    try {
      return { success: true, data: endShift(id, closingCash, notes) };
    } catch (error: any) {
      log.error('Error ending shift:', error);
      return { success: false, error: error.message };
    }
  });

  // Reports
  ipcMain.handle('get-sales-report', async (_event, startDate: string, endDate: string) => {
    try {
      return { success: true, data: getSalesReport(startDate, endDate) };
    } catch (error: any) {
      log.error('Error getting sales report:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-product-sales', async (_event, startDate: string, endDate: string) => {
    try {
      return { success: true, data: getProductSales(startDate, endDate) };
    } catch (error: any) {
      log.error('Error getting product sales:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-daily-stats', async (_event, date: string) => {
    try {
      return { success: true, data: getDailyStats(date) };
    } catch (error: any) {
      log.error('Error getting daily stats:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-comparison', async (_event, date: string) => {
    try {
      return { success: true, data: getComparisonData(date) };
    } catch (error: any) {
      log.error('Error getting comparison:', error);
      return { success: false, error: error.message };
    }
  });

  // Create order with staff
  ipcMain.handle('create-order-with-staff', async (_event, order: any) => {
    try {
      return { success: true, data: createOrderWithStaff(order) };
    } catch (error: any) {
      log.error('Error creating order with staff:', error);
      return { success: false, error: error.message };
    }
  });

  // Export to Excel
  ipcMain.handle('export-daily-excel', async (_event, date: string) => {
    try {
      const stats = getDailyStats(date);

      // Filter orders by date
      const allOrders = getOrders(1000);
      const orders = allOrders.filter(o => o.created_at && o.created_at.startsWith(date));

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['日期', date],
        ['总订单数', stats.order_count],
        ['小计', stats.subtotal],
        ['优惠', stats.discount],
        ['总计', stats.total],
        [],
        ['支付方式分布']
      ];
      stats.payment_breakdown.forEach((p: any) => {
        summaryData.push([p.payment_method || '未知', `${p.order_count}单，¥${p.total}`]);
      });

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, '汇总');

      // Orders sheet
      const orderData = [['订单号', '小计', '优惠', '总计', '支付方式', '时间']];
      orders.forEach((o: any) => {
        orderData.push([
          o.order_number,
          o.subtotal,
          o.discount,
          o.total,
          o.payment_method || '',
          o.created_at || ''
        ]);
      });
      const ordersSheet = XLSX.utils.aoa_to_sheet(orderData);
      XLSX.utils.book_append_sheet(wb, ordersSheet, '订单明细');

      // Product sales sheet
      const products = getProductSales(date, date);
      const productData = [['产品名称', '销售数量', '销售额']];
      products.forEach((p: any) => {
        productData.push([p.product_name, p.total_quantity, p.total_revenue]);
      });
      const productSheet = XLSX.utils.aoa_to_sheet(productData);
      XLSX.utils.book_append_sheet(wb, productSheet, '产品销量');

      const fileName = `日报表_${date}.xlsx`;
      XLSX.writeFile(wb, fileName);

      return { success: true, data: fileName };
    } catch (error: any) {
      log.error('Error exporting daily excel:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('export-monthly-excel', async (_event, year: number, month: number) => {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const salesReport = getSalesReport(startDate, endDate);
      const productSales = getProductSales(startDate, endDate);

      const wb = XLSX.utils.book_new();

      // Daily summary sheet
      const dailyData = [['日期', '订单数', '小计', '优惠', '总计']];
      salesReport.forEach((d: any) => {
        dailyData.push([d.date, d.order_count, d.subtotal, d.discount, d.total]);
      });
      const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, dailySheet, '每日汇总');

      // Product sales sheet
      const productData = [['产品名称', '销售数量', '销售额']];
      productSales.forEach((p: any) => {
        productData.push([p.product_name, p.total_quantity, p.total_revenue]);
      });
      const productSheet = XLSX.utils.aoa_to_sheet(productData);
      XLSX.utils.book_append_sheet(wb, productSheet, '产品销量');

      const fileName = `月报表_${year}_${month}.xlsx`;
      XLSX.writeFile(wb, fileName);

      return { success: true, data: fileName };
    } catch (error: any) {
      log.error('Error exporting monthly excel:', error);
      return { success: false, error: error.message };
    }
  });

  log.info('IPC handlers set up successfully');
}

app.whenReady().then(async () => {
  log.info('App is ready');

  try {
    await initDatabase();
    log.info('Database initialized');
  } catch (error) {
    log.error('Failed to initialize database:', error);
    app.exit(1);
  }

  setupIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log.info('Application quitting...');
});
