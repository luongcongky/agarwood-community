import Link from "next/link"

export default function MembershipExpiredPage() {
  return (
    <div>
      <h1>Tư cách hội viên đã hết hạn</h1>
      <p>Vui lòng gia hạn để tiếp tục sử dụng các tính năng dành cho hội viên.</p>
      <Link href="/feed">Gia hạn ngay</Link>
    </div>
  )
}
