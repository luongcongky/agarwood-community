import { permanentRedirect } from "next/navigation"

// Legacy route — renamed to /san-pham-doanh-nghiep with new semantics
// (all products, certified prioritized).
export default function FeaturedProductsLegacyPage() {
  permanentRedirect("/san-pham-doanh-nghiep")
}
