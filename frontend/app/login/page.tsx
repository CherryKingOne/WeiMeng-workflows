import { redirect } from "next/navigation";

export default function LoginPage() {
  // 当前项目还没有登录流程，先统一回到项目管理首页，避免误入 404。
  redirect("/");
}
