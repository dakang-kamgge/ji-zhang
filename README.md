# 记账本

一款简洁的本地记账 Web 应用，纯前端实现，无需后端服务器。支持收支记录、分类管理、图表统计、浅色/深色主题切换、数据导出/导入备份。

![封面](封面.png)

## 📥 下载安装

### Android APK

直接下载安装包，传到手机即可使用：

[👉 下载 记账本.apk](记账本.apk)

> 安装时需在手机设置中允许「安装未知来源应用」。  
> 文件大小：约 13MB，支持 Android 7.0+

### Web 版

无需安装，浏览器打开 `index.html` 即可使用。

## ✨ 功能特性

- **收支记账** — 支出/收入切换，预设分类（餐饮🍜、交通🚗、购物🛒 等），自定义分类图标与颜色
- **最近记录** — 最近 10 条记录，支持编辑和删除
- **统计图表** — 支出分类占比饼图 + 支出趋势折线图，支持 今日/本周/本月/本年 切换
- **自定义日期选择器** — 日历网格 + 时间调节，完全自研 UI 组件
- **主题切换** — 奶油黄暖色浅色模式 / 深色模式
- **数据备份** — 导出 JSON 备份文件，一键恢复
- **手势操作** — 左右滑动切换页面
- **按钮动画** — 波纹点击、按压缩放、保存闪光

## 🛠 技术栈

| 技术 | 说明 |
|------|------|
| HTML5 | 单页应用 |
| CSS3 | CSS 变量主题系统，暖色调设计 |
| 原生 JavaScript | ES6+，IIFE 模块模式 |
| Chart.js 4.4.7 | 饼图 + 折线图 |
| localStorage | 浏览器本地存储 |

零框架依赖，零构建工具。

## 📂 项目结构

```
├── index.html          # 单页面（三个 section + 弹窗 + 底部导航）
├── 封面.png             # 应用图标
├── 记账本.apk           # Android 安装包
├── css/
│   └── style.css       # 全部样式（含浅色/深色主题）
└── js/
    ├── app.js           # 入口：模块初始化 + 页面导航 + 全局弹窗
    ├── datepicker.js    # 自定义日期时间选择器组件
    ├── storage.js       # 数据层：localStorage CRUD
    ├── record.js        # 记账模块：录入/编辑/删除
    ├── stats.js         # 统计模块：图表
    └── settings.js      # 设置模块：主题/分类/备份
```

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/dakang-kamgge/ji-zhang.git
cd ji-zhang

# 直接用浏览器打开
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

无需安装依赖，无需构建，打开即用。

## 📱 打包 Android APK

```bash
# 前置条件：Node.js、Android Studio（含 SDK）

# 安装依赖
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

# 初始化 Capacitor
npx cap init "记账本" com.jizhang.app --web-dir .
npx cap add android
npx cap copy android

# 构建 APK
cd android
./gradlew assembleDebug
# 输出: android/app/build/outputs/apk/debug/app-debug.apk
```

## 🎨 设计系统

**浅色模式**
| 元素 | 色值 |
|------|------|
| 背景 | `#FFF9EE` 奶油黄 |
| 卡片 | `#FFFCF6` 暖白 |
| 主题色 | `#D4893A` 琥珀金 |
| 支出 | `#D94F4F` 暖红 |
| 收入 | `#4CAF6A` 暖绿 |

**深色模式** — 暖棕色系，`#1C1914` 底色，`#E8A548` 主题色。

## 📄 开发文档

详见 [开发文档.md](开发文档.md)

## 📋 需求文档

详见 [sm.md](sm.md)

## 📜 License

[MIT License](LICENSE)
