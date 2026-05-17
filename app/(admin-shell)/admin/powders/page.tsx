import { Metadata } from "next";
import AdminPowderPage from "@/src/views/admin/AdminPowderPage";

export const metadata: Metadata = {
  title: "Quản lý bột | Bánh Cá Bốn Mùa",
  description: "Trang quản lý danh mục bột cho Admin.",
};

export default function AdminPowdersRoute() {
  return <AdminPowderPage />;
}
