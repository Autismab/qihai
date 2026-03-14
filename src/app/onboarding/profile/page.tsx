"use client";

import { useEffect, useState } from "react";
import { FieldLabel, PageShell, PrimaryButton, SecondaryLink, SelectInput, TextArea, TextInput } from "@/components/shell";

type ProfileForm = {
  gender: string;
  birthYear: string;
  age: string;
  height: string;
  weight: string;
  education: string;
  income: string;
  workCity: string;
  maritalStatus: string;
  childrenStatus: string;
  hometown: string;
  currentCity: string;
  planReturnToQidong: string;
  housing: string;
  car: string;
  marriageGoal: string;
  partnerExpectation: string;
};

function deriveAge(birthYear: string) {
  const year = Number(birthYear);
  const currentYear = new Date().getFullYear();
  if (!year || Number.isNaN(year) || year < 1950 || year > currentYear) return "";
  return String(currentYear - year);
}

function parseStructuredProfile(raw: string | null | undefined) {
  if (!raw) {
    return {
      height: "",
      weight: "",
      education: "",
      income: "",
      maritalStatus: "",
      childrenStatus: "",
      hometown: "",
      currentCity: "",
      planReturnToQidong: "",
      housing: "",
      car: "",
      marriageGoal: "",
      partnerExpectation: "",
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      height: parsed.height ?? "",
      weight: parsed.weight ?? "",
      education: parsed.education ?? "",
      income: parsed.income ?? "",
      maritalStatus: parsed.maritalStatus ?? "",
      childrenStatus: parsed.childrenStatus ?? "",
      hometown: parsed.hometown ?? "",
      currentCity: parsed.currentCity ?? "",
      planReturnToQidong: parsed.planReturnToQidong ?? "",
      housing: parsed.housing ?? "",
      car: parsed.car ?? "",
      marriageGoal: parsed.marriageGoal ?? "",
      partnerExpectation: parsed.partnerExpectation ?? "",
    };
  } catch {
    return {
      height: "",
      weight: "",
      education: "",
      income: "",
      maritalStatus: "",
      childrenStatus: "",
      hometown: "",
      currentCity: "",
      planReturnToQidong: "",
      housing: "",
      car: "",
      marriageGoal: "",
      partnerExpectation: raw ?? "",
    };
  }
}

export default function OnboardingProfilePage() {
  const [form, setForm] = useState<ProfileForm>({
    gender: "",
    birthYear: "",
    age: "",
    height: "",
    weight: "",
    education: "",
    income: "",
    workCity: "",
    maritalStatus: "",
    childrenStatus: "",
    hometown: "",
    currentCity: "",
    planReturnToQidong: "",
    housing: "",
    car: "",
    marriageGoal: "",
    partnerExpectation: "",
  });
  const [status, setStatus] = useState("初始化中...");
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        setError("");
        const res = await fetch("/api/me/profile");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `profile failed: ${res.status}`);

        if (data?.profile || data?.user) {
          const extra = parseStructuredProfile(data.profile?.bio);
          const birthYear = data.profile?.birthYear?.toString?.() ?? "";
          setForm({
            gender: data.profile?.gender ?? "",
            birthYear,
            age: deriveAge(birthYear),
            height: data.profile?.heightCm?.toString?.() ?? extra.height,
            weight: data.profile?.weightKg?.toString?.() ?? extra.weight,
            education: data.profile?.education ?? extra.education,
            income: data.profile?.incomeLevel ?? extra.income,
            workCity: data.profile?.workCity ?? data.profile?.city ?? extra.currentCity ?? "",
            maritalStatus: data.profile?.maritalStatus ?? extra.maritalStatus,
            childrenStatus: data.profile?.childrenStatus ?? extra.childrenStatus,
            hometown: data.profile?.hometown ?? extra.hometown,
            currentCity: data.profile?.currentCity ?? data.profile?.city ?? extra.currentCity,
            planReturnToQidong: data.profile?.planReturnToQidong ?? extra.planReturnToQidong,
            housing: data.profile?.housingStatus ?? extra.housing,
            car: data.profile?.carStatus ?? extra.car,
            marriageGoal: data.profile?.partnerNote ?? extra.marriageGoal,
            partnerExpectation: extra.partnerExpectation,
          });
        }
        setStatus("已连接本地 API");
      } catch (err) {
        setError(err instanceof Error ? err.message : "读取资料失败");
        setStatus("加载失败");
      }
    };
    void init();
  }, []);

  const updateForm = (patch: Partial<ProfileForm>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (Object.prototype.hasOwnProperty.call(patch, "birthYear")) {
        next.age = deriveAge(next.birthYear);
      }
      return next;
    });
  };

  const save = async () => {
    try {
      setError("");
      setStatus("保存中...");
      const payload = {
        gender: form.gender,
        birthYear: form.birthYear,
        workCity: form.workCity,
        currentCity: form.currentCity,
        hometown: form.hometown,
        maritalStatus: form.maritalStatus,
        childrenStatus: form.childrenStatus,
        planReturnToQidong: form.planReturnToQidong,
        heightCm: form.height,
        weightKg: form.weight,
        education: form.education,
        incomeLevel: form.income,
        housingStatus: form.housing,
        carStatus: form.car,
        partnerNote: form.marriageGoal,
        bio: JSON.stringify({
          height: form.height,
          weight: form.weight,
          education: form.education,
          income: form.income,
          maritalStatus: form.maritalStatus,
          childrenStatus: form.childrenStatus,
          hometown: form.hometown,
          currentCity: form.currentCity,
          planReturnToQidong: form.planReturnToQidong,
          housing: form.housing,
          car: form.car,
          marriageGoal: form.marriageGoal,
          partnerExpectation: form.partnerExpectation,
        }),
      };
      const res = await fetch("/api/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `save failed: ${res.status}`);
      setStatus("资料已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存资料失败");
      setStatus("保存失败");
    }
  };

  return (
    <PageShell
      title="Step 1 · 启海相亲资料"
      description="先把你的启海婚恋资料结构化。页面优先服务认真相亲，而不是展示式交友。"
      backHref="/dashboard"
      backLabel="返回婚恋概览"
    >
      <div className="mb-6 rounded-3xl border border-black/5 bg-[#f8f1ea] p-5 text-sm leading-7 text-[#6a5a54]">
        这一步不再强调“我是谁”，而是建立可用于启东婚配判断的基础资料：年龄、学历、收入、婚姻情况、是否有子女、常住地与是否考虑回启东发展。
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <FieldLabel>性别</FieldLabel>
          <SelectInput value={form.gender} onChange={(e) => updateForm({ gender: e.target.value })}>
            <option value="">请选择</option>
            <option value="男">男</option>
            <option value="女">女</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>出生年</FieldLabel>
          <TextInput value={form.birthYear} onChange={(e) => updateForm({ birthYear: e.target.value })} placeholder="例如 1994" />
        </label>

        <label className="block">
          <FieldLabel>当前年龄</FieldLabel>
          <TextInput value={form.age} readOnly placeholder="根据出生年自动计算" className="bg-[#f5f1ed] text-[#7a6a64]" />
        </label>

        <label className="block">
          <FieldLabel>工作城市</FieldLabel>
          <TextInput value={form.workCity} onChange={(e) => updateForm({ workCity: e.target.value })} placeholder="例如 上海 / 苏州 / 启东" />
        </label>

        <label className="block">
          <FieldLabel>婚姻状态</FieldLabel>
          <SelectInput value={form.maritalStatus} onChange={(e) => updateForm({ maritalStatus: e.target.value })}>
            <option value="">请选择</option>
            <option value="未婚">未婚</option>
            <option value="离异未育">离异未育</option>
            <option value="离异有子女">离异有子女</option>
            <option value="丧偶">丧偶</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>子女情况</FieldLabel>
          <SelectInput value={form.childrenStatus} onChange={(e) => updateForm({ childrenStatus: e.target.value })}>
            <option value="">请选择</option>
            <option value="无子女">无子女</option>
            <option value="有子女共同生活">有子女共同生活</option>
            <option value="有子女不共同生活">有子女不共同生活</option>
            <option value="情况可详聊">情况可详聊</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>籍贯 / 老家</FieldLabel>
          <TextInput value={form.hometown} onChange={(e) => updateForm({ hometown: e.target.value })} placeholder="例如 江苏启东 / 南通海门" />
        </label>

        <label className="block">
          <FieldLabel>当前常住地</FieldLabel>
          <TextInput value={form.currentCity} onChange={(e) => updateForm({ currentCity: e.target.value })} placeholder="例如 启东市区 / 上海浦东" />
        </label>

        <label className="block md:col-span-2">
          <FieldLabel>是否计划回启东发展</FieldLabel>
          <SelectInput value={form.planReturnToQidong} onChange={(e) => updateForm({ planReturnToQidong: e.target.value })}>
            <option value="">请选择</option>
            <option value="是，明确计划回启东发展">是，明确计划回启东发展</option>
            <option value="可以考虑，需结合双方情况">可以考虑，需结合双方情况</option>
            <option value="暂不考虑回启东发展">暂不考虑回启东发展</option>
            <option value="目前就在启东发展">目前就在启东发展</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>身高（cm）</FieldLabel>
          <TextInput value={form.height} onChange={(e) => updateForm({ height: e.target.value })} placeholder="例如 172" />
        </label>

        <label className="block">
          <FieldLabel>体重（kg）</FieldLabel>
          <TextInput value={form.weight} onChange={(e) => updateForm({ weight: e.target.value })} placeholder="例如 58" />
        </label>

        <label className="block">
          <FieldLabel>学历</FieldLabel>
          <SelectInput value={form.education} onChange={(e) => updateForm({ education: e.target.value })}>
            <option value="">请选择</option>
            <option value="大专">大专</option>
            <option value="本科">本科</option>
            <option value="硕士">硕士</option>
            <option value="博士">博士</option>
            <option value="其他">其他</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>年收入</FieldLabel>
          <SelectInput value={form.income} onChange={(e) => updateForm({ income: e.target.value })}>
            <option value="">请选择</option>
            <option value="15万以下">15万以下</option>
            <option value="15-30万">15-30万</option>
            <option value="30-50万">30-50万</option>
            <option value="50万以上">50万以上</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>住房情况</FieldLabel>
          <SelectInput value={form.housing} onChange={(e) => updateForm({ housing: e.target.value })}>
            <option value="">请选择</option>
            <option value="已购房">已购房</option>
            <option value="有购房计划">有购房计划</option>
            <option value="租房">租房</option>
            <option value="与家人同住">与家人同住</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>车辆情况</FieldLabel>
          <SelectInput value={form.car} onChange={(e) => updateForm({ car: e.target.value })}>
            <option value="">请选择</option>
            <option value="已购车">已购车</option>
            <option value="有购车计划">有购车计划</option>
            <option value="暂无购车计划">暂无购车计划</option>
          </SelectInput>
        </label>

        <label className="block md:col-span-2">
          <FieldLabel>你适合什么婚配画像</FieldLabel>
          <TextArea
            value={form.marriageGoal}
            onChange={(e) => updateForm({ marriageGoal: e.target.value })}
            className="min-h-28"
            placeholder="例如：适合以结婚为目标、接受在启东或周边长期安家、愿意共同经营家庭的对象"
          />
        </label>

        <label className="block md:col-span-2">
          <FieldLabel>想找什么样的对象 / 择偶要求</FieldLabel>
          <TextArea
            value={form.partnerExpectation}
            onChange={(e) => updateForm({ partnerExpectation: e.target.value })}
            className="min-h-32"
            placeholder="请写清楚你对年龄、常住地、婚姻情况、是否接受回启东发展、家庭观与生活方式等核心要求"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-[#7a6a64]">{status}</div>
          {error ? <div className="mt-2 text-sm text-[#b24d57]">{error}</div> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={save}>保存资料</PrimaryButton>
          <SecondaryLink href="/onboarding/preferences">下一步：择偶要求</SecondaryLink>
        </div>
      </div>
    </PageShell>
  );
}
