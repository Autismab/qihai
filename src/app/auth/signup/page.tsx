"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldLabel, PageShell, PrimaryButton, SecondaryLink, TextInput } from "@/components/shell";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      setError("");
      setStatus("创建账号中...");
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nickname, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `signup failed: ${res.status}`);
      setStatus("账号已创建，正在进入 onboarding...");
      router.push("/onboarding/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
      setStatus("注册失败");
    }
  };

  return (
    <PageShell
      title="创建你的账号"
      description="先建立一个最小但正式的身份：邮箱唯一、密码哈希存储，成功后自动进入 onboarding。"
      backHref="/"
      backLabel="返回首页"
    >
      <div className="mx-auto max-w-md space-y-6">
        <label className="block">
          <FieldLabel>邮箱</FieldLabel>
          <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>

        <label className="block">
          <FieldLabel>昵称</FieldLabel>
          <TextInput value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="你的显示名称" />
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
          <PrimaryButton onClick={submit}>创建账号</PrimaryButton>
          <SecondaryLink href="/auth/signin">去登录</SecondaryLink>
        </div>

        <div className="space-y-2 text-sm">
          <div className="text-[#7a6a64]">{status}</div>
          {error ? <div className="text-[#b24d57]">{error}</div> : null}
        </div>

        <p className="text-sm text-[#7a6a64]">
          已有账号？{" "}
          <Link href="/auth/signin" className="font-medium text-[#2b211f] underline-offset-4 hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
