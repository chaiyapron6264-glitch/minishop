import { ProductDetailView } from "@/components/product-detail-view";

export default async function ProductDetailPage({
  params,
}: PageProps<"/product/[id]">) {
  const { id } = await params;
  return <ProductDetailView productId={id} />;
}
