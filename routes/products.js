import express from 'express';

const router = express.Router();

// قائمة مبدئية لمنتجات منصة أوتاث 
// (يمكننا لاحقاً ربطها بقاعدة بيانات بدلاً من كتابتها هنا)
const catalog = [
  { 
    id: 'sofa-modern-01', 
    name: 'كنبة مودرن مريحة', 
    category: 'sofas', 
    fabric: 'كتان',
    image: '/products/sofa001.png' 
  },
  { 
    id: 'sofa-classic-02', 
    name: 'كنبة كلاسيكية', 
    category: 'sofas', 
    fabric: 'مخمل',
    image: '/products/sofa002.png' 
  },
  { 
    id: 'table-wood-01', 
    name: 'طاولة وسط', 
    category: 'tables', 
    material: 'خشب جوز',
    image: '/products/table001.png' 
  }
];

// مسار لجلب كل المنتجات
router.get('/list', (req, res) => {
  try {
    res.json({ success: true, count: catalog.length, products: catalog });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب قائمة المنتجات.' });
  }
});

export default router;
