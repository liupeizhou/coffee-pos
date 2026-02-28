import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import log from 'electron-log';

let db: SqlJsDatabase | null = null;
let dbPath: string = '';

function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'coffee-pos.db');
}

function saveDatabase(): void {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

export async function initDatabase(): Promise<void> {
  dbPath = getDbPath();
  log.info('Initializing database at:', dbPath);

  // In Electron, we need to locate the WASM file
  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      // Try to find the wasm file in various locations
      const possiblePaths = [
        path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
        path.join(process.resourcesPath || '', 'node_modules', 'sql.js', 'dist', file),
        path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', file)
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          return p;
        }
      }

      // Fallback - let sql.js try to fetch it
      return file;
    }
  });

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      image TEXT,
      description TEXT,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS product_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      option_type TEXT NOT NULL,
      option_name TEXT NOT NULL,
      price_modifier REAL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS product_preparations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      preparation_name TEXT NOT NULL,
      price_modifier REAL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT,
      amount_paid REAL DEFAULT 0,
      change REAL DEFAULT 0,
      status TEXT DEFAULT 'completed',
      notes TEXT,
      staff_id INTEGER,
      shift_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      size TEXT,
      temperature TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Staff table
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Shifts table
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_date DATE NOT NULL,
      shift_type TEXT NOT NULL,
      staff_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      opening_cash REAL DEFAULT 0,
      closing_cash REAL,
      total_sales REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );

    -- Daily summary table
    CREATE TABLE IF NOT EXISTS daily_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      summary_date DATE NOT NULL UNIQUE,
      total_revenue REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      total_discount REAL DEFAULT 0,
      payment_breakdown TEXT,
      product_sales TEXT,
      hourly_breakdown TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add columns to existing orders table if they don't exist
  try {
    db.run("ALTER TABLE orders ADD COLUMN staff_id INTEGER");
  } catch (e) {
    // Column already exists
  }
  try {
    db.run("ALTER TABLE orders ADD COLUMN shift_id INTEGER");
  } catch (e) {
    // Column already exists
  }

  // Seed initial data if empty
  const categoryCount = db.exec('SELECT COUNT(*) as count FROM categories')[0]?.values[0]?.[0] as number || 0;
  if (categoryCount === 0) {
    seedData();
  }

  // Seed default admin if no staff exists
  const staffCount = db.exec('SELECT COUNT(*) as count FROM staff')[0]?.values[0]?.[0] as number || 0;
  if (staffCount === 0) {
    seedStaffData();
  }

  saveDatabase();
  log.info('Database initialized successfully');
}

function seedData(): void {
  if (!db) return;
  log.info('Seeding initial data...');

  // Insert categories
  const categories = [
    ['咖啡', 1],
    ['茶饮', 2],
    ['糕点', 3],
    ['配料', 4]
  ];
  categories.forEach(([name, order]) => {
    db!.run('INSERT INTO categories (name, sort_order) VALUES (?, ?)', [name, order]);
  });

  // Insert products
  const products = [
    // Coffee
    ['美式咖啡', 1, 25, '经典美式咖啡'],
    ['拿铁', 1, 30, '牛奶咖啡'],
    ['摩卡', 1, 32, '巧克力咖啡'],
    ['卡布奇诺', 1, 30, '绵密奶泡咖啡'],
    ['焦糖玛奇朵', 1, 35, '焦糖风味咖啡'],
    ['馥芮白', 1, 33, '星巴克经典'],
    ['冷萃咖啡', 1, 28, '冷萃冰咖啡'],

    // Tea
    ['原味奶茶', 2, 22, '经典奶茶'],
    ['柠檬茶', 2, 18, '鲜柠檬茶'],
    ['蜜桃乌龙', 2, 25, '水蜜桃乌龙茶'],
    ['芝士奶盖', 2, 28, '芝士奶盖茶'],
    ['杨枝甘露', 2, 26, '芒果西柚饮品'],

    // Pastries
    ['原味司康', 3, 15, '英式司康'],
    ['蓝莓马芬', 3, 18, '蓝莓马芬蛋糕'],
    ['芝士蛋糕', 3, 25, '纽约芝士蛋糕'],
    ['提拉米苏', 3, 28, '经典提拉米苏'],
    ['牛角面包', 3, 15, '法式牛角包'],

    // Toppings
    ['珍珠', 4, 3, '黑糖珍珠'],
    ['椰果', 4, 3, '椰果粒'],
    ['芝士奶盖', 4, 5, '芝士奶盖'],
    ['焦糖酱', 4, 3, '焦糖酱'],
    ['榛子酱', 4, 4, '榛子酱']
  ];
  products.forEach(([name, catId, price, desc]) => {
    db!.run('INSERT INTO products (name, category_id, price, description) VALUES (?, ?, ?, ?)', [name, catId, price, desc]);
  });

  // Insert product options for coffee and tea
  const coffeeTeaIds = db.exec('SELECT id FROM products WHERE category_id IN (1, 2)').map(r => r.values).flat();
  coffeeTeaIds.forEach(([productId]: any) => {
    db!.run('INSERT INTO product_options (product_id, option_type, option_name, price_modifier) VALUES (?, ?, ?, ?)', [productId, 'size', '大杯', 3]);
    db!.run('INSERT INTO product_options (product_id, option_type, option_name, price_modifier) VALUES (?, ?, ?, ?)', [productId, 'size', '中杯', 0]);
    db!.run('INSERT INTO product_options (product_id, option_type, option_name, price_modifier) VALUES (?, ?, ?, ?)', [productId, 'size', '小杯', -3]);
    db!.run('INSERT INTO product_options (product_id, option_type, option_name, price_modifier) VALUES (?, ?, ?, ?)', [productId, 'temperature', '热', 0]);
    db!.run('INSERT INTO product_options (product_id, option_type, option_name, price_modifier) VALUES (?, ?, ?, ?)', [productId, 'temperature', '冷', 0]);
  });

  // Insert default settings
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('shop_name', '咖啡店')");
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('member_discount', '10')");
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('payment_methods', '[\"现金\",\"支付宝\",\"微信\",\"银行卡\"]')");

  saveDatabase();
  log.info('Initial data seeded successfully');
}

function seedStaffData(): void {
  if (!db) return;
  log.info('Seeding default staff...');

  // Create default admin and staff
  db.run("INSERT INTO staff (employee_id, name, password, role) VALUES ('001', '管理员', 'admin123', 'admin')");
  db.run("INSERT INTO staff (employee_id, name, password, role) VALUES ('002', '张三', '123456', 'staff')");
  db.run("INSERT INTO staff (employee_id, name, password, role) VALUES ('003', '李四', '123456', 'staff')");

  saveDatabase();
  log.info('Default staff data seeded successfully');
}

export function queryAll(sql: string, params: any[] = []): any[] {
  if (!db) return [];
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}

function queryOne(sql: string, params: any[] = []): any {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function run(sql: string, params: any[] = []): void {
  if (!db) return;
  db.run(sql, params);
  saveDatabase();
}

// Products
export function getProducts(): any[] {
  return queryAll(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY c.sort_order, p.id
  `);
}

export function getCategories(): any[] {
  return queryAll('SELECT * FROM categories ORDER BY sort_order');
}

export function getProductById(id: number): any {
  return queryOne('SELECT * FROM products WHERE id = ?', [id]);
}

export function createProduct(product: any): any {
  run('INSERT INTO products (name, category_id, price, description, image) VALUES (?, ?, ?, ?, ?)',
    [product.name, product.category_id, product.price, product.description, product.image || null]);

  const result = queryOne('SELECT last_insert_rowid() as id');
  return { id: result?.id, ...product };
}

export function updateProduct(id: number, product: any): any {
  run('UPDATE products SET name = ?, category_id = ?, price = ?, description = ?, image = ?, is_available = ? WHERE id = ?',
    [product.name, product.category_id, product.price, product.description, product.image || null, product.is_available ? 1 : 0, id]);
  return { id, ...product };
}

export function deleteProduct(id: number): void {
  run('DELETE FROM products WHERE id = ?', [id]);
}

// Categories CRUD
export function createCategory(category: any): any {
  run('INSERT INTO categories (name, sort_order) VALUES (?, ?)',
    [category.name, category.sort_order || 0]);

  const result = queryOne('SELECT last_insert_rowid() as id');
  return { id: result?.id, ...category };
}

export function updateCategory(id: number, category: any): any {
  run('UPDATE categories SET name = ?, sort_order = ? WHERE id = ?',
    [category.name, category.sort_order || 0, id]);
  return { id, ...category };
}

export function deleteCategory(id: number): void {
  // Also delete all products in this category
  run('DELETE FROM products WHERE category_id = ?', [id]);
  run('DELETE FROM categories WHERE id = ?', [id]);
}

// Product Options CRUD
export function getProductOptions(productId: number): any[] {
  return queryAll('SELECT * FROM product_options WHERE product_id = ?', [productId]);
}

export function getAllProductOptions(): any[] {
  return queryAll('SELECT * FROM product_options ORDER BY product_id, option_type');
}

export function createProductOption(option: any): any {
  run('INSERT INTO product_options (product_id, option_type, option_name, price_modifier) VALUES (?, ?, ?, ?)',
    [option.product_id, option.option_type, option.option_name, option.price_modifier || 0]);

  const result = queryOne('SELECT last_insert_rowid() as id');
  return { id: result?.id, ...option };
}

export function updateProductOption(id: number, option: any): any {
  run('UPDATE product_options SET option_type = ?, option_name = ?, price_modifier = ? WHERE id = ?',
    [option.option_type, option.option_name, option.price_modifier || 0, id]);
  return { id, ...option };
}

export function deleteProductOption(id: number): void {
  run('DELETE FROM product_options WHERE id = ?', [id]);
}

export function deleteProductOptions(productId: number): void {
  run('DELETE FROM product_options WHERE product_id = ?', [productId]);
}

// Product Preparations CRUD
export function getProductPreparations(productId: number): any[] {
  return queryAll('SELECT * FROM product_preparations WHERE product_id = ?', [productId]);
}

export function createProductPreparation(preparation: any): any {
  run('INSERT INTO product_preparations (product_id, preparation_name, price_modifier) VALUES (?, ?, ?)',
    [preparation.product_id, preparation.preparation_name, preparation.price_modifier || 0]);

  const result = queryOne('SELECT last_insert_rowid() as id');
  return { id: result?.id, ...preparation };
}

export function updateProductPreparation(id: number, preparation: any): any {
  run('UPDATE product_preparations SET preparation_name = ?, price_modifier = ? WHERE id = ?',
    [preparation.preparation_name, preparation.price_modifier || 0, id]);
  return { id, ...preparation };
}

export function deleteProductPreparation(id: number): void {
  run('DELETE FROM product_preparations WHERE id = ?', [id]);
}

export function deleteProductPreparations(productId: number): void {
  run('DELETE FROM product_preparations WHERE product_id = ?', [productId]);
}

// Orders
export function getOrders(limit: number = 50): any[] {
  return queryAll('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?', [limit]);
}

export function createOrder(order: any): any {
  // Generate order number
  const orderNumber = `ORD${Date.now()}`;

  // Insert order
  run(`INSERT INTO orders (order_number, subtotal, discount, total, payment_method, amount_paid, change, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [orderNumber, order.subtotal, order.discount || 0, order.total, order.payment_method, order.amount_paid || 0, order.change || 0, 'completed', order.notes || null]);

  const result = queryOne('SELECT last_insert_rowid() as id');
  const orderId = result?.id;

  // Insert order items
  order.items.forEach((item: any) => {
    run(`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, size, temperature, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.size || null, item.temperature || null, item.notes || null]);
  });

  return { id: orderId, order_number: orderNumber };
}

export function getOrderItems(orderId: number): any[] {
  return queryAll('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
}

// Settings
export function getSettings(): any {
  const rows = queryAll('SELECT key, value FROM settings');
  const settings: any = {};
  rows.forEach(row => {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  });
  return settings;
}

export function updateSettings(settings: any): any {
  Object.entries(settings).forEach(([key, value]) => {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    run('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [key, valueStr]);
  });
  return settings;
}

// ==================== Staff Functions ====================

export function getAllStaff(): any[] {
  return queryAll('SELECT id, employee_id, name, role, is_active, created_at FROM staff ORDER BY id');
}

export function getStaffById(id: number): any {
  return queryOne('SELECT id, employee_id, name, role, is_active, created_at FROM staff WHERE id = ?', [id]);
}

export function getStaffByEmployeeId(employeeId: string): any {
  return queryOne('SELECT * FROM staff WHERE employee_id = ?', [employeeId]);
}

export function createStaff(staff: any): any {
  run('INSERT INTO staff (employee_id, name, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
    [staff.employee_id, staff.name, staff.password, staff.role || 'staff', staff.is_active !== 0 ? 1 : 0]);

  const result = queryOne('SELECT last_insert_rowid() as id');
  return { id: result?.id, ...staff };
}

export function updateStaff(id: number, staff: any): any {
  if (staff.password) {
    run('UPDATE staff SET employee_id = ?, name = ?, password = ?, role = ?, is_active = ? WHERE id = ?',
      [staff.employee_id, staff.name, staff.password, staff.role, staff.is_active ? 1 : 0, id]);
  } else {
    run('UPDATE staff SET employee_id = ?, name = ?, role = ?, is_active = ? WHERE id = ?',
      [staff.employee_id, staff.name, staff.role, staff.is_active ? 1 : 0, id]);
  }
  return { id, ...staff };
}

export function deleteStaff(id: number): void {
  run('DELETE FROM staff WHERE id = ?', [id]);
}

export function verifyStaffLogin(employeeId: string, password: string): any {
  return queryOne('SELECT id, employee_id, name, role FROM staff WHERE employee_id = ? AND password = ? AND is_active = 1',
    [employeeId, password]);
}

// ==================== Shift Functions ====================

export function getShifts(limit: number = 50): any[] {
  return queryAll(`
    SELECT s.*, st.name as staff_name, st.employee_id
    FROM shifts s
    LEFT JOIN staff st ON s.staff_id = st.id
    ORDER BY s.created_at DESC
    LIMIT ?
  `, [limit]);
}

export function getShiftById(id: number): any {
  return queryOne(`
    SELECT s.*, st.name as staff_name, st.employee_id
    FROM shifts s
    LEFT JOIN staff st ON s.staff_id = st.id
    WHERE s.id = ?
  `, [id]);
}

export function getCurrentShift(staffId: number): any {
  return queryOne(`
    SELECT s.*, st.name as staff_name, st.employee_id
    FROM shifts s
    LEFT JOIN staff st ON s.staff_id = st.id
    WHERE s.staff_id = ? AND s.status = 'active'
    ORDER BY s.start_time DESC
    LIMIT 1
  `, [staffId]);
}

export function getActiveShift(): any {
  return queryOne(`
    SELECT s.*, st.name as staff_name, st.employee_id
    FROM shifts s
    LEFT JOIN staff st ON s.staff_id = st.id
    WHERE s.status = 'active'
    ORDER BY s.start_time DESC
    LIMIT 1
  `);
}

export function startShift(shift: any): any {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // Determine shift type based on hour
  let shiftType = '晚班';
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) shiftType = '早班';
  else if (hour >= 12 && hour < 18) shiftType = '中班';

  run(`INSERT INTO shifts (shift_date, shift_type, staff_id, start_time, opening_cash, status)
      VALUES (?, ?, ?, ?, ?, 'active')`,
    [today, shiftType, shift.staff_id, now, shift.opening_cash || 0]);

  const result = queryOne('SELECT last_insert_rowid() as id');

  // Update shift total from existing orders
  updateShiftTotals(result?.id);

  return { id: result?.id, shift_date: today, shift_type: shiftType, staff_id: shift.staff_id, start_time: now, status: 'active' };
}

export function endShift(id: number, closingCash: number, notes?: string): any {
  const now = new Date().toISOString();
  run('UPDATE shifts SET end_time = ?, closing_cash = ?, status = ?, notes = ? WHERE id = ?',
    [now, closingCash, 'completed', notes || null, id]);

  return getShiftById(id);
}

export function updateShiftTotals(shiftId: number): void {
  const shift = getShiftById(shiftId);
  if (!shift) return;

  // Get orders for this shift
  const orders = queryAll(`
    SELECT COUNT(*) as order_count, COALESCE(SUM(total), 0) as total_sales
    FROM orders
    WHERE shift_id = ?
  `, [shiftId]);

  const orderCount = orders[0]?.order_count || 0;
  const totalSales = orders[0]?.total_sales || 0;

  run('UPDATE shifts SET total_orders = ?, total_sales = ? WHERE id = ?',
    [orderCount, totalSales, shiftId]);
}

// ==================== Report Functions ====================

export function getSalesReport(startDate: string, endDate: string): any[] {
  return queryAll(`
    SELECT
      substr(created_at, 1, 10) as date,
      COUNT(*) as order_count,
      COALESCE(SUM(subtotal), 0) as subtotal,
      COALESCE(SUM(discount), 0) as discount,
      COALESCE(SUM(total), 0) as total
    FROM orders
    WHERE substr(created_at, 1, 10) >= ? AND substr(created_at, 1, 10) <= ?
    GROUP BY substr(created_at, 1, 10)
    ORDER BY date DESC
  `, [startDate, endDate]);
}

export function getProductSales(startDate: string, endDate: string): any[] {
  return queryAll(`
    SELECT
      oi.product_name,
      COUNT(*) as order_count,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.quantity * oi.unit_price) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE substr(o.created_at, 1, 10) >= ? AND substr(o.created_at, 1, 10) <= ?
    GROUP BY oi.product_name
    ORDER BY total_quantity DESC
  `, [startDate, endDate]);
}

export function getDailyStats(date: string): any {
  const orders = queryAll(`
    SELECT
      COUNT(*) as order_count,
      COALESCE(SUM(subtotal), 0) as subtotal,
      COALESCE(SUM(discount), 0) as discount,
      COALESCE(SUM(total), 0) as total
    FROM orders
    WHERE substr(created_at, 1, 10) = ?
  `, [date]);

  // Get hourly breakdown
  const hourly = queryAll(`
    SELECT
      substr(created_at, 12, 2) as hour,
      COUNT(*) as order_count,
      COALESCE(SUM(total), 0) as total
    FROM orders
    WHERE substr(created_at, 1, 10) = ?
    GROUP BY hour
    ORDER BY hour
  `, [date]);

  // Get payment breakdown
  const payment = queryAll(`
    SELECT
      payment_method,
      COUNT(*) as order_count,
      COALESCE(SUM(total), 0) as total
    FROM orders
    WHERE substr(created_at, 1, 10) = ? AND payment_method IS NOT NULL
    GROUP BY payment_method
  `, [date]);

  return {
    date,
    order_count: orders[0]?.order_count || 0,
    subtotal: orders[0]?.subtotal || 0,
    discount: orders[0]?.discount || 0,
    total: orders[0]?.total || 0,
    hourly_breakdown: hourly,
    payment_breakdown: payment
  };
}

export function getComparisonData(date: string): any {
  // Yesterday comparison
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Same day last month
  const lastMonth = new Date(date);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().split('T')[0];

  const todayStats = getDailyStats(date);
  const yesterdayStats = getDailyStats(yesterdayStr);
  const lastMonthStats = getDailyStats(lastMonthStr);

  // Calculate changes
  const todayTotal = todayStats.total;
  const yesterdayTotal = yesterdayStats.total;
  const lastMonthTotal = lastMonthStats.total;

  const momChange = lastMonthTotal > 0 ? ((todayTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : '0';
  const yoyChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(1) : '0';

  return {
    today: todayStats,
    yesterday: yesterdayStats,
    last_month: lastMonthStats,
    changes: {
      yoy: parseFloat(yoyChange),
      mom: parseFloat(momChange)
    }
  };
}

export function updateDailySummary(date: string): any {
  const stats = getDailyStats(date);
  const products = getProductSales(date, date);

  run(`INSERT OR REPLACE INTO daily_summary
      (summary_date, total_revenue, total_orders, total_discount, payment_breakdown, product_sales, hourly_breakdown)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      date,
      stats.total,
      stats.order_count,
      stats.discount,
      JSON.stringify(stats.payment_breakdown),
      JSON.stringify(products),
      JSON.stringify(stats.hourly_breakdown)
    ]);

  return queryOne('SELECT * FROM daily_summary WHERE summary_date = ?', [date]);
}

// ==================== Order with Staff ====================

export function createOrderWithStaff(order: any): any {
  // Generate order number
  const orderNumber = `ORD${Date.now()}`;

  // Insert order with staff_id and shift_id
  run(`INSERT INTO orders (order_number, subtotal, discount, total, payment_method, amount_paid, change, status, notes, staff_id, shift_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [orderNumber, order.subtotal, order.discount || 0, order.total, order.payment_method, order.amount_paid || 0, order.change || 0, 'completed', order.notes || null, order.staff_id || null, order.shift_id || null]);

  // Get the last inserted row id using MAX
  const maxIdResult = queryOne('SELECT MAX(id) as id FROM orders');
  const orderId = maxIdResult?.id;

  // Insert order items
  order.items.forEach((item: any) => {
    run(`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, size, temperature, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.size || null, item.temperature || null, item.notes || null]);
  });

  // Update shift totals if shift_id is provided
  if (order.shift_id) {
    updateShiftTotals(order.shift_id);
  }

  return { id: orderId, order_number: orderNumber };
}

// ==================== Clear All Data ====================

export function clearAllData(): void {
  if (!db) return;

  // Clear all data from tables (keep staff for login)
  run('DELETE FROM order_items');
  run('DELETE FROM orders');
  run('DELETE FROM shifts');
  run('DELETE FROM daily_summary');

  log.info('All data cleared successfully');
}
