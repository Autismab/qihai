import { SectionCard, PageShell } from "@/components/shell";
import { runRealBatchAction } from "@/app/admin/actions";
import { getAdminActionResult, getAdminSnapshot, requireAdminPageAccess } from "@/lib/admin";

export default async function AdminPage() {
  const adminUser = await requireAdminPageAccess();
  const [snapshot, actionResult] = await Promise.all([getAdminSnapshot(), getAdminActionResult()]);

  return (
    <PageShell
      title="Admin"
      description="最小可用管理台：可触发真实用户 batch，查看参与人数、生成 match 数和本轮结果预览。"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          当前 admin：{adminUser.nickname ?? adminUser.email}（保持现有最小 admin 权限模型，仅 demo admin 可访问）
        </div>

        {actionResult ? (
          <div
            className={`rounded-2xl border p-4 text-sm ${
              actionResult.type === "success"
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                : "border-rose-400/20 bg-rose-500/10 text-rose-100"
            }`}
          >
            <p className="font-medium">最近一次执行结果</p>
            <p className="mt-2">{actionResult.message}</p>
            <p className="mt-1 text-white/60">执行时间：{new Date(actionResult.at).toLocaleString("zh-CN")}</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <SectionCard title="当前批次">
            {snapshot.currentBatch ? (
              <div className="space-y-2">
                <p>dayKey：{snapshot.currentBatch.dayKey}</p>
                <p>batchId：{snapshot.currentBatch.id}</p>
                <p>创建时间：{snapshot.currentBatch.createdAtLabel}</p>
                <p>批次内 match 数：{snapshot.currentBatch.matchCount}</p>
              </div>
            ) : (
              <p>当前还没有任何 batch。</p>
            )}
          </SectionCard>

          <SectionCard title="当前最新 match">
            {snapshot.currentMatch ? (
              <div className="space-y-2">
                <p>matchId：{snapshot.currentMatch.id}</p>
                <p>状态：{snapshot.currentMatch.status}</p>
                <p>配对：{snapshot.currentMatch.pairLabel}</p>
                <p>分数：{snapshot.currentMatch.score}</p>
                <p>所属批次：{snapshot.currentMatch.dayKey}</p>
                <p>创建时间：{snapshot.currentMatch.createdAtLabel}</p>
                <p>投递时间：{snapshot.currentMatch.deliveredAtLabel}</p>
              </div>
            ) : (
              <p>当前还没有 match。</p>
            )}
          </SectionCard>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
          <SectionCard title="管理动作">
            <form action={runRealBatchAction} className="space-y-3">
              <p>基于当前真实用户、资料和偏好，执行一轮最小 batch 刷新。当前使用已有 matching engine 生成真实 match。</p>
              <button
                type="submit"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#24122d] hover:bg-white/90"
              >
                Run Real Match Batch
              </button>
            </form>
          </SectionCard>

          <SectionCard title="本轮 batch 结果">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">候选人数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{snapshot.latestBatchSummary.candidateCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">参与人数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{snapshot.latestBatchSummary.participantCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">生成 Match</p>
                <p className="mt-2 text-2xl font-semibold text-white">{snapshot.latestBatchSummary.matchCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">未匹配</p>
                <p className="mt-2 text-2xl font-semibold text-white">{snapshot.latestBatchSummary.unmatchedCount}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {snapshot.latestBatchSummary.previewMatches.length > 0 ? (
                snapshot.latestBatchSummary.previewMatches.map((match) => (
                  <div key={match.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="font-medium text-white">{match.pairLabel}</p>
                    <p className="mt-1 text-white/60">score：{match.score}</p>
                  </div>
                ))
              ) : (
                <p>当前批次还没有生成 match，可直接点击左侧按钮执行。</p>
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="状态汇总">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(snapshot.statusMap).map(([status, count]) => (
              <div key={status} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">{status}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{count}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
