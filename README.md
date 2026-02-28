# ☕ 咖啡店点单系统

给你的咖啡店装上智能点单能力

MIT License  Electron  React  SQLite

[中文](README.md) · [English](README-en.md)

## ⭐ 为什么选择我们

🖥️ **桌面应用** - 无需联网，本地运行，断网也能点单
👨‍💼 **多角色支持** - 管理员 + 员工，权限分离
📊 **完整报表** - 销售统计、同比环比分析、Excel 导出
🔄 **换班系统** - 早中晚班管理，交接班清晰明了
💾 **本地存储** - SQLite 数据库，数据安全可控

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/liupeizhou/coffee-pos.git
cd coffee-pos

# 安装依赖
npm install

# 启动应用
npm run start
```

首次启动：
- 管理员账号：`001` / `admin123`
- 员工账号：`002` / `123456`

## 📋 功能列表

| 模块 | 功能 |
|------|------|
| 🔐 **登录系统** | 工号登录、角色区分（管理员/员工）、登出 |
| 🛒 **点单结算** | 产品选择、规格选项（大小/温度）、加入购物车、多种支付方式 |
| 📦 **订单管理** | 实时订单、历史订单、订单备注 |
| 👥 **员工管理** | 员工账号 CRUD、权限管理 |
| 🔄 **换班系统** | 上班打卡、下班交班、当班营业额统计 |
| 📈 **报表系统** | 销售汇总、产品销量、日环比/月环比、Excel 导出 |
| ⚙️ **系统设置** | 店铺名称、会员折扣、支付方式配置 |
| 🏪 **产品管理** | 分类管理、产品 CRUD、规格选项 |

## 🖥️ 技术栈

- **前端**: React 18 + TypeScript
- **桌面框架**: Electron 28
- **数据库**: SQLite (sql.js)
- **状态管理**: React Context
- **Excel 导出**: XLSX

## 📁 项目结构

```
coffee-pos/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── main.ts     # 应用入口
│   │   ├── preload.ts  # 预加载脚本
│   │   └── database.ts # 数据库操作
│   └── renderer/       # React 渲染进程
│       ├── components/ # UI 组件
│       ├── store/      # 状态管理
│       └── App.tsx     # 应用入口
├── public/
└── dist/               # 构建输出
```

## 🛠️ 开发命令

```bash
# 开发模式（同时启动渲染进程和主进程）
npm run dev

# 构建生产版本
npm run build

# 启动已构建的应用
npm run start

# 打包安装包
npm run package
```

## 📝 更新日志

### v1.0.1 - 2026-02-28
- 🐛 修复：同比环比变量命名错误（yoy → dod）
- 🐛 修复：时间显示为 UTC 问题，改为本地时区
- ✅ 测试：完成数据库层 20+ 测试用例

### v1.0.0 - 2026-02-28
- 🎉 初始版本发布
- ✨ 核心功能：登录、点单、订单、换班、报表

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
