"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldLabel, PageShell, PrimaryButton, SecondaryLink, TextInput } from "@/components/shell";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@datematch.local");
  const [password, setPassword] = useState("demo12345");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      setError("");
      setStatus("登录中...");
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `signin failed: ${res.status}`);
      setStatus("登录成功，正在跳转...");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
      setStatus("登录失败");
    }
  };

  return (
    <PageShell
      title="欢迎回来"
      description="先用邮箱和密码进入系统。当前 MVP 已经支持安全 session，后面再继续补 magic link 和 OAuth。"
      backHref="/"
      backLabel="返回首页"
    >
      <div className="mx-auto max-w-md space-y-6">
        <div className="rounded-3xl border border-[#b67a84]/15 bg-[#f8efe8] p-4 text-sm leading-7 text-[#6b5651]">
          开发环境默认可用演示账号：
          <div className="mt-2 font-medium text-[#201a17]">demo@datematch.local / demo12345</div>
        </div>

        <label className="block">
          <FieldLabel>邮箱</FieldLabel>
          <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>

        <label className="block">
          <FieldLabel>密码</FieldLabel>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 8 位密码"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={submit}>登录</PrimaryButton>
          <SecondaryLink href="/auth/signup">创建账号</SecondaryLink>
        </div>

        <div className="space-y-2 text-sm">
          <div className="text-[#7a6a64]">{status}</div>
          {error ? <div className="text-[#b24d57]">{error}</div> : null}
        </div>

        <p className="text-sm text-[#7a6a64]">
          还没有账号？{" "}
          <Link href="/auth/signup" className="font-medium text-[#2b211f] underline-offset-4 hover:underline">
            立即注册
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
