import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const steps = [
  {
    title: "建立你的婚恋资料",
    description: "填写结构化资料、择偶要求与问卷，让系统先理解你的婚配条件，而不是先让你刷无穷无尽的人。",
  },
  {
    title: "每天只给一个更适合结婚的人",
    description: "不是无限滑动，而是控制节奏，把注意力放在真正值得认真了解的婚恋对象身上。",
  },
  {
    title: "带着婚配解释开始交流",
    description: "你会看到这次推荐为什么成立，用更低噪音的方式进入一段以结婚为目标的认真关系。",
  },
];

const principles = [
  "不靠刷脸上瘾机制，而靠资料完整度和问卷信号提升婚配质量。",
  "控制频率，减少信息过载，让每次推荐都更值得认真看。",
  "先帮助用户理解彼此为什么适合进入婚恋关系，再决定是否继续深入接触。",
];

const faqs = [
  {
    question: "和普通交友软件有什么不同？",
    answer:
      "Date Match 不追求让你一直刷，而是先收集足够信息，再用更克制的节奏给出更少但更有解释性的婚恋推荐。",
  },
  {
    question: "为什么是每天一次推荐？",
    answer:
      "因为婚恋质量通常来自注意力，而不是数量。降低噪音，才能让用户真正看完资料、理解对方并认真决定是否继续。",
  },
  {
    question: "必须先做问卷吗？",
    answer:
      "是。问卷不是装饰，而是婚恋匹配引擎的重要输入。没有这些信息，系统给出的结果只会退化成随机推荐。",
  },
];

export default async function Home() {
  const currentUser = await getCurrentUser();

  return (
    <main className="min-h-screen bg-[#f6efe7] text-[#201a17]">
      <section className="relative overflow-hidden border-b border-black/5 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(246,239,231,0.92)_45%,_rgba(236,224,214,0.9))]">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(183,110,121,0.2),_transparent_60%)]" />
        <div className="mx-auto flex min-h-[84vh] max-w-7xl flex-col px-6 py-6 lg:px-10">
          <header className="relative z-10 flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#8b5e63]">Qihai Date Match</p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-[1.7rem]">为启海单身男女设计的本地婚恋推荐</h1>
            </div>

            <div />
          </header>

          <div className="relative z-10 grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-[#b67a84]/20 bg-white/70 px-4 py-2 text-sm text-[#8b5e63] shadow-sm backdrop-blur">
                启海本地婚恋平台，不是随便聊聊，是认真奔着结婚去。
              </div>

              <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                少一点无效社交，
                <br />
                多一点适合启海婚恋。
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5a4b46] sm:text-xl">
                面向启东、海门及在外发展的启海单身男女，填写相亲资料、完成婚恋问卷后，每天收到一位更适合认真接触的人。平台不仅给结果，还会告诉你们为什么可能适合走向婚姻。
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                {currentUser ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="rounded-full bg-[#2b211f] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#1f1715]"
                    >
                      继续我的流程
                    </Link>
                    <Link
                      href="/match/current"
                      className="rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-medium text-[#322824] transition hover:bg-white"
                    >
                      查看今日推荐
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/signup"
                      className="rounded-full bg-[#2b211f] px-8 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(43,33,31,0.18)] transition hover:bg-[#1f1715]"
                    >
                      开始启海相亲匹配
                    </Link>
                    <Link
                      href="#how-it-works"
                      className="rounded-full border border-[#2b211f]/15 bg-white px-8 py-4 text-base font-semibold text-[#322824] shadow-sm transition hover:bg-[#fffaf6]"
                    >
                      看看怎么运作
                    </Link>
                  </>
                )}
              </div>

            </div>

            <div className="relative">
              <div className="absolute -left-6 top-8 h-32 w-32 rounded-full bg-[#b67a84]/20 blur-3xl" />
              <div className="absolute -right-8 bottom-8 h-36 w-36 rounded-full bg-[#d8b08c]/25 blur-3xl" />

              <div className="relative rounded-[36px] border border-black/5 bg-white/85 p-7 shadow-[0_34px_90px_rgba(77,55,44,0.14)] backdrop-blur lg:p-8">
                <div className="rounded-[32px] bg-[#231b19] p-7 text-white lg:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-white/45">今日推荐</p>
                      <h3 className="mt-3 text-3xl font-semibold lg:text-[2rem]">Lin · 27</h3>
                      <p className="mt-2 text-base leading-7 text-white/65">
                        启海老乡 / 杭州工作 / 本科 / 以结婚为目标认真接触。
                      </p>
                    </div>
                    <div className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/75">89 分</div>
                  </div>

                  <div className="mt-7 grid gap-4">
                    <div className="rounded-2xl bg-white/8 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/40">为什么推荐</p>
                      <p className="mt-2 text-base leading-7 text-white/80">
                        你们都偏好稳定长期关系，同样和启海有强连接，且在沟通风格上都更重视坦诚、边界感与家庭责任。
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/40">建议开场</p>
                      <p className="mt-2 text-base leading-7 text-white/80">
                        “如果把未来三年的婚姻规划拆成三件最重要的事，你会先排哪三件？”
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#8b5e63]">How it works</p>
          <h3 className="mt-4 text-3xl font-semibold sm:text-4xl">把相亲产品从“刷”变回“筛选”。</h3>
          <p className="mt-4 text-base leading-7 text-[#6a5a54] sm:text-lg">
            Qihai Date Match 的重点不是让你停留更久，而是让你更快抵达更高质量、更适合结婚的启海婚恋连接。
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2b211f] text-sm font-semibold text-white">
                0{index + 1}
              </div>
              <h4 className="mt-5 text-xl font-semibold">{step.title}</h4>
              <p className="mt-3 text-sm leading-7 text-[#6a5a54]">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] bg-[#2b211f] p-8 text-white shadow-[0_24px_60px_rgba(40,25,20,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/45">Why this works</p>
            <h3 className="mt-4 text-3xl font-semibold">更像一个婚配筛选系统，而不是注意力赌场。</h3>
            <div className="mt-8 space-y-4">
              {principles.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/75">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-black/5 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#8b5e63]">FAQ</p>
            <h3 className="mt-4 text-3xl font-semibold">你最可能在意的几个问题。</h3>

            <div className="mt-8 space-y-4">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-black/5 bg-[#faf7f3] p-5">
                  <h4 className="text-base font-semibold">{faq.question}</h4>
                  <p className="mt-2 text-sm leading-7 text-[#6a5a54]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/5 bg-[#efe5dc]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#8b5e63]">Ready</p>
            <h3 className="mt-3 text-3xl font-semibold sm:text-4xl">如果你想认真结婚，就从认真填写自己开始。</h3>
            <p className="mt-4 text-base leading-7 text-[#6a5a54]">
              先完成相亲资料和问卷，再进入每日婚恋推荐。少一点无效社交，多一点真正值得投入的关系机会。
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href={currentUser ? "/dashboard" : "/auth/signup"}
              className="rounded-full bg-[#2b211f] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#1f1715]"
            >
              {currentUser ? "继续完善资料" : "创建账号开始匹配"}
            </Link>
            <Link
              href={currentUser ? "/match/current" : "/auth/signin"}
              className="rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-medium text-[#322824] transition hover:bg-white"
            >
              {currentUser ? "查看今日推荐" : "我已经有账号"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
