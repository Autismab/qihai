"use client";

import { useEffect, useState } from "react";
import { PageShell, PrimaryButton, SecondaryLink, SectionCard, SelectInput } from "@/components/shell";

type Question = { id: string; prompt: string; orderIndex: number };

const options = ["非常同意", "比较同意", "中立", "比较不同意", "非常不同意"];

export default function OnboardingSurveyPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("读取中...");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const res = await fetch("/api/me/survey");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `survey failed: ${res.status}`);

        setQuestions(data.questions ?? []);
        const answerMap: Record<string, string> = {};
        for (const item of data.answers ?? []) answerMap[item.questionId] = item.answer;
        setAnswers(answerMap);
        setStatus("问卷已加载");
      } catch (err) {
        setError(err instanceof Error ? err.message : "问卷加载失败");
        setStatus("加载失败");
      }
    };
    void load();
  }, []);

  const save = async () => {
    try {
      setError("");
      setStatus("保存中...");
      const res = await fetch("/api/me/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? "中立", score: 3 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `save failed: ${res.status}`);
      setStatus("问卷已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存问卷失败");
      setStatus("保存失败");
    }
  };

  return (
    <PageShell
      title="Step 3 · 婚恋问卷"
      description="问卷不是装饰，它决定了匹配引擎能否理解你的婚恋偏好、沟通方式和长期关系节奏。"
      backHref="/onboarding/preferences"
      backLabel="返回择偶要求"
    >
      <div className="mb-6 rounded-3xl border border-black/5 bg-[#f8f1ea] p-5 text-sm leading-7 text-[#6a5a54]">
        这一页只负责读取和保存答案。初始化和题库准备已经统一放到服务端，不再依赖页面手动 bootstrap。
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <SectionCard key={question.id} title={`Q${index + 1}`}>
            <p className="mb-4">{question.prompt}</p>
            <SelectInput
              value={answers[question.id] ?? "中立"}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectInput>
          </SectionCard>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-[#7a6a64]">{status}</div>
          {error ? <div className="mt-2 text-sm text-[#b24d57]">{error}</div> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={save}>保存问卷</PrimaryButton>
          <SecondaryLink href="/dashboard">进入婚恋概览</SecondaryLink>
        </div>
      </div>
    </PageShell>
  );
}
