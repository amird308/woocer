import { NotificationTemplate } from './index';

export const GENERAL_MESSAGES: NotificationTemplate = {
  // System notifications
  'system.maintenance': {
    en: {
      content: 'System maintenance scheduled for {date}',
      heading: 'Maintenance Notice',
    },
    fa: {
      content: 'تعمیرات سیستم برای تاریخ {date} برنامه‌ریزی شده',
      heading: 'اطلاعیه تعمیرات',
    },
    ar: {
      content: 'صيانة النظام مجدولة لتاريخ {date}',
      heading: 'إشعار الصيانة',
    },
  },

  'system.update': {
    en: {
      content: 'System has been updated with new features',
      heading: 'System Update',
    },
    fa: {
      content: 'سیستم با ویژگی‌های جدید به‌روزرسانی شد',
      heading: 'به‌روزرسانی سیستم',
    },
    ar: {
      content: 'تم تحديث النظام بميزات جديدة',
      heading: 'تحديث النظام',
    },
  },

  // Organization notifications
  'organization.member_added': {
    en: {
      content: '{memberName} has joined your organization',
      heading: 'New Team Member',
    },
    fa: {
      content: '{memberName} به سازمان شما پیوست',
      heading: 'عضو جدید تیم',
    },
    ar: {
      content: 'انضم {memberName} إلى منظمتك',
      heading: 'عضو فريق جديد',
    },
  },

  'organization.member_removed': {
    en: {
      content: '{memberName} has left your organization',
      heading: 'Team Member Left',
    },
    fa: {
      content: '{memberName} سازمان شما را ترک کرد',
      heading: 'عضو تیم خارج شد',
    },
    ar: {
      content: 'غادر {memberName} منظمتك',
      heading: 'غادر عضو الفريق',
    },
  },

  // Welcome messages
  'welcome.new_user': {
    en: {
      content: 'Welcome to our platform! Get started with your first order.',
      heading: 'Welcome!',
    },
    fa: {
      content: 'به پلتفرم ما خوش آمدید! با اولین سفارش خود شروع کنید.',
      heading: 'خوش آمدید!',
    },
    ar: {
      content: 'مرحباً بك في منصتنا! ابدأ بطلبك الأول.',
      heading: 'مرحباً!',
    },
  },

  // Error notifications
  'error.sync_failed': {
    en: {
      content: 'Data synchronization failed. Please try again.',
      heading: 'Sync Error',
    },
    fa: {
      content: 'همگام‌سازی داده‌ها ناموفق بود. لطفاً دوباره تلاش کنید.',
      heading: 'خطای همگام‌سازی',
    },
    ar: {
      content: 'فشلت مزامنة البيانات. يرجى المحاولة مرة أخرى.',
      heading: 'خطأ في المزامنة',
    },
  },
};