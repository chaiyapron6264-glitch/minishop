import type { Order, Product } from "@/types/shop";

export const products: Product[] = [
  {
    id: "green-tea-set",
    name: "ชาเขียวมัทฉะเซ็ต",
    description:
      "เซ็ตมัทฉะพร้อมแก้วสำหรับร้านเล็กที่อยากเพิ่มเมนูขายดี ถ่ายรูปสวยและชงง่าย",
    price: 390,
    imageUrl:
      "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80",
    category: "เครื่องดื่ม",
    stock: 24,
    sold: 138,
    status: "active",
  },
  {
    id: "linen-tote",
    name: "กระเป๋าผ้าลินิน",
    description:
      "กระเป๋าโทนธรรมชาติ ใช้ได้ทุกวัน น้ำหนักเบา เหมาะกับลูกค้าที่ชอบของเรียบง่าย",
    price: 290,
    imageUrl:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
    category: "แฟชั่น",
    stock: 17,
    sold: 94,
    status: "active",
  },
  {
    id: "ceramic-cup",
    name: "แก้วเซรามิกมินิมอล",
    description:
      "แก้วเซรามิกสีขาวทรงนุ่มมือ สำหรับกาแฟ ชา หรือของขวัญที่ดูอบอุ่น",
    price: 220,
    imageUrl:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
    category: "ของใช้",
    stock: 0,
    sold: 211,
    status: "sold_out",
  },
  {
    id: "desk-plant",
    name: "ต้นไม้ตั้งโต๊ะ",
    description:
      "ต้นไม้ขนาดเล็ก ดูแลง่าย เพิ่มความสดชื่นให้มุมทำงานและหน้าร้าน",
    price: 180,
    imageUrl:
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80",
    category: "แต่งบ้าน",
    stock: 35,
    sold: 67,
    status: "draft",
  },
];

export const orders: Order[] = [
  {
    id: "ORD-1048",
    customerName: "คุณมายด์",
    status: "paid",
    total: 680,
    itemCount: 2,
    createdAt: "วันนี้ 10:24",
  },
  {
    id: "ORD-1047",
    customerName: "คุณเจมส์",
    status: "shipping",
    total: 390,
    itemCount: 1,
    createdAt: "วันนี้ 09:12",
  },
  {
    id: "ORD-1046",
    customerName: "คุณฟ้า",
    status: "completed",
    total: 870,
    itemCount: 3,
    createdAt: "เมื่อวาน",
  },
];

export const getProducts = async () => products;

export const getProductById = async (id: string) =>
  products.find((product) => product.id === id);

export const getOrders = async () => orders;

export const getOrderById = async (id: string) =>
  orders.find((order) => order.id === id);

export const sellerStats = {
  revenue: products.reduce((sum, product) => sum + product.sold * product.price, 0),
  orders: orders.length,
  products: products.length,
  lowStock: products.filter((product) => product.stock > 0 && product.stock <= 20)
    .length,
};
