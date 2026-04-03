import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { MediaOrderActionPanel } from "./MediaOrderActionPanel"

type Props = { params: Promise<{ id: string }> }

const SERVICE_LABELS: Record<string, string> = {
  ARTICLE_COMPANY: "Viết bài giới thiệu doanh nghiệp",
  ARTICLE_PRODUCT: "Viết bài giới thiệu sản phẩm",
  PRESS_RELEASE: "Thông cáo báo chí",
  SOCIAL_CONTENT: "Nội dung mạng xã hội",
}

export default async function MediaOrderDetailPage({ params }: Props) {
  const { id } = await params

  const order = await prisma.mediaOrder.findUnique({
    where: { id },
    include: {
      requester: { select: { name: true, email: true } },
    },
  })

  if (!order) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/truyen-thong"
          className="text-brand-600 hover:text-brand-800 text-sm"
        >
          &larr; Danh sách đơn
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-brand-900">
        Chi tiết đơn #{order.id.slice(-8).toUpperCase()}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left — details */}
        <div className="lg:col-span-3 space-y-5">
          {/* Requester info */}
          <section className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-brand-900">
              Thông tin người đặt
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Họ tên</p>
                <p className="font-medium">{order.requesterName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{order.requesterEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Điện thoại</p>
                <p className="font-medium">{order.requesterPhone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ngày đặt</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          </section>

          {/* Service details */}
          <section className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-brand-900">
              Chi tiết dịch vụ
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Loại dịch vụ</p>
                <p className="font-medium">
                  {SERVICE_LABELS[order.serviceType] ?? order.serviceType}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ngân sách</p>
                <p className="font-medium">{order.budget ?? "—"}</p>
              </div>
              {order.deadline && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Deadline mong muốn
                  </p>
                  <p className="font-medium">
                    {new Date(order.deadline).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              )}
              {order.targetKeywords && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">
                    Từ khoá SEO mục tiêu
                  </p>
                  <p className="font-medium">{order.targetKeywords}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Yêu cầu</p>
              <p className="rounded-lg bg-brand-50 p-3 text-sm whitespace-pre-wrap">
                {order.requirements}
              </p>
            </div>

            {order.referenceUrls && order.referenceUrls.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  URL tham khảo
                </p>
                <ul className="space-y-1">
                  {order.referenceUrls.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 underline hover:text-brand-800"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Delivery info */}
          {order.deliveryFileUrls && order.deliveryFileUrls.length > 0 && (
            <section className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-brand-900">
                File đã bàn giao
              </h2>
              <ul className="space-y-1">
                {order.deliveryFileUrls.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-600 underline hover:text-brand-800"
                    >
                      File {i + 1}
                    </a>
                  </li>
                ))}
              </ul>
              {order.deliveredAt && (
                <p className="text-xs text-muted-foreground">
                  Bàn giao lúc:{" "}
                  {new Date(order.deliveredAt).toLocaleString("vi-VN")}
                </p>
              )}
            </section>
          )}
        </div>

        {/* Right — action panel */}
        <div className="lg:col-span-2">
          <MediaOrderActionPanel
            orderId={order.id}
            initialStatus={order.status}
            initialAssignedTo={order.assignedTo}
            initialQuotedPrice={order.quotedPrice}
            initialInternalNote={order.internalNote}
            initialDeliveryFileUrls={order.deliveryFileUrls ?? []}
          />
        </div>
      </div>
    </div>
  )
}
