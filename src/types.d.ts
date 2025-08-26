declare namespace Woocer {
  export interface User {
    address?: string;
    createdDate?: string;
    deviceModel?: string;
    email?: string;
    notificationEnabled?: boolean;
    firebaseNotificationToken?: string;
    oneSignalPlayerId?: string;
    webhookSecretKey?: string;
    firstInstallAppVersion?: string;
    forceLogout?: boolean;
    imageProfile?: string;
    lastEntered?: string;
    latestInstallAppVersion?: string;
    notificationSound?: string;
    name?: string;
    osType?: string;
    osVersion?: string;
    paidUser?: boolean | 'yes' | 'no';
    uid?: string;
    orderAlarm?: boolean;
  }
  export interface OrderCreatedDetail {
    orderId: number;
    orderTotal: string;
  }
  export interface OrderUpdatedDetail {
    orderId: number;
    orderStatus: Woocommerce.Order['status'];
  }
  export interface OrderCreatedNotifPayload {
    type: 'order';
    pushId: string;
    orderId: number;
  }
  export interface OrderUpdatedNotifPayload {
    type: 'order';
    pushId: string;
    orderId: number;
  }
  export interface Template {
    id: string;
    headings: { [key: string]: string };
    contents: { [key: string]: string };
  }
}
declare namespace Woocommerce {
  export interface MetaData {
    id: number;
    key: string;
    value: string;
  }
  export interface Tax {
    id: number;
    rate_code: string;
    rate_id: string;
    label: string;
    compound: boolean;
    tax_total: string;
    shipping_tax_total: string;
    meta_data: MetaData[];
  }
  export interface CouponLine {
    id: number;
    code: string;
    discount: string;
    discount_tax: string;
    meta_data: MetaData[];
  }
  export interface Refund {
    id: number;
    reason: string;
    total: string;
  }
  export interface FeeLine {
    id: number;
    name: string;
    tax_class: string;
    tax_status: string;
    total: string;
    total_tax: string;
    taxes: Tax[];
    meta_data: MetaData[];
  }
  export interface Order {
    id: number;
    parent_id: number;
    number: string;
    order_key: string;
    created_via: string;
    version: string;
    status:
      | 'pending'
      | 'processing'
      | 'on-hold'
      | 'completed'
      | 'cancelled'
      | 'refunded'
      | 'failed'
      | 'trash';
    currency: string;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    discount_total: string;
    discount_tax: string;
    shipping_total: string;
    shipping_tax: string;
    cart_tax: string;
    total: string;
    total_tax: string;
    prices_include_tax: boolean;
    customer_id: number;
    customer_ip_address: string;
    customer_user_agent: string;
    customer_note: string;
    billing: {
      first_name: string;
      last_name: string;
      company: string;
      address_1: string;
      address_2: string;
      city: string;
      state: string;
      postcode: string;
      country: string;
      email: string;
      phone: string;
    };
    shipping: {
      first_name: string;
      last_name: string;
      company: string;
      address_1: string;
      address_2: string;
      city: string;
      state: string;
      postcode: string;
      country: string;
    };
    payment_method: string;
    payment_method_title: string;
    transaction_id: string;
    date_paid: string;
    date_paid_gmt: string;
    date_completed: string;
    date_completed_gmt: string;
    cart_hash: string;
    meta_data: MetaData[];
    line_items: {
      id: number;
      name: string;
      product_id: number;
      variation_id: number;
      quantity: number;
      tax_class: string;
      subtotal: string;
      subtotal_tax: string;
      total: string;
      total_tax: string;
      taxes: Tax[];
      meta_data: MetaData[];
      sku: string;
      price: number;
    }[];
    tax_lines: {
      id: number;
      rate_code: string;
      rate_id: number;
      label: string;
      compound: boolean;
      tax_total: string;
      shipping_tax_total: string;
      meta_data: MetaData[];
    }[];
    shipping_lines: {
      id: number;
      method_title: string;
      method_id: string;
      total: string;
      total_tax: string;
      taxes: Tax[];
      meta_data: MetaData[];
    }[];
    fee_lines: FeeLine[];
    coupon_lines: CouponLine[];
    refunds: Refund[];
    _links: {
      self: {
        href: string;
      }[];
      collection: {
        href: string;
      }[];
    };
  }
  export interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    regular_price: string;
  }
}
