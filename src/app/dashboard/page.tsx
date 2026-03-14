import Link from "next/link";
import { PageShell, SecondaryLink, SectionCard } from "@/components/shell";
import { getDashboardSnapshot } from "@/lib/dashboard";

function toneClassName(tone: "ready" | "idle" | "error") {
  if (tone === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "error") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-black/10 bg-[#f7f1eb] text-[#5f514c]";
}

export default async function DashboardPage() {
  const data = await getDashboardSnapshot();

  return (
    <PageShell
      title="你的启海婚恋概览"
      description="这里汇总当前用户的启海相亲资料完成度、择偶要求状态、入池条件和今日推荐结果。"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <SectionCard title="资料完成度">
          <div className="text-3xl font-semibold text-[#201a17]">{data.profileCompletion}%</div>
          <p className="mt-2">{data.profileStatus}</p>
        </SectionCard>
        <SectionCard title="择偶要求状态">
          <div className="text-3xl font-semibold text-[#201a17]">{data.preferenceCompletion}%</div>
          <p className="mt-2">{data.preferenceStatus}</p>
        </SectionCard>
        <SectionCard title="问卷完成度">
          <div className="text-3xl font-semibold text-[#201a17]">{data.surveyCompletion}%</div>
          <p className="mt-2">{data.surveyStatus}</p>
        </SectionCard>
        <SectionCard title="总体进度">
          <div className="text-3xl font-semibold text-[#201a17]">{data.overallCompletion}%</div>
          <p className="mt-2">完成资料、择偶要求、问卷三段后，系统才能稳定输出每日婚恋推荐。</p>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <SectionCard title="入池状态">
          <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClassName(data.poolTone)}`}>{data.poolStatus}</div>
          <div className="mt-4 grid gap-2 text-xs text-[#7a6a64]">
            <div>性别：{data.metrics.gender}</div>
            <div>工作城市：{data.metrics.city}</div>
            <div>目标对象：{data.metrics.target}</div>
            <div>婚恋目标：{data.metrics.relationshipGoal}</div>
            <div>
              问卷：{data.metrics.surveyAnswered}/{data.metrics.surveyTotal}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="今日启海推荐">
          <p>{data.currentMatchSummary}</p>
          <div className="mt-4">
            <SecondaryLink href="/match/current">查看今日启海推荐</SecondaryLink>
          </div>
        </SectionCard>

        <SectionCard title="下一步动作">
          {data.nextActions.length > 0 ? (
            <ul className="list-disc space-y-2 pl-5">
              {data.nextActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>所有关键步骤已完成，可以等待今日推荐结果。</p>
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SectionCard title="快速入口">
          <div className="flex flex-wrap gap-3">
            <SecondaryLink href="/onboarding/profile">编辑相亲资料</SecondaryLink>
            <SecondaryLink href="/onboarding/preferences">编辑择偶要求</SecondaryLink>
            <SecondaryLink href="/onboarding/survey">完成婚恋问卷</SecondaryLink>
          </div>
        </SectionCard>

        <SectionCard title="系统说明">
          <p>
            Dashboard 现在基于统一用户初始化逻辑读取当前用户，并通过 <code>/api/me/dashboard</code> 输出真实聚合数据。
            前端话术已切换为严肃婚恋语境，底层匹配逻辑暂保持最小兼容。
          </p>
        </SectionCard>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/match/current" className="rounded-full bg-[#2b211f] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1f1715]">
          查看今日推荐
        </Link>
      </div>
    </PageShell>
  );
}
