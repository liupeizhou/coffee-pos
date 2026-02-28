# 技术设计文档 (Design)

## 1. 技术栈

| 层级 | 技术选型 | 版本 |
|------|---------|------|
| 桌面框架 | Electron | 28.x |
| 前端框架 | React | 18.x |
| 语言 | TypeScript | 5.x |
| 构建工具 | Vite | 5.x |
| 数据库 | sql.js (SQLite) | 1.9.x |
| 状态管理 | React Context | - |
| Excel导出 | XLSX | 0.18.x |
| 日志 | electron-log | 5.x |

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron Main Process                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   IPC       │  │  Database  │  │  File/Window        │  │
│  │  Handlers   │  │  (sql.js)  │  │  Management         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                       contextBridge
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Electron Renderer Process                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    React Components                     ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  ││
│  │  │  Layout  │ │ OrderView│ │ Reports  │ │ Settings  │  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    React Context                         ││
│  │  ┌──────────────────────────────────────────────────┐  ││
│  │  │  AppContext (products, orders, staff, settings)   │  ││
│  │  └──────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 数据库设计

### 3.1 表结构

#### products (产品表)
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER,
  price REAL NOT NULL,
  image TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### categories (分类表)
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### orders (订单表)
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  payment_method TEXT,
  amount_paid REAL,
  change REAL,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  staff_id INTEGER,
  shift_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### order_items (订单明细表)
```sql
CREATE TABLE order_items (
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
```

#### staff (员工表)
```sql
CREATE TABLE staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### shifts (班次表)
```sql
CREATE TABLE shifts (
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
```

#### settings (设置表)
```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API设计 (IPC)

### 4.1 产品管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | get-products | 获取所有产品 |
| GET | get-categories | 获取所有分类 |
| GET | get-product/:id | 获取单个产品 |
| POST | create-product | 创建产品 |
| PUT | update-product/:id | 更新产品 |
| DELETE | delete-product/:id | 删除产品 |

### 4.2 订单管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | get-orders | 获取订单列表 |
| POST | create-order | 创建订单 |
| GET | get-order-items/:orderId | 获取订单明细 |

### 4.3 员工管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | get-staff | 获取所有员工 |
| POST | create-staff | 创建员工 |
| PUT | update-staff/:id | 更新员工 |
| DELETE | delete-staff/:id | 删除员工 |
| POST | staff-login | 员工登录 |

### 4.4 班次管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | get-shifts | 获取班次列表 |
| POST | start-shift | 开始上班 |
| PUT | end-shift/:id | 结束上班 |

### 4.5 报表
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | get-sales-report | 销售报表 |
| GET | get-product-sales | 产品销量 |
| GET | get-daily-stats | 每日统计 |
| GET | export-daily-excel | 导出日报 |
| GET | export-monthly-excel | 导出月报 |

---

## 5. 前端路由

| 视图 | 路径 | 说明 |
|------|------|------|
| LoginView | /login | 登录页 |
| OrderView | /order | 点单页 |
| HistoryView | /history | 历史订单 |
| ReportsView | /reports | 报表页 |
| ShiftView | /shift | 换班页 |
| ProductsView | /products | 产品管理 |
| SettingsView | /settings | 系统设置 |

---

## 6. 目录结构

```
coffee-pos/
├── src/
│   ├── main/                    # Electron主进程
│   │   ├── main.ts              # 入口文件
│   │   ├── database.ts          # 数据库操作
│   │   └── preload.ts           # 预加载脚本
│   ├── renderer/                # 前端渲染进程
│   │   ├── App.tsx              # 根组件
│   │   ├── main.tsx             # 前端入口
│   │   ├── components/          # React组件
│   │   │   ├── Layout.tsx       # 布局
│   │   │   ├── LoginView.tsx   # 登录
│   │   │   ├── OrderView.tsx   # 点单
│   │   │   ├── HistoryView.tsx # 历史订单
│   │   │   ├── ReportsView.tsx # 报表
│   │   │   ├── ShiftView.tsx   # 换班
│   │   │   ├── SettingsView.tsx# 设置
│   │   │   └── ...
│   │   ├── store/               # 状态管理
│   │   │   └── AppContext.tsx
│   │   ├── types/               # TypeScript类型
│   │   │   └── index.ts
│   │   └── styles.css           # 全局样式
│   └── preload/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.yml
```

---

## 7. 关键实现细节

### 7.1 订单号生成
```typescript
function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${dateStr}${random}`;
}
```

### 7.2 日期处理
使用本地时区，避免时区问题：
```typescript
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### 7.3 订单关联班次
- 下单时自动关联当前班次ID
- 交班时计算班次累计销售额

---

## 8. 构建配置

### electron-builder
- 输出目录: `release/`
- mac目标: DMG
- Windows目标: NSIS
- 代码签名: 后续配置

---

## 9. 安全考虑

- Context Isolation: 启用
- Node Integration: 禁用
- 所有IPC通信通过 preload 暴露的API
- 敏感操作需要管理员权限验证

---

## 10. 日志记录

- electron-log 配置
- 文件日志级别: info
- 控制台日志级别: debug
- 异常捕获: uncaughtException, unhandledRejection
