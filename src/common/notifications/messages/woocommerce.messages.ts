import { NotificationTemplate } from './index';

export const WOOCOMMERCE_MESSAGES: NotificationTemplate = {
  // Order notifications
  'order.created': {
    en: {
      content: 'New order #{orderId} has been created',
      heading: 'New Order',
    },
    fa: {
      content: 'سفارش جدید شماره {orderId} ایجاد شد',
      heading: 'سفارش جدید',
    },
    ar: {
      content: 'تم إنشاء طلب جديد رقم {orderId}',
      heading: 'طلب جديد',
    },
  },

  'order.updated': {
    en: {
      content: 'Order #{orderId} has been updated',
      heading: 'Order Update',
    },
    fa: {
      content: 'سفارش شماره {orderId} به‌روزرسانی شد',
      heading: 'به‌روزرسانی سفارش',
    },
    ar: {
      content: 'تم تحديث الطلب رقم {orderId}',
      heading: 'تحديث الطلب',
    },
  },

  'order.completed': {
    en: {
      content: 'Order #{orderId} has been completed successfully',
      heading: 'Order Completed',
    },
    fa: {
      content: 'سفارش شماره {orderId} با موفقیت تکمیل شد',
      heading: 'سفارش تکمیل شد',
    },
    ar: {
      content: 'تم إكمال الطلب رقم {orderId} بنجاح',
      heading: 'تم إكمال الطلب',
    },
  },

  'order.cancelled': {
    en: {
      content: 'Order #{orderId} has been cancelled',
      heading: 'Order Cancelled',
    },
    fa: {
      content: 'سفارش شماره {orderId} لغو شد',
      heading: 'سفارش لغو شد',
    },
    ar: {
      content: 'تم إلغاء الطلب رقم {orderId}',
      heading: 'تم إلغاء الطلب',
    },
  },

  'order.refunded': {
    en: {
      content: 'Order #{orderId} has been refunded',
      heading: 'Order Refunded',
    },
    fa: {
      content: 'سفارش شماره {orderId} بازپرداخت شد',
      heading: 'بازپرداخت سفارش',
    },
    ar: {
      content: 'تم استرداد الطلب رقم {orderId}',
      heading: 'تم الاسترداد',
    },
  },

  'order.failed': {
    en: {
      content: 'Order #{orderId} payment failed',
      heading: 'Payment Failed',
    },
    fa: {
      content: 'پرداخت سفارش شماره {orderId} ناموفق بود',
      heading: 'پرداخت ناموفق',
    },
    ar: {
      content: 'فشل دفع الطلب رقم {orderId}',
      heading: 'فشل الدفع',
    },
  },

  'order.processing': {
    en: {
      content: 'Order #{orderId} is now being processed',
      heading: 'Order Processing',
    },
    fa: {
      content: 'سفارش شماره {orderId} در حال پردازش است',
      heading: 'پردازش سفارش',
    },
    ar: {
      content: 'جاري معالجة الطلب رقم {orderId}',
      heading: 'معالجة الطلب',
    },
  },

  'order.on-hold': {
    en: {
      content: 'Order #{orderId} is on hold',
      heading: 'Order On Hold',
    },
    fa: {
      content: 'سفارش شماره {orderId} در انتظار است',
      heading: 'سفارش در انتظار',
    },
    ar: {
      content: 'الطلب رقم {orderId} معلق',
      heading: 'طلب معلق',
    },
  },

  // Product notifications
  'product.created': {
    en: {
      content: 'New product "{productName}" has been added',
      heading: 'New Product',
    },
    fa: {
      content: 'محصول جدید "{productName}" اضافه شد',
      heading: 'محصول جدید',
    },
    ar: {
      content: 'تمت إضافة منتج جديد "{productName}"',
      heading: 'منتج جديد',
    },
  },

  'product.updated': {
    en: {
      content: 'Product "{productName}" has been updated',
      heading: 'Product Update',
    },
    fa: {
      content: 'محصول "{productName}" به‌روزرسانی شد',
      heading: 'به‌روزرسانی محصول',
    },
    ar: {
      content: 'تم تحديث المنتج "{productName}"',
      heading: 'تحديث المنتج',
    },
  },

  'product.deleted': {
    en: {
      content: 'Product "{productName}" has been removed',
      heading: 'Product Removed',
    },
    fa: {
      content: 'محصول "{productName}" حذف شد',
      heading: 'محصول حذف شد',
    },
    ar: {
      content: 'تم حذف المنتج "{productName}"',
      heading: 'تم حذف المنتج',
    },
  },

  // Customer notifications
  'customer.created': {
    en: {
      content: 'New customer {customerName} has registered',
      heading: 'New Customer',
    },
    fa: {
      content: 'مشتری جدید {customerName} ثبت‌نام کرد',
      heading: 'مشتری جدید',
    },
    ar: {
      content: 'تم تسجيل عميل جديد {customerName}',
      heading: 'عميل جديد',
    },
  },

  // Coupon notifications
  'coupon.created': {
    en: {
      content: 'New coupon "{couponCode}" has been created',
      heading: 'New Coupon',
    },
    fa: {
      content: 'کوپن جدید "{couponCode}" ایجاد شد',
      heading: 'کوپن جدید',
    },
    ar: {
      content: 'تم إنشاء كوبون جديد "{couponCode}"',
      heading: 'كوبون جديد',
    },
  },

  'coupon.updated': {
    en: {
      content: 'Coupon "{couponCode}" has been updated',
      heading: 'Coupon Update',
    },
    fa: {
      content: 'کوپن "{couponCode}" به‌روزرسانی شد',
      heading: 'به‌روزرسانی کوپن',
    },
    ar: {
      content: 'تم تحديث الكوبون "{couponCode}"',
      heading: 'تحديث الكوبون',
    },
  },
};