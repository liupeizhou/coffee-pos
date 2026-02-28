# ☕ Coffee POS System

Give your coffee shop intelligent ordering capability

MIT License  Electron  React  SQLite

[中文](README.md) · [English](README-en.md)

## ⭐ Why Choose Us

🖥️ **Desktop App** - Works offline, local storage
👨‍💼 **Multi-role** - Admin + Staff, role-based access
📊 **Reports** - Sales analytics, YoY/MoM, Excel export
🔄 **Shift Management** - Morning/Afternoon/Evening shifts
💾 **Local Storage** - SQLite database, secure & controllable

## 🚀 Quick Start

```bash
# Clone project
git clone https://github.com/liupeizhou/coffee-pos.git
cd coffee-pos

# Install dependencies
npm install

# Start app
npm run start
```

Default accounts:
- Admin: `001` / `admin123`
- Staff: `002` / `123456`

## 📋 Features

| Module | Features |
|--------|----------|
| 🔐 **Login** | Employee ID login, role-based (admin/staff), logout |
| 🛒 **Order** | Product selection, options (size/temp), cart, multiple payments |
| 📦 **Orders** | Real-time orders, history, notes |
| 👥 **Staff** | Staff CRUD, permission management |
| 🔄 **Shifts** | Clock in/out, shift reports |
| 📈 **Reports** - Daily sales, product analytics, Excel export |
| ⚙️ **Settings** | Shop name, member discount, payment methods |
| 🏪 **Products** | Categories, products CRUD, options |

## 🖥️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron 28
- **Database**: SQLite (sql.js)
- **State**: React Context
- **Excel**: XLSX

## 🛠️ Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start
npm run start

# Package
npm run package
```

## 📝 Changelog

### v1.0.1 - 2026-02-28
- 🐛 Fix: YoY variable naming (yoy → dod)
- 🐛 Fix: UTC time issue → local timezone
- ✅ Test: 20+ database test cases

### v1.0.0 - 2026-02-28
- 🎉 Initial release
- ✨ Core: Login, orders, shifts, reports

## 🤝 Contributing

Feel free to submit Issues and PRs!

## 📄 License

MIT
