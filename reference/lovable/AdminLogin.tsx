import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const { user, login } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  if (user) return <Navigate to={user.role === "ADMIN" ? "/admin/menu" : "/staff/orders"} replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(phone, password);
    if (ok) {
      toast({ title: "Đăng nhập thành công", description: "Chào mừng trở lại!" });
      navigate("/staff/orders");
    } else {
      toast({ title: "Sai thông tin đăng nhập", description: "Vui lòng kiểm tra lại SĐT và mật khẩu", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/40 via-background to-secondary/20 px-4">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-xl border border-border p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍵</div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Matcha Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Đăng nhập nội bộ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="09xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>

          <Button type="submit" className="w-full rounded-xl h-11 mt-2">
            Đăng nhập
          </Button>
        </form>

        <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
          Demo: <span className="font-mono">0900000001 / admin</span> hoặc <span className="font-mono">0900000002 / staff</span>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
