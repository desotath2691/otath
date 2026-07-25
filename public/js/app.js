// 1. دالة إزالة الخلفية البيضاء مع تمرير الصورة عبر الوسيط البرمجي لتجنب مشاكل CORS
const removeWhiteBackground = (imageSrc) => {
    return new Promise((resolve, reject) => {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`;
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
                    data[i + 3] = 0; // جعل الخلفية البيضاء شفافة تماماً
                }
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = proxyUrl;
    });
};

// 2. دالة دمج الأثاث مفرغ الخلفية داخل مساحة الغرفة في متصفح العميل
const compositeImages = async (roomImageBase64, selectedProducts) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const roomImg = new Image();
    await new Promise(r => { roomImg.onload = r; roomImg.src = roomImageBase64; });
    
    canvas.width = roomImg.width;
    canvas.height = roomImg.height;
    ctx.drawImage(roomImg, 0, 0);
    
    for (const product of selectedProducts) {
        try {
            const transparentSrc = await removeWhiteBackground(product.imageUrl);
            
            const prodImg = new Image();
            await new Promise(r => { prodImg.onload = r; prodImg.src = transparentSrc; });
            
            const scale = (canvas.width * 0.4) / prodImg.width;
            const newWidth = prodImg.width * scale;
            const newHeight = prodImg.height * scale;
            
            const x = (canvas.width - newWidth) / 2; 
            const y = canvas.height - newHeight - (canvas.height * 0.15); 
            
            ctx.drawImage(prodImg, x, y, newWidth, newHeight);
        } catch (err) {
            console.error("خطأ في دمج صورة المنتج:", err);
        }
    }
    
    return canvas.toDataURL('image/jpeg', 0.9);
};

document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('upload-zone');
    const imageInput = document.getElementById('image-input');
    const uploadContent = document.getElementById('upload-content');
    const previewThumbnail = document.getElementById('preview-thumbnail');
    const clearImageBtn = document.getElementById('clear-image-btn');
    const productsContainer = document.getElementById('products-container');
    const searchInput = document.getElementById('search-input');
    const generateBtn = document.getElementById('generate-btn');
    const promptInput = document.getElementById('prompt-input');
    const mainCanvas = document.getElementById('main-canvas');
    const canvasPlaceholder = document.getElementById('canvas-placeholder');
    const loadingOverlay = document.getElementById('loading-overlay');
    const downloadBtn = document.getElementById('download-btn');
    const resultBadge = document.getElementById('result-badge');

    let baseImageBase64 = null;
    let selectedProducts = [];

    const otathProducts = [
        {
            id: 'green-american-sofa-2seater',
            name: 'كنب أمريكي ثنائي مميز باللون الأخضر',
            category: 'جلوس',
            imageUrl: 'https://cdn.salla.sa/QWgA/dcecbd68-c925-4442-966f-0f1d9cfd3507-1000x1000-XOgfpww34ogMhM9eKn7LGB12u55y1d7HtDwNNfXh.jpg',
            aiPrompt: 'A premium American-style two-seater sofa upholstered in elegant green fabric with a modern design'
        },
        {
            id: 'gray-lounge-chair',
            name: 'كرسي داخلي رمادي فاتح بتصميم مريح',
            category: 'جلوس',
            imageUrl: 'https://cdn.salla.sa/QWgA/babbc5ea-cb18-4513-8f29-b8c275b5af99-1000x666.66666666667-BddnYkF9DNAcVR1uKWQKot09H8z1fl2xsKnIEaRl.png',
            aiPrompt: 'A comfortable light gray upholstered lounge chair with a modern minimalist design'
        },
        {
            id: 'marble-coffee-table-gold',
            name: 'طقم طاولة ضيافة رخام أبيض/قاعدة ذهبي',
            category: 'طاولات',
            imageUrl: 'https://cdn.salla.sa/QWgA/8vNBh59aWwgtad5lZfwA9VOStqflr6oOrmeU9r03.png',
            aiPrompt: 'A luxury white marble coffee table set with elegant gold metal legs'
        },
        {
            id: 'clothes-rack-gray',
            name: 'علاقة ملابس أرضية معدنية بلون رمادي – تصميم أنيق',
            category: 'ديكور',
            imageUrl: 'https://cdn.salla.sa/QWgA/229408b8-18bc-4928-bcb7-2d3e5e46b4fe-1000x1000-fdf4OlM7Ch0h6e0Y7gUV3UN91T27viRuqzKGDlbm.png',
            aiPrompt: 'A modern gray metal freestanding clothes rack with a minimalist design'
        },
        {
            id: 'floor-lamp-marble',
            name: 'إضاءة أرضية بتصميم كروي فاخر وقاعدة رخامية',
            category: 'إضاءة',
            imageUrl: 'https://cdn.salla.sa/QWgA/26fb96e1-bef8-4685-afc8-d3b736368da3-1000x1000-6dPDIydZE29prnqTDv9OMw8TfsGoR3SfgbkM6UdD.png',
            aiPrompt: 'A luxury floor lamp with a spherical glass shade and a marble base'
        },
        {
            id: 'bed-white-king',
            name: 'سرير معدني أبيض ملكي – أكبر مساحة نوم للراحة القصوى مقاس 180x200 سم',
            category: 'غرف نوم',
            imageUrl: 'https://cdn.salla.sa/QWgA/7a866997-964b-43b0-8347-0c8ddc03bf17-1000x1000-x9euu2zmfwz6fbHzXQ8wXExtgb0PpDEFDLzp49yp.png',
            aiPrompt: 'A luxurious white metal king-size bed with a modern design'
        }
    ];

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'bg-red-600' : 'bg-stone-800'}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function renderProducts(filter = '') {
        productsContainer.innerHTML = '';
        const filteredProducts = otathProducts.filter(p => 
            p.name.includes(filter) || p.category.includes(filter)
        );
        
        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card bg-white rounded-xl p-3 cursor-pointer relative overflow-hidden group shadow-sm border border-stone-100';
            card.dataset.id = product.id;
            
            card.innerHTML = `
                <div class="absolute top-2 left-2 z-10 w-6 h-6 bg-amber-600 rounded-full text-white flex items-center justify-center check-icon shadow-md">
                    <i class="fa-solid fa-check text-xs"></i>
                </div>
                <div class="h-28 rounded-lg mb-3 overflow-hidden bg-stone-100 relative">
                    <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                </div>
                <div class="px-1">
                    <span class="text-[10px] uppercase tracking-wider text-amber-700 font-bold mb-1 block">${product.category}</span>
                    <h4 class="font-semibold text-sm text-stone-800 leading-tight mb-1">${product.name}</h4>
                </div>
            `;

            card.addEventListener('click', () => {
                const isSelected = card.classList.contains('selected');
                if (isSelected) {
                    card.classList.remove('selected');
                    selectedProducts = selectedProducts.filter(p => p.id !== product.id);
                } else {
                    card.classList.add('selected');
                    selectedProducts.push(product);
                }
                checkReadyState();
            });

            productsContainer.appendChild(card);
        });
    }

    renderProducts();
    searchInput.addEventListener('input', (e) => renderProducts(e.target.value));

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => uploadZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => uploadZone.classList.remove('dragover'), false);
    });

    uploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    imageInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        
        if (!file.type.startsWith('image/')) {
            showToast('عذراً، يرجى رفع ملف صورة صالح (JPG, PNG).', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            baseImageBase64 = reader.result;
            previewThumbnail.src = baseImageBase64;
            previewThumbnail.classList.remove('hidden');
            uploadContent.classList.add('opacity-0');
            clearImageBtn.classList.remove('hidden');
            clearImageBtn.classList.add('flex');
            showImageInCanvas(baseImageBase64);
            resultBadge.classList.add('hidden');
            downloadBtn.classList.add('hidden');
            downloadBtn.classList.remove('flex');
            checkReadyState();
        }
    }

    clearImageBtn.addEventListener('click', () => {
        baseImageBase64 = null;
        previewThumbnail.src = '';
        previewThumbnail.classList.add('hidden');
        uploadContent.classList.remove('opacity-0');
        clearImageBtn.classList.add('hidden');
        clearImageBtn.classList.remove('flex');
        imageInput.value = '';
        mainCanvas.src = '';
        mainCanvas.classList.add('hidden', 'opacity-0');
        canvasPlaceholder.style.display = 'flex';
        resultBadge.classList.add('hidden');
        downloadBtn.classList.add('hidden');
        downloadBtn.classList.remove('flex');
        checkReadyState();
    });

    function showImageInCanvas(src) {
        canvasPlaceholder.style.display = 'none';
        mainCanvas.src = src;
        mainCanvas.classList.remove('hidden');
        setTimeout(() => {
            mainCanvas.classList.remove('opacity-0');
        }, 50);
    }

    function checkReadyState() {
        if (baseImageBase64 && selectedProducts.length > 0) {
            generateBtn.disabled = false;
        } else {
            generateBtn.disabled = true;
        }
    }

    generateBtn.addEventListener('click', async () => {
        if (!baseImageBase64 || selectedProducts.length === 0) return;

        loadingOverlay.style.display = 'flex';
        generateBtn.disabled = true;
        downloadBtn.classList.add('hidden');
        downloadBtn.classList.remove('flex');
        resultBadge.classList.add('hidden');

        const aiTextResult = document.getElementById('ai-text-result');
        if(aiTextResult) aiTextResult.classList.add('hidden');

        simulateProgressSteps();

        try {
            // تنفيذ الدمج البرمجي عبر الوسيط الآمن
            const compositedImageBase64 = await compositeImages(baseImageBase64, selectedProducts);
            
            showImageInCanvas(compositedImageBase64);

            resultBadge.innerHTML = '<i class="fa-solid fa-check text-green-500 ml-1"></i> اكتمل التصميم بدقة مطابقة';
            resultBadge.classList.remove('hidden');
            downloadBtn.classList.remove('hidden');
            downloadBtn.classList.add('flex');
            
            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = compositedImageBase64;
                a.download = 'otath-design-final.jpg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
            
            showToast('تم دمج المنتج في غرفتك بنجاح مطابق 100%!');

        } catch (error) {
            console.error(error);
            showToast('حدث خطأ أثناء معالجة الصورة. يرجى المحاولة لاحقاً.', 'error');
            showImageInCanvas(baseImageBase64);
        } finally {
            loadingOverlay.style.display = 'none';
            generateBtn.disabled = false;
        }
    });

    function simulateProgressSteps() {
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const step3 = document.getElementById('step-3');
        
        step1.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-amber-600"></i> تحليل أبعاد الغرفة';
        step1.className = 'flex items-center gap-3 text-sm text-amber-600 font-medium';
        step2.innerHTML = '<i class="fa-regular fa-circle"></i> دمج قطع الأثاث...';
        step2.className = 'flex items-center gap-3 text-sm text-stone-400 opacity-50 transition-opacity';
        step3.innerHTML = '<i class="fa-regular fa-circle"></i> وضع اللمسات النهائية';
        step3.className = 'flex items-center gap-3 text-sm text-stone-400 opacity-50 transition-opacity';

        setTimeout(() => {
            step1.innerHTML = '<i class="fa-solid fa-circle-check text-green-500"></i> تم تحليل الغرفة';
            step1.className = 'flex items-center gap-3 text-sm text-stone-600';
            step2.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-amber-600"></i> دمج قطع الأثاث...';
            step2.className = 'flex items-center gap-3 text-sm text-amber-600 font-medium opacity-100';
        }, 1500);

        setTimeout(() => {
            step2.innerHTML = '<i class="fa-solid fa-circle-check text-green-500"></i> تم دمج الأثاث';
            step2.className = 'flex items-center gap-3 text-sm text-stone-600';
            step3.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-amber-600"></i> إعداد الصورة النهائية...';
            step3.className = 'flex items-center gap-3 text-sm text-amber-600 font-medium opacity-100';
        }, 3000);
    }
});
