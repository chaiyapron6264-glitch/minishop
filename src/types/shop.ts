export type ProductStatus = "active" | "draft" | "sold_out";
export type OrderStatus = "pending" | "paid" | "shipping" | "completed";

export type Product = {
  id: string;
  shopId?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  sold: number;
  status: ProductStatus;
  isActive?: boolean;
  createdAt?: string;
};

export type Order = {
  id: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
};
