# 个人主页 Personal Portfolio

[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-brightgreen)](https://你的用户名.github.io/个人主页)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PDF.js](https://img.shields.io/badge/PDF.js-FF6B35?logo=mozilla&logoColor=white)](https://mozilla.github.io/pdf.js/)

一个现代化的个人主页项目，支持PDF简历展示和作品集管理。

## 🚀 在线演示

- **演示地址**: [点击访问](https://你的用户名.github.io/个人主页) *(请替换为您的实际GitHub Pages地址)*

> **📌 说明**: 这是一个纯展示版本，仅支持浏览功能，不支持上传或修改操作。

## 📸 项目截图

### 主界面
- 左侧：PDF简历展示区域（支持预览、下载）
- 右侧：作品集瀑布流展示（支持图片和视频）

### 展示功能
- 纯静态展示，无需登录
- 作品预览和浏览
- 响应式设计，适配移动端

## 功能特性

- 📄 **PDF简历展示**：预览、下载PDF简历，支持缩放和翻页
- 🎨 **作品集展示**：瀑布流布局展示图片和视频作品
- 👁️ **作品预览**：支持图片和视频的全屏预览
- 📱 **响应式设计**：适配各种屏幕尺寸
- 💾 **本地存储**：演示数据保存在浏览器本地

## 技术栈

- HTML5 + CSS3 + JavaScript (原生)
- PDF.js (PDF渲染)
- LocalStorage (数据持久化)
- Font Awesome (图标库)

## 部署方法

### 方法一：静态网站托管平台（推荐）

#### 1. Netlify
1. 将项目文件上传到 GitHub
2. 在 [Netlify](https://netlify.com) 注册账户
3. 连接 GitHub 仓库
4. 自动部署并获得免费域名
5. 绑定您的自定义域名

#### 2. Vercel
1. 在 [Vercel](https://vercel.com) 注册账户
2. 导入 GitHub 项目
3. 自动部署
4. 配置自定义域名

#### 3. GitHub Pages
1. 将代码推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择 main 分支作为源
4. 访问 `https://你的用户名.github.io/仓库名`

### 方法二：传统Web服务器

#### 1. 云服务器 (阿里云/腾讯云/AWS)
1. 购买云服务器
2. 安装 Nginx 或 Apache
3. 将项目文件上传到 `/var/www/html/` 或相应目录
4. 配置域名解析

#### 2. 虚拟主机
1. 购买支持静态网站的虚拟主机
2. 通过 FTP 上传所有项目文件
3. 配置域名指向

## 域名配置

### DNS 设置
```
类型    名称    值
A       @       服务器IP地址
A       www     服务器IP地址
```

### HTTPS 配置（推荐）
- 使用 Let's Encrypt 免费SSL证书
- 在 Netlify/Vercel 中可自动配置HTTPS
- 云服务器可使用 Certbot 自动配置

## 自定义内容

### 添加PDF简历
将您的PDF简历文件重命名为 `resume.pdf` 并放置在项目根目录，然后修改 `script.js` 中的默认加载逻辑。

### 添加作品集内容
修改 `script.js` 中的 `getDefaultPortfolioItems()` 函数，替换示例作品数据：

```javascript
function getDefaultPortfolioItems() {
    return [
        {
            id: 'work1',
            title: '您的作品标题',
            description: '作品描述',
            type: 'image', // 或 'video'
            url: '作品文件URL',
            createdAt: new Date().toISOString()
        }
        // 添加更多作品...
    ];
}
```

## 自定义配置

### 修改页面标题
编辑 `index.html` 中的 `<title>` 标签

### 修改样式
编辑 `styles.css` 文件来自定义外观

### 添加网站图标
在根目录添加 `favicon.ico` 文件

## 文件说明

- `index.html` - 主页面结构
- `styles.css` - 样式文件
- `script.js` - 功能脚本
- `接口文档.md` - 接口说明文档

## 浏览器兼容性

- Chrome/Edge/Firefox/Safari (现代浏览器)
- 移动端浏览器
- 不支持 IE

## 使用说明

### 浏览功能
- 查看PDF简历：支持翻页、缩放、下载
- 浏览作品集：瀑布流布局，支持预览
- 响应式设计：在不同设备上都有良好的体验

### 自定义部署
1. Fork或下载此项目
2. 修改 `script.js` 中的作品集数据
3. 添加您的PDF简历文件
4. 部署到GitHub Pages或其他静态托管平台

## 常见问题

**Q: 如何添加自己的作品？**
A: 修改 `script.js` 中的 `getDefaultPortfolioItems()` 函数

**Q: 如何更换PDF简历？**
A: 将您的PDF文件转换为base64格式并存储在localStorage中，或修改加载逻辑

**Q: 如何修改页面布局？**
A: 编辑 `styles.css` 文件中的相关样式

**Q: 支持哪些文件格式？**
A: PDF简历，图片（JPEG, PNG, GIF, WebP），视频（MP4, WebM）

## 技术支持

如有问题，请检查：
1. 浏览器控制台是否有错误
2. 网络连接是否正常
3. 文件是否完整上传

## 许可证

此项目采用 MIT 许可证，可自由使用和修改。