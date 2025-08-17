/**
 * 个人主页 - 主要脚本文件（展示版本）
 * 
 * 功能模块：
 * 1. PDF 简历显示 - 显示和下载PDF文件
 * 2. 作品集展示 - 瀑布流展示图片和视频作品
 * 3. 本地存储 - 数据加载
 * 
 * 依赖库：
 * - PDF.js: PDF渲染和显示
 * - Font Awesome: 图标库
 * 
 * @author Admin
 * @version 2.0.0 (展示版本)
 * @license MIT
 */

// PDF.js 初始化配置
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// 全局变量
let currentPdf = null;
let currentPage = 1;
let totalPages = 0;
let currentZoom = 1.0; // 默认缩放级别
let portfolioItems = [];

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    initializePdfDisplay();
    loadSavedPdf(); // 加载之前保存的PDF
    initializePortfolioView(); // 初始化作品集视图切换
    initializePortfolio(); // 初始化作品集功能
    initializeModals(); // 初始化预览模态框
});

// 初始化PDF显示功能（仅显示，无上传功能）
function initializePdfDisplay() {
    const downloadBtn = document.getElementById('downloadBtn');

    // PDF控制按钮事件
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage();
            }
        });
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            currentZoom = Math.min(currentZoom + 0.2, 3.0);
            renderPage();
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            currentZoom = Math.max(currentZoom - 0.2, 0.5);
            renderPage();
        });
    }

    // 下载按钮事件
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadPdf);
    }
}

// 从localStorage加载已保存的PDF
function loadSavedPdf() {
    const savedPdf = localStorage.getItem('savedPdf');
    if (savedPdf) {
        try {
            const pdfData = Uint8Array.from(atob(savedPdf), c => c.charCodeAt(0));
            handlePdfData(pdfData);
        } catch (error) {
            console.error('加载保存的PDF失败:', error);
        }
    } else {
        // 如果没有保存的PDF，显示占位符
        showPdfPlaceholder();
    }
}

// 显示PDF占位符
function showPdfPlaceholder() {
    const pdfViewer = document.getElementById('pdfViewer');
    if (pdfViewer) {
        pdfViewer.innerHTML = `
            <div class="pdf-placeholder">
                <i class="fas fa-file-pdf" style="font-size: 64px; color: #ccc; margin-bottom: 20px;"></i>
                <p style="color: #666;">暂无简历文件</p>
            </div>
        `;
    }
}

// 处理PDF数据
async function handlePdfData(data) {
    try {
        currentPdf = await pdfjsLib.getDocument({data: data}).promise;
        totalPages = currentPdf.numPages;
        currentPage = 1;
        currentZoom = 1.0;
        
        renderPage();
        updatePdfControls();
        
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.style.display = 'inline-block';
        }
    } catch (error) {
        console.error('PDF处理失败:', error);
        alert('PDF文件加载失败，请检查文件格式');
    }
}

// 渲染PDF页面
async function renderPage() {
    if (!currentPdf || currentPage < 1 || currentPage > totalPages) return;
    
    try {
        const page = await currentPdf.getPage(currentPage);
        const canvas = document.getElementById('pdfCanvas');
        const context = canvas.getContext('2d');
        
        // 获取页面视口
        const container = document.querySelector('.pdf-container');
        const containerWidth = container.clientWidth - 40; // 减去padding
        const viewport = page.getViewport({scale: 1});
        
        // 计算合适的缩放比例，确保PDF适合容器宽度
        let baseScale = containerWidth / viewport.width;
        baseScale = Math.min(Math.max(baseScale, 0.8), 1.2); // 限制在0.8-1.2之间
        
        const finalScale = baseScale * currentZoom;
        const scaledViewport = page.getViewport({scale: finalScale});
        
        // 设置高DPI渲染
        const devicePixelRatio = window.devicePixelRatio || 1;
        const scaleFactor = devicePixelRatio * 2; // 进一步提高清晰度
        
        canvas.width = scaledViewport.width * scaleFactor;
        canvas.height = scaledViewport.height * scaleFactor;
        canvas.style.width = scaledViewport.width + 'px';
        canvas.style.height = scaledViewport.height + 'px';
        
        // 设置画布的缩放
        context.scale(scaleFactor, scaleFactor);
        
        // 启用图像平滑以提高质量
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
        };
        
        await page.render(renderContext).promise;
        
        // 更新页面信息
        updatePageInfo();
        
    } catch (error) {
        console.error('页面渲染失败:', error);
    }
}

// 更新页面信息显示
function updatePageInfo() {
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `${currentPage} / ${totalPages}`;
    }
}

// 更新PDF控制按钮状态
function updatePdfControls() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }
    
    updatePageInfo();
}

// 下载PDF
function downloadPdf() {
    if (!currentPdf) return;
    
    const savedPdf = localStorage.getItem('savedPdf');
    if (savedPdf) {
        const blob = new Blob([Uint8Array.from(atob(savedPdf), c => c.charCodeAt(0))], {type: 'application/pdf'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '个人简历.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// 初始化作品集视图切换
function initializePortfolioView() {
    const gridViewBtn = document.getElementById('gridView');
    const listViewBtn = document.getElementById('listView');
    const portfolioGrid = document.getElementById('portfolioGrid');
    
    if (gridViewBtn && listViewBtn && portfolioGrid) {
        gridViewBtn.addEventListener('click', () => {
            portfolioGrid.classList.remove('list-view');
            portfolioGrid.classList.add('grid-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        });
        
        listViewBtn.addEventListener('click', () => {
            portfolioGrid.classList.remove('grid-view');
            portfolioGrid.classList.add('list-view');
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
        });
    }
}

// 初始化作品集功能（仅展示）
function initializePortfolio() {
    loadPortfolioItems();
    renderPortfolio();
}

// 从localStorage加载作品集数据
function loadPortfolioItems() {
    const saved = localStorage.getItem('portfolioItems');
    if (saved) {
        try {
            portfolioItems = JSON.parse(saved);
        } catch (error) {
            console.error('加载作品集数据失败:', error);
            portfolioItems = getDefaultPortfolioItems();
        }
    } else {
        portfolioItems = getDefaultPortfolioItems();
    }
}

// 获取默认作品集数据（用于演示）
function getDefaultPortfolioItems() {
    return [
        {
            id: 'demo1',
            title: '示例作品 1',
            description: '这是一个示例图片作品的描述',
            type: 'image',
            url: 'https://picsum.photos/800/600?random=1',
            createdAt: new Date().toISOString()
        },
        {
            id: 'demo2',
            title: '示例作品 2',
            description: '这是一个示例图片作品的描述',
            type: 'image',
            url: 'https://picsum.photos/600/800?random=2',
            createdAt: new Date().toISOString()
        },
        {
            id: 'demo3',
            title: '示例作品 3',
            description: '这是一个示例图片作品的描述',
            type: 'image',
            url: 'https://picsum.photos/900/600?random=3',
            createdAt: new Date().toISOString()
        },
        {
            id: 'demo4',
            title: '示例作品 4',
            description: '这是一个示例图片作品的描述',
            type: 'image',
            url: 'https://picsum.photos/700/900?random=4',
            createdAt: new Date().toISOString()
        }
    ];
}

// 渲染作品集
function renderPortfolio() {
    const portfolioGrid = document.getElementById('portfolioGrid');
    if (!portfolioGrid) return;
    
    portfolioGrid.innerHTML = '';
    
    if (portfolioItems.length === 0) {
        portfolioGrid.innerHTML = `
            <div class="empty-portfolio">
                <i class="fas fa-images" style="font-size: 64px; color: #ccc; margin-bottom: 20px;"></i>
                <p style="color: #666;">暂无作品展示</p>
            </div>
        `;
        return;
    }
    
    portfolioItems.forEach(item => {
        const itemElement = createPortfolioItem(item);
        portfolioGrid.appendChild(itemElement);
    });
}

// 创建作品项元素
function createPortfolioItem(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'portfolio-item';
    itemDiv.setAttribute('data-id', item.id);
    
    if (item.type === 'image') {
        itemDiv.innerHTML = `
            <div class="item-media">
                <img src="${item.url}" alt="${item.title}" loading="lazy">
            </div>
            <div class="item-info">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="item-actions">
                    <button class="preview-btn" onclick="previewItem(this)">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    } else if (item.type === 'video') {
        itemDiv.innerHTML = `
            <div class="item-media">
                <div class="video-thumbnail">
                    <video preload="metadata">
                        <source src="${item.url}" type="video/mp4">
                    </video>
                    <div class="play-overlay">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
            </div>
            <div class="item-info">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="item-actions">
                    <button class="preview-btn" onclick="previewItem(this)">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    return itemDiv;
}

// 预览作品
function previewItem(button) {
    const item = button.closest('.portfolio-item');
    const itemId = item.getAttribute('data-id');
    const portfolioItem = portfolioItems.find(p => p.id === itemId);
    
    if (!portfolioItem) return;
    
    const modal = document.getElementById('previewModal');
    const previewContent = document.getElementById('previewContent');
    
    if (portfolioItem.type === 'image') {
        previewContent.innerHTML = `
            <div class="preview-header">
                <h3>${portfolioItem.title}</h3>
            </div>
            <div class="preview-media">
                <img src="${portfolioItem.url}" alt="${portfolioItem.title}">
            </div>
            <div class="preview-description">
                <p>${portfolioItem.description}</p>
            </div>
        `;
    } else if (portfolioItem.type === 'video') {
        previewContent.innerHTML = `
            <div class="preview-header">
                <h3>${portfolioItem.title}</h3>
            </div>
            <div class="preview-media">
                <video controls>
                    <source src="${portfolioItem.url}" type="video/mp4">
                    您的浏览器不支持视频播放。
                </video>
            </div>
            <div class="preview-description">
                <p>${portfolioItem.description}</p>
            </div>
        `;
    }
    
    modal.style.display = 'flex';
}

// 初始化模态框
function initializeModals() {
    // 预览模态框关闭功能
    const previewModal = document.getElementById('previewModal');
    if (previewModal) {
        const closeBtn = previewModal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                previewModal.style.display = 'none';
            });
        }
        
        // 点击模态框外部关闭
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                previewModal.style.display = 'none';
            }
        });
    }
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal[style*="flex"]');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    });
}

// 页面加载完成后的初始化
window.addEventListener('load', function() {
    // 调整主容器高度
    adjustContainerHeight();
});

// 调整容器高度以适应窗口
function adjustContainerHeight() {
    const topNav = document.querySelector('.top-nav');
    const mainContainer = document.querySelector('.main-container');
    
    if (topNav && mainContainer) {
        const topNavHeight = topNav.offsetHeight;
        mainContainer.style.height = `calc(100vh - ${topNavHeight}px)`;
    }
}

// 窗口大小改变时重新调整
window.addEventListener('resize', function() {
    adjustContainerHeight();
    if (currentPdf) {
        renderPage(); // 重新渲染PDF以适应新尺寸
    }
});