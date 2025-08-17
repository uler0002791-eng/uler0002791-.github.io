// PDF.js 初始化
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// 全局变量
let currentPdf = null;
let currentPage = 1;
let totalPages = 0;
let currentZoom = 1.0; // 默认缩放级别
let portfolioItems = [];

// 认证相关变量
let isLoggedIn = false;
let currentUser = null;

// 预设的管理员账户
const ADMIN_USER = {
    id: 'admin_001',
    username: 'admin',
    password: 'MySecurePassword2024!',
    email: 'admin@example.com',
    role: 'admin'
};

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth(); // 初始化认证功能
    initializePdfUpload();
    loadSavedPdf(); // 加载之前保存的PDF
    initializePortfolioView(); // 初始化作品集视图切换
    initializePortfolio(); // 初始化作品集功能
    initializeModals(); // 初始化模态框
});

// 初始化PDF上传功能
function initializePdfUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfViewer = document.getElementById('pdfViewer');

    // 上传按钮点击事件
    uploadBtn.addEventListener('click', () => {
        if (!requireLogin()) return;
        pdfFileInput.click();
    });

    // 文件选择事件
    pdfFileInput.addEventListener('change', handlePdfUpload);

    // 拖拽上传
    pdfViewer.addEventListener('dragover', (e) => {
        e.preventDefault();
        pdfViewer.classList.add('dragover');
    });

    pdfViewer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        pdfViewer.classList.remove('dragover');
    });

    pdfViewer.addEventListener('drop', (e) => {
        e.preventDefault();
        pdfViewer.classList.remove('dragover');
        
        if (!requireLogin()) return;
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            handlePdfFile(files[0]);
        }
    });

    // PDF控制按钮事件
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage();
        }
    });

    document.getElementById('zoomIn').addEventListener('click', () => {
        currentZoom *= 1.2;
        updateZoom();
        renderPage();
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        currentZoom /= 1.2;
        updateZoom();
        renderPage();
    });

    // 下载按钮事件
    downloadBtn.addEventListener('click', downloadPdf);
    
    // 清除按钮事件
    const clearBtn = document.getElementById('clearBtn');
    clearBtn.addEventListener('click', () => {
        if (!requireLogin()) return;
        if (confirm('确定要清除保存的PDF吗？')) {
            clearSavedPdf();
        }
    });
}

// 处理PDF上传
function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        handlePdfFile(file);
    }
}

// 处理PDF文件
function handlePdfFile(file) {
    const fileReader = new FileReader();
    const pdfViewer = document.getElementById('pdfViewer');
    
    // 显示加载状态
    pdfViewer.innerHTML = '<div class="loading">正在加载PDF...</div>';
    
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        
        pdfjsLib.getDocument(typedarray).promise.then(pdf => {
            currentPdf = pdf;
            totalPages = pdf.numPages;
            currentPage = 1;
            
            // 更新界面
            document.getElementById('pdfControls').style.display = 'flex';
            document.getElementById('downloadBtn').style.display = 'inline-flex';
            document.getElementById('clearBtn').style.display = 'inline-flex';
            document.getElementById('totalPages').textContent = totalPages;
            
            // 渲染第一页
            renderPage();
            
            // 存储文件用于下载
            document.getElementById('downloadBtn').pdfFile = file;
            
            // 保存PDF到本地存储
            savePdfToLocalStorage(file);
        }).catch(error => {
            console.error('PDF加载失败:', error);
            pdfViewer.innerHTML = '<div class="pdf-placeholder"><i class="fas fa-exclamation-triangle"></i><p>PDF加载失败，请重试</p></div>';
        });
    };
    
    fileReader.readAsArrayBuffer(file);
}

// 渲染PDF页面
function renderPage() {
    if (!currentPdf) return;
    
    const pdfViewer = document.getElementById('pdfViewer');
    
    currentPdf.getPage(currentPage).then(page => {
        // 计算缩放比例 - 让PDF以合适的尺寸显示
        const containerWidth = pdfViewer.clientWidth - 40; // 减去padding
        const viewport = page.getViewport({ scale: 1.0 });
        
        // 计算合适的缩放比例 - 设置为当前理想的显示比例
        let baseScale;
        
        // 根据容器宽度计算合适的缩放比例，让PDF显示得既清晰又完整
        const idealScale = containerWidth / viewport.width;
        
        if (idealScale < 0.8) {
            // 如果需要大幅缩小，使用0.8作为最小比例
            baseScale = 0.8;
        } else if (idealScale > 1.2) {
            // 如果可以放大很多，限制在1.2倍
            baseScale = 1.2;
        } else {
            // 使用计算出的理想比例
            baseScale = idealScale;
        }
        
        // 应用用户缩放
        const finalScale = baseScale * currentZoom;
        
        // 使用更高的DPI来提升清晰度
        const pixelRatio = window.devicePixelRatio || 1;
        const highDPIScale = finalScale * pixelRatio;
        
        const scaledViewport = page.getViewport({ scale: highDPIScale });
        
        // 创建canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // 设置canvas的实际大小（高DPI）
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        // 设置canvas的显示大小
        canvas.style.width = (scaledViewport.width / pixelRatio) + 'px';
        canvas.style.height = (scaledViewport.height / pixelRatio) + 'px';
        
        canvas.id = 'pdfCanvas';
        
        // 清空并添加canvas
        pdfViewer.innerHTML = '';
        pdfViewer.appendChild(canvas);
        
        // 启用抗锯齿和图像平滑
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        // 渲染PDF页面
        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
        };
        
        page.render(renderContext).promise.then(() => {
            // 更新页面信息
            document.getElementById('currentPage').textContent = currentPage;
            
            // 更新按钮状态
            document.getElementById('prevPage').disabled = currentPage <= 1;
            document.getElementById('nextPage').disabled = currentPage >= totalPages;
        });
    });
}

// 更新缩放显示
function updateZoom() {
    const zoomPercent = Math.round(currentZoom * 100);
    document.getElementById('zoomLevel').textContent = zoomPercent + '%';
}

// 下载PDF
function downloadPdf() {
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn.pdfFile) {
        const url = URL.createObjectURL(downloadBtn.pdfFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadBtn.pdfFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// 保存PDF到本地存储
function savePdfToLocalStorage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        const base64String = arrayBufferToBase64(arrayBuffer);
        
        // 保存PDF数据和文件信息
        const pdfData = {
            data: base64String,
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            savedAt: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('savedPDF', JSON.stringify(pdfData));
            console.log('PDF已保存到本地存储');
        } catch (error) {
            console.error('保存PDF失败:', error);
            alert('PDF文件过大，无法保存到本地存储');
        }
    };
    reader.readAsArrayBuffer(file);
}

// 从本地存储加载PDF
function loadSavedPdf() {
    try {
        const savedPdfData = localStorage.getItem('savedPDF');
        if (savedPdfData) {
            const pdfData = JSON.parse(savedPdfData);
            
            // 将base64转换回ArrayBuffer
            const arrayBuffer = base64ToArrayBuffer(pdfData.data);
            
            // 创建File对象
            const file = new File([arrayBuffer], pdfData.name, {
                type: pdfData.type,
                lastModified: pdfData.lastModified
            });
            
            // 加载PDF
            handlePdfFile(file);
            
            console.log('已加载之前保存的PDF:', pdfData.name);
        }
    } catch (error) {
        console.error('加载保存的PDF失败:', error);
    }
}

// ArrayBuffer转Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Base64转ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// 清除保存的PDF
function clearSavedPdf() {
    try {
        localStorage.removeItem('savedPDF');
        console.log('已清除保存的PDF');
        
        // 重置界面
        const pdfViewer = document.getElementById('pdfViewer');
        pdfViewer.innerHTML = `
            <div class="pdf-placeholder">
                <i class="fas fa-file-pdf"></i>
                <p>个人简历，请拖拽上传pdf，直接展示在这里</p>
                <p class="pdf-hint">支持拖拽上传</p>
            </div>
        `;
        
        document.getElementById('pdfControls').style.display = 'none';
        document.getElementById('downloadBtn').style.display = 'none';
        document.getElementById('clearBtn').style.display = 'none';
        
        currentPdf = null;
        currentPage = 1;
        totalPages = 0;
        currentZoom = 1.0;
    } catch (error) {
        console.error('清除PDF失败:', error);
    }
}

// 初始化作品集视图切换
function initializePortfolioView() {
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');
    
    if (gridBtn && listBtn) {
        gridBtn.addEventListener('click', () => setViewMode('grid'));
        listBtn.addEventListener('click', () => setViewMode('list'));
    }
}

// 设置视图模式
function setViewMode(mode) {
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');
    const portfolioGrid = document.getElementById('portfolioGrid');
    
    if (!gridBtn || !listBtn || !portfolioGrid) return;
    
    if (mode === 'grid') {
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        // 瀑布流模式：3列
        portfolioGrid.style.columnCount = '3';
        portfolioGrid.style.display = 'block';
    } else {
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        // 列表模式：1列
        portfolioGrid.style.columnCount = '1';
        portfolioGrid.style.display = 'block';
    }
}

// 初始化作品集功能
function initializePortfolio() {
    const addWorkBtn = document.getElementById('addWorkBtn');
    const addWorkModal = document.getElementById('addWorkModal');
    const editWorkModal = document.getElementById('editWorkModal');

    // 添加作品按钮
    if (addWorkBtn && addWorkModal) {
        addWorkBtn.addEventListener('click', () => {
            if (!requireLogin()) return;
            addWorkModal.style.display = 'block';
        });

        // 确认添加作品
        const confirmBtn = document.getElementById('confirmAdd');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', addWork);
        }
        
        // 取消添加作品
        const cancelBtn = document.getElementById('cancelAdd');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                addWorkModal.style.display = 'none';
                resetAddWorkForm();
            });
        }

        // 文件拖拽上传
        setupFileDragAndDrop();
    }

    // 编辑作品功能
    if (editWorkModal) {
        // 确认编辑
        const confirmEditBtn = document.getElementById('confirmEdit');
        if (confirmEditBtn) {
            confirmEditBtn.addEventListener('click', saveEditWork);
        }
        
        // 取消编辑
        const cancelEditBtn = document.getElementById('cancelEdit');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                editWorkModal.style.display = 'none';
            });
        }
    }
}

// 设置文件拖拽上传
function setupFileDragAndDrop() {
    const fileDropZone = document.getElementById('fileDropZone');
    const workFile = document.getElementById('workFile');

    if (!fileDropZone || !workFile) return;

    fileDropZone.addEventListener('click', () => {
        workFile.click();
    });

    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.classList.add('dragover');
    });

    fileDropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('dragover');
    });

    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            workFile.files = files;
            updateFileDropZone(files[0]);
        }
    });

    workFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            updateFileDropZone(e.target.files[0]);
        }
    });
}

// 更新文件拖拽区域显示
function updateFileDropZone(file) {
    const fileDropZone = document.getElementById('fileDropZone');
    if (fileDropZone) {
        fileDropZone.innerHTML = `
            <i class="fas fa-check-circle" style="color: #28a745;"></i>
            <p>已选择文件: ${file.name}</p>
        `;
    }
}

// 添加作品
function addWork() {
    const title = document.getElementById('workTitle');
    const description = document.getElementById('workDescription');
    const type = document.getElementById('workType');
    const file = document.getElementById('workFile');

    if (!title || !description || !type || !file) return;

    const titleValue = title.value.trim();
    const descriptionValue = description.value.trim();
    const typeValue = type.value;
    const fileValue = file.files[0];

    if (!titleValue || !descriptionValue || !fileValue) {
        alert('请填写所有必填字段并选择文件');
        return;
    }

    // 创建文件URL
    const fileUrl = URL.createObjectURL(fileValue);
    
    // 创建作品对象
    const work = {
        id: Date.now(),
        title: titleValue,
        description: descriptionValue,
        type: typeValue,
        url: fileUrl,
        fileName: fileValue.name
    };

    // 添加到作品列表
    portfolioItems.push(work);
    
    // 渲染作品项
    renderPortfolioItem(work);
    
    // 关闭模态框并重置表单
    document.getElementById('addWorkModal').style.display = 'none';
    resetAddWorkForm();
}

// 渲染作品项
function renderPortfolioItem(work) {
    const portfolioGrid = document.getElementById('portfolioGrid');
    if (!portfolioGrid) return;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'portfolio-item';
    itemDiv.setAttribute('data-type', work.type);
    itemDiv.setAttribute('data-id', work.id);

    let contentHtml = '';
    
    if (work.type === 'image') {
        contentHtml = `<img src="${work.url}" alt="${work.title}">`;
    } else if (work.type === 'video') {
        contentHtml = `
            <div class="video-thumbnail">
                <video src="${work.url}" preload="metadata" style="width: 100%; height: auto; display: block;"></video>
                <div class="play-icon">
                    <i class="fas fa-play"></i>
                </div>
            </div>
        `;
    }

    itemDiv.innerHTML = `
        <div class="item-content">
            ${contentHtml}
            <div class="item-overlay">
                <div class="item-info">
                    <h3>${work.title}</h3>
                    <p>${work.description}</p>
                </div>
                                                <div class="item-actions">
                                    <button class="preview-btn" onclick="previewItem(this)">
                                        <i class="fas fa-${work.type === 'video' ? 'play' : 'eye'}"></i>
                                    </button>
                                    <button class="edit-btn" onclick="editItem(this)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="delete-btn" onclick="deleteItem(this)">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
            </div>
        </div>
    `;

    portfolioGrid.appendChild(itemDiv);
}

// 重置添加作品表单
function resetAddWorkForm() {
    const elements = ['workTitle', 'workDescription', 'workType', 'workFile'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'file') {
                element.value = '';
            } else if (element.tagName === 'SELECT') {
                element.value = 'image';
            } else {
                element.value = '';
            }
        }
    });
    
    // 重置文件拖拽区域
    const fileDropZone = document.getElementById('fileDropZone');
    if (fileDropZone) {
        fileDropZone.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>拖拽文件到此处或点击选择</p>
        `;
    }
}

// 预览作品
function previewItem(button) {
    const portfolioItem = button.closest('.portfolio-item');
    if (!portfolioItem) return;

    const workId = parseInt(portfolioItem.getAttribute('data-id'));
    const work = portfolioItems.find(w => w.id === workId);
    const previewContent = document.getElementById('previewContent');
    const previewModal = document.getElementById('previewModal');
    
    if (!previewContent || !previewModal) return;

    if (!work) {
        // 处理示例作品的预览
        const img = portfolioItem.querySelector('img');
        const video = portfolioItem.querySelector('video');
        
        if (img) {
            previewContent.innerHTML = `<img src="${img.src}" alt="预览图片">`;
        } else if (video) {
            previewContent.innerHTML = `<video src="${video.src}" controls autoplay>`;
        }
    } else {
        // 处理用户上传作品的预览
        if (work.type === 'image') {
            previewContent.innerHTML = `<img src="${work.url}" alt="${work.title}">`;
        } else if (work.type === 'video') {
            previewContent.innerHTML = `<video src="${work.url}" controls autoplay>`;
        }
    }
    
    previewModal.style.display = 'block';
}

// 删除作品
function deleteItem(button) {
    if (!requireLogin()) return;
    if (!confirm('确定要删除这个作品吗？')) return;

    const portfolioItem = button.closest('.portfolio-item');
    if (!portfolioItem) return;

    const workId = parseInt(portfolioItem.getAttribute('data-id'));
    
    if (workId) {
        // 删除用户上传的作品
        const workIndex = portfolioItems.findIndex(w => w.id === workId);
        if (workIndex > -1) {
            // 释放文件URL
            URL.revokeObjectURL(portfolioItems[workIndex].url);
            portfolioItems.splice(workIndex, 1);
        }
    }
    
    // 从DOM中移除
    portfolioItem.remove();
}

// 初始化模态框
function initializeModals() {
    // 关闭按钮事件
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                
                // 停止视频播放
                const video = modal.querySelector('video');
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            }
        });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            
            // 停止视频播放
            const video = e.target.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        }
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="block"]');
            openModals.forEach(modal => {
                modal.style.display = 'none';
                
                // 停止视频播放
                const video = modal.querySelector('video');
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            });
        }
    });
}

// 全局变量，存储当前编辑的作品
let currentEditingWork = null;

// 编辑作品
function editItem(button) {
    if (!requireLogin()) return;
    const portfolioItem = button.closest('.portfolio-item');
    if (!portfolioItem) return;

    const workId = parseInt(portfolioItem.getAttribute('data-id'));
    let work = null;
    
    if (workId) {
        // 编辑用户上传的作品
        work = portfolioItems.find(w => w.id === workId);
    } else {
        // 编辑示例作品，创建临时对象
        const titleElement = portfolioItem.querySelector('.item-info h3');
        const descElement = portfolioItem.querySelector('.item-info p');
        
        work = {
            id: 'temp_' + Date.now(),
            title: titleElement ? titleElement.textContent : '',
            description: descElement ? descElement.textContent : '',
            isExample: true,
            element: portfolioItem
        };
    }
    
    if (!work) return;
    
    // 保存当前编辑的作品
    currentEditingWork = work;
    
    // 填充编辑表单
    const editModal = document.getElementById('editWorkModal');
    const titleInput = document.getElementById('editWorkTitle');
    const descInput = document.getElementById('editWorkDescription');
    
    if (editModal && titleInput && descInput) {
        titleInput.value = work.title;
        descInput.value = work.description;
        editModal.style.display = 'block';
    }
}

// 保存编辑的作品
function saveEditWork() {
    if (!currentEditingWork) return;
    
    const titleInput = document.getElementById('editWorkTitle');
    const descInput = document.getElementById('editWorkDescription');
    
    if (!titleInput || !descInput) return;
    
    const newTitle = titleInput.value.trim();
    const newDescription = descInput.value.trim();
    
    if (!newTitle || !newDescription) {
        alert('请填写标题和描述');
        return;
    }
    
    // 更新作品信息
    currentEditingWork.title = newTitle;
    currentEditingWork.description = newDescription;
    
    if (currentEditingWork.isExample) {
        // 更新示例作品的DOM
        const titleElement = currentEditingWork.element.querySelector('.item-info h3');
        const descElement = currentEditingWork.element.querySelector('.item-info p');
        
        if (titleElement) titleElement.textContent = newTitle;
        if (descElement) descElement.textContent = newDescription;
    } else {
        // 更新用户上传作品的DOM
        const portfolioItem = document.querySelector(`[data-id="${currentEditingWork.id}"]`);
        if (portfolioItem) {
            const titleElement = portfolioItem.querySelector('.item-info h3');
            const descElement = portfolioItem.querySelector('.item-info p');
            
            if (titleElement) titleElement.textContent = newTitle;
            if (descElement) descElement.textContent = newDescription;
        }
        
        // 更新portfolioItems数组中的数据
        const workIndex = portfolioItems.findIndex(w => w.id === currentEditingWork.id);
        if (workIndex > -1) {
            portfolioItems[workIndex].title = newTitle;
            portfolioItems[workIndex].description = newDescription;
        }
    }
    
    // 关闭模态框
    document.getElementById('editWorkModal').style.display = 'none';
    currentEditingWork = null;
    
    // 显示成功消息
    alert('作品信息已更新');
}

// 窗口大小改变时重新渲染PDF
window.addEventListener('resize', () => {
    if (currentPdf) {
        setTimeout(() => {
            renderPage();
        }, 100);
    }
});

// ========================== 认证功能 ==========================

// 初始化认证功能
function initializeAuth() {
    // 检查本地存储的登录状态
    checkLoginStatus();
    
    // 绑定事件监听器
    bindAuthEvents();
}

// 检查登录状态
function checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            isLoggedIn = true;
            updateUIForLoginState();
        } catch (e) {
            console.error('解析用户信息失败:', e);
            localStorage.removeItem('currentUser');
        }
    }
}

// 绑定认证相关事件
function bindAuthEvents() {
    // 登录按钮
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    // 退出按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // 登录模态框中的事件
    const confirmLoginBtn = document.getElementById('confirmLogin');
    if (confirmLoginBtn) {
        confirmLoginBtn.addEventListener('click', handleLogin);
    }
    

    
    // 未登录提示模态框中的去登录按钮
    const goToLoginBtn = document.getElementById('goToLogin');
    if (goToLoginBtn) {
        goToLoginBtn.addEventListener('click', () => {
            hideModal('loginRequiredModal');
            showLoginModal();
        });
    }
}

// 显示登录模态框
function showLoginModal() {
    hideModal('registerModal');
    showModal('loginModal');
    
    // 清空表单
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}



// 处理登录
function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    // 验证管理员账户
    if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
        // 登录成功
        currentUser = { 
            id: ADMIN_USER.id, 
            username: ADMIN_USER.username, 
            email: ADMIN_USER.email,
            role: ADMIN_USER.role
        };
        isLoggedIn = true;
        
        // 保存登录状态
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 更新UI
        updateUIForLoginState();
        
        // 关闭模态框
        hideModal('loginModal');
        
        alert('管理员登录成功！');
    } else {
        alert('用户名或密码错误，仅限管理员访问');
    }
}



// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        isLoggedIn = false;
        currentUser = null;
        
        // 清除本地存储
        localStorage.removeItem('currentUser');
        
        // 更新UI
        updateUIForLoginState();
        
        alert('已退出登录');
    }
}



// 更新UI以反映登录状态
function updateUIForLoginState() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const usernameSpan = document.getElementById('username');
    
    if (isLoggedIn && currentUser) {
        // 已登录状态
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        usernameSpan.textContent = currentUser.username;
    } else {
        // 未登录状态
        loginBtn.style.display = 'flex';
        userInfo.style.display = 'none';
    }
}

// 检查是否需要登录
function requireLogin(action) {
    if (!isLoggedIn) {
        showModal('loginRequiredModal');
        return false;
    }
    return true;
}

// 显示模态框
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

// 隐藏模态框
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}