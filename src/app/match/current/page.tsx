import Link from "next/link";
import { PageShell, SecondaryLink, SectionCard } from "@/components/shell";
import { ensureInitializedCurrentUser } from "@/lib/user-init";
import { getCurrentMatchForUser } from "@/lib/match-service";

function formatAge(birthYear: number | null | undefined) {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
}

function scoreLabel(score: number) {
  if (score >= 85) return "高契合";
  if (score >= 70) return "值得认真了解";
  return "有潜力继续观察";
}

function buildIcebreakers(name: string) {
  return [
    `如果今天只安排一次见面，你最想怎么开始认识 ${name}？`,
    `看到这次婚恋推荐解释后，你最想先确认的一点是什么？`,
    `如果把理想婚姻拆成三个关键词，你会先说哪三个？`,
  ];
}

function parseStructuredBio(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      height?: string;
      weight?: string;
      education?: string;
      income?: string;
      housing?: string;
      car?: string;
      marriageGoal?: string;
      partnerExpectation?: string;
    };
  } catch {
    return null;
  }
}

export default async function CurrentMatchPage() {
  const user = await ensureInitializedCurrentUser();
  const result = await getCurrentMatchForUser(user.id);

  if (!result?.match) {
    return (
      <PageShell
        title="今日启海婚恋推荐"
        description="当前页面只读取当前用户已有的真实 match 数据；如果为空，说明今天尚未生成结果。"
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard title="今日暂无启海推荐">
            <div className="space-y-3 text-sm">
              <p>系统还没有为你生成今天的推荐结果。</p>
              <p>你可以先补完相亲资料、保持每日推荐开启，下一次批次生成后这里会自动展示真实数据。</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <SecondaryLink href="/dashboard">返回启海婚恋概览</SecondaryLink>
              <SecondaryLink href="/onboarding/survey">继续完善问卷</SecondaryLink>
            </div>
          </SectionCard>

          <SectionCard title="想更快进入推荐池？">
            <ul className="list-disc space-y-2 pl-5">
              <li>补全性别、出生年、工作城市等基础相亲资料</li>
              <li>明确你的婚恋目标、年龄范围和城市要求</li>
              <li>完成问卷，让系统有足够信号做判断</li>
              <li>确认“每日推荐”开关保持开启</li>
            </ul>
          </SectionCard>
        </div>
      </PageShell>
    );
  }

  const { match } = result;
  const partner = match.partner;
  const age = formatAge(partner.profile?.birthYear);
  const icebreakers = buildIcebreakers(partner.nickname);
  const structuredBio = parseStructuredBio(partner.profile?.bio);

  return (
    <PageShell
      title="今日启海婚恋推荐"
      description="这不是随机刷到的人，而是系统基于资料、择偶要求和问卷信号筛出来的一位启海婚配候选对象。"
    >
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[30px] bg-[#231b19] p-6 text-white shadow-[0_24px_60px_rgba(40,25,20,0.18)] sm:p-7">
          <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">QIHAI DAILY MATCH</p>
              <h2 className="mt-3 text-3xl font-semibold">{partner.nickname}</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {partner.profile?.workCity ?? partner.profile?.city ?? "工作城市暂未填写"}
                {age ? ` · ${age} 岁` : " · 年龄暂未填写"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <div className="text-xs uppercase tracking-[0.24em] text-white/40">Match Score</div>
              <div className="mt-2 text-3xl font-semibold">{match.score}</div>
              <div className="mt-1 text-sm text-white/60">{scoreLabel(match.score)}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">推荐批次</p>
              <p className="mt-2 text-sm font-medium text-white/85">{match.dayKey ?? match.weekKey}</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">当前状态</p>
              <p className="mt-2 text-sm font-medium text-white/85">已送达今日推荐</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">节奏建议</p>
              <p className="mt-2 text-sm font-medium text-white/85">先看婚配信息，再决定是否继续</p>
            </div>
          </div>

          <div className="mt-6 rounded-[26px] bg-white/8 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">TA 的婚配资料摘要</p>
            <div className="mt-3 grid gap-2 text-sm leading-7 text-white/82 sm:grid-cols-2">
              <div>性别：{partner.profile?.gender ?? "未填写"}</div>
              <div>学历：{structuredBio?.education ?? "未填写"}</div>
              <div>身高：{structuredBio?.height ? `${structuredBio.height} cm` : "未填写"}</div>
              <div>体重：{structuredBio?.weight ? `${structuredBio.weight} kg` : "未填写"}</div>
              <div>收入：{structuredBio?.income ?? "未填写"}</div>
              <div>住房：{structuredBio?.housing ?? "未填写"}</div>
              <div>车辆：{structuredBio?.car ?? "未填写"}</div>
              <div>婚恋定位：{structuredBio?.marriageGoal ?? "未填写"}</div>
            </div>
          </div>
        </section>

        <SectionCard title="为什么你们适合进一步了解">
          {match.explanationItems.length > 0 ? (
            <ul className="list-disc space-y-3 pl-5">
              {match.explanationItems.map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>系统已生成推荐，但解释文案暂未就绪。</p>
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="开始交流前，先看这几个问题">
          <div className="space-y-3">
            {icebreakers.map((item) => (
              <div key={item} className="rounded-2xl border border-black/5 bg-white px-4 py-4">
                {item}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="下一步建议">
          <div className="space-y-4">
            <div className="rounded-2xl border border-black/5 bg-white px-4 py-4">
              <p className="font-medium text-[#201a17]">1. 先看婚配解释，不要只看分数</p>
              <p className="mt-2 text-sm leading-7 text-[#6a5a54]">
                分数只代表系统判断的整体契合度，真正值得你认真看的，是为什么这次推荐成立。
              </p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white px-4 py-4">
              <p className="font-medium text-[#201a17]">2. 用一个具体婚恋问题开场</p>
              <p className="mt-2 text-sm leading-7 text-[#6a5a54]">
                比起“你好”，更好的方式是围绕婚恋目标、生活节奏或某条推荐解释展开第一句。
              </p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white px-4 py-4">
              <p className="font-medium text-[#201a17]">3. 先确认长期关系基础是否一致</p>
              <p className="mt-2 text-sm leading-7 text-[#6a5a54]">
                先确认价值观、婚期规划和家庭观是否接近，再决定是否交换更多联系方式。
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <SecondaryLink href="/dashboard">返回婚恋概览</SecondaryLink>
            <Link
              href="/onboarding/profile"
              className="rounded-full bg-[#2b211f] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1f1715]"
            >
              优化我的资料
            </Link>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
