import { RoleNotificationCenter } from "@/components/common/RoleNotificationCenter";

export default function AdminNotificationCenterPage() {
  return (
    <RoleNotificationCenter
      role="admin"
      description="Notifikasi aktivitas sistem dan pengumuman resmi untuk admin."
    />
  );
}
