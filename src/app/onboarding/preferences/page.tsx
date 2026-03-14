"use client";

import { useEffect, useState } from "react";
import { FieldLabel, PageShell, PrimaryButton, SecondaryLink, SelectInput, TextArea, TextInput } from "@/components/shell";

type PreferenceForm = {
  targetGender: string;
  relationshipGoal: string;
  ageMin: string;
  ageMax: string;
  cityPreference: string;
  acceptLongDistance: string;
  acceptRelocateToQidong: string;
  preferredHometown: string;
  acceptedMaritalStatuses: string[];
  acceptPartnerWithChildren: string;
  educationPreference: string;
  incomePreference: string;
  housingPreference: string;
  carPreference: string;
  partnerKeywords: string;
  dailyActive: boolean;
};

function parseStructuredPreference(raw: string | null | undefined) {
  if (!raw) {
    return {
      marriageIntent: "",
      acceptLongDistance: "",
      acceptRelocateToQidong: "",
      preferredHometown: "",
      acceptedMaritalStatuses: [] as string[],
      acceptPartnerWithChildren: "",
      educationPreference: "",
      incomePreference: "",
      housingPreference: "",
      carPreference: "",
      partnerKeywords: "",
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      marriageIntent: parsed.marriageIntent ?? "",
      acceptLongDistance: parsed.acceptLongDistance ?? "",
      acceptRelocateToQidong: parsed.acceptRelocateToQidong ?? "",
      preferredHometown: parsed.preferredHometown ?? "",
      acceptedMaritalStatuses: Array.isArray(parsed.acceptedMaritalStatuses) ? parsed.acceptedMaritalStatuses : [],
      acceptPartnerWithChildren: parsed.acceptPartnerWithChildren ?? "",
      educationPreference: parsed.educationPreference ?? "",
      incomePreference: parsed.incomePreference ?? "",
      housingPreference: parsed.housingPreference ?? "",
      carPreference: parsed.carPreference ?? "",
      partnerKeywords: parsed.partnerKeywords ?? "",
    };
  } catch {
    return {
      marriageIntent: "",
      acceptLongDistance: "",
      acceptRelocateToQidong: "",
      preferredHometown: "",
      acceptedMaritalStatuses: [] as string[],
      acceptPartnerWithChildren: "",
      educationPreference: "",
      incomePreference: "",
      housingPreference: "",
      carPreference: "",
      partnerKeywords: raw ?? "",
    };
  }
}

const maritalStatusOptions = ["未婚", "离异未育", "离异有子女", "丧偶"];

export default function OnboardingPreferencesPage() {
  const [form, setForm] = useState<PreferenceForm>({
    targetGender: "",
    relationshipGoal: "",
    ageMin: "",
    ageMax: "",
    cityPreference: "",
    acceptLongDistance: "",
    acceptRelocateToQidong: "",
    preferredHometown: "",
    acceptedMaritalStatuses: [],
    acceptPartnerWithChildren: "",
    educationPreference: "",
    incomePreference: "",
    housingPreference: "",
    carPreference: "",
    partnerKeywords: "",
    dailyActive: true,
  });
  const [status, setStatus] = useState("读取中...");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const res = await fetch("/api/me/preferences");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `preferences failed: ${res.status}`);

        if (data?.preference) {
          const extra = parseStructuredPreference(data.preference.relationshipGoal);
          setForm({
            targetGender: data.preference.targetGender ?? "",
            relationshipGoal: data.preference.partnerExpectation ?? extra.marriageIntent ?? data.preference.relationshipGoal ?? "",
            ageMin: data.preference.ageMin?.toString?.() ?? "",
            ageMax: data.preference.ageMax?.toString?.() ?? "",
            cityPreference: data.preference.preferredCities ?? data.preference.cityPreference ?? "",
            acceptLongDistance: data.preference.acceptLongDistance ?? extra.acceptLongDistance,
            acceptRelocateToQidong: data.preference.acceptRelocateToQidong ?? extra.acceptRelocateToQidong,
            preferredHometown: data.preference.preferredHometown ?? extra.preferredHometown,
            acceptedMaritalStatuses: data.preference.acceptedMaritalStatuses ?? extra.acceptedMaritalStatuses,
            acceptPartnerWithChildren: data.preference.acceptPartnerWithChildren ?? extra.acceptPartnerWithChildren,
            educationPreference: data.preference.minEducation ?? extra.educationPreference,
            incomePreference: data.preference.minIncomeLevel ?? extra.incomePreference,
            housingPreference: data.preference.preferredHousingStatus ?? extra.housingPreference,
            carPreference: data.preference.preferredCarStatus ?? extra.carPreference,
            partnerKeywords: data.preference.partnerExpectation ?? extra.partnerKeywords,
            dailyActive: data.preference.dailyActive ?? data.preference.weeklyActive ?? true,
          });
        }
        setStatus("已连接本地 API");
      } catch (err) {
        setError(err instanceof Error ? err.message : "读取择偶要求失败");
        setStatus("加载失败");
      }
    };
    void load();
  }, []);

  const updateForm = (patch: Partial<PreferenceForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const toggleAcceptedMaritalStatus = (value: string) => {
    setForm((prev) => ({
      ...prev,
      acceptedMaritalStatuses: prev.acceptedMaritalStatuses.includes(value)
        ? prev.acceptedMaritalStatuses.filter((item) => item !== value)
        : [...prev.acceptedMaritalStatuses, value],
    }));
  };

  const save = async () => {
    try {
      setError("");
      setStatus("保存中...");
      const payload = {
        targetGender: form.targetGender,
        relationshipGoal: JSON.stringify({
          marriageIntent: form.relationshipGoal,
          acceptLongDistance: form.acceptLongDistance,
          acceptRelocateToQidong: form.acceptRelocateToQidong,
          preferredHometown: form.preferredHometown,
          acceptedMaritalStatuses: form.acceptedMaritalStatuses,
          acceptPartnerWithChildren: form.acceptPartnerWithChildren,
          educationPreference: form.educationPreference,
          incomePreference: form.incomePreference,
          housingPreference: form.housingPreference,
          carPreference: form.carPreference,
          partnerKeywords: form.partnerKeywords,
        }),
        ageMin: form.ageMin,
        ageMax: form.ageMax,
        cityPreference: form.cityPreference,
        preferredCities: form.cityPreference,
        acceptLongDistance: form.acceptLongDistance,
        acceptRelocateToQidong: form.acceptRelocateToQidong,
        preferredHometown: form.preferredHometown,
        acceptedMaritalStatuses: form.acceptedMaritalStatuses,
        acceptPartnerWithChildren: form.acceptPartnerWithChildren,
        minEducation: form.educationPreference,
        minIncomeLevel: form.incomePreference,
        preferredHousingStatus: form.housingPreference,
        preferredCarStatus: form.carPreference,
        partnerExpectation: form.partnerKeywords,
        dailyActive: form.dailyActive,
        weeklyActive: form.dailyActive,
      };
      const res = await fetch("/api/me/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `save failed: ${res.status}`);
      setStatus("择偶要求已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存择偶要求失败");
      setStatus("保存失败");
    }
  };

  return (
    <PageShell
      title="Step 2 · 启海择偶要求"
      description="告诉系统你想进入什么样的启海婚恋关系，以及你接受什么样的婚配画像。"
      backHref="/onboarding/profile"
      backLabel="返回相亲资料"
    >
      <div className="mb-6 rounded-3xl border border-black/5 bg-[#f8f1ea] p-5 text-sm leading-7 text-[#6a5a54]">
        择偶要求不等于无限加条件，而是明确真正影响启东本地长期婚恋决策的核心维度：是否接受异地、是否接受未来回启东发展、婚姻情况、子女情况以及长期安家预期。
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <FieldLabel>目标性别</FieldLabel>
          <SelectInput value={form.targetGender} onChange={(e) => updateForm({ targetGender: e.target.value })}>
            <option value="">请选择</option>
            <option value="男">男</option>
            <option value="女">女</option>
            <option value="不限">不限</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>婚恋目标</FieldLabel>
          <SelectInput value={form.relationshipGoal} onChange={(e) => updateForm({ relationshipGoal: e.target.value })}>
            <option value="">请选择</option>
            <option value="以结婚为前提认真接触">以结婚为前提认真接触</option>
            <option value="半年内明确是否适合结婚">半年内明确是否适合结婚</option>
            <option value="先深入了解，再决定婚期规划">先深入了解，再决定婚期规划</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>可接受最小年龄</FieldLabel>
          <TextInput value={form.ageMin} onChange={(e) => updateForm({ ageMin: e.target.value })} placeholder="例如 25" />
        </label>

        <label className="block">
          <FieldLabel>可接受最大年龄</FieldLabel>
          <TextInput value={form.ageMax} onChange={(e) => updateForm({ ageMax: e.target.value })} placeholder="例如 33" />
        </label>

        <label className="block md:col-span-2">
          <FieldLabel>城市要求</FieldLabel>
          <TextInput value={form.cityPreference} onChange={(e) => updateForm({ cityPreference: e.target.value })} placeholder="例如 启东 / 南通 / 上海，能接受后续同城安家" />
        </label>

        <label className="block">
          <FieldLabel>是否接受异地</FieldLabel>
          <SelectInput value={form.acceptLongDistance} onChange={(e) => updateForm({ acceptLongDistance: e.target.value })}>
            <option value="">请选择</option>
            <option value="接受异地，但需以结婚落地为前提">接受异地，但需以结婚落地为前提</option>
            <option value="仅接受长三角范围异地">仅接受长三角范围异地</option>
            <option value="优先同城或启东周边">优先同城或启东周边</option>
            <option value="不接受异地">不接受异地</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>是否接受未来回启东发展</FieldLabel>
          <SelectInput value={form.acceptRelocateToQidong} onChange={(e) => updateForm({ acceptRelocateToQidong: e.target.value })}>
            <option value="">请选择</option>
            <option value="接受，并认可回启东长期发展">接受，并认可回启东长期发展</option>
            <option value="可以商量，视双方事业安排而定">可以商量，视双方事业安排而定</option>
            <option value="仅接受对方目前已在启东或南通">仅接受对方目前已在启东或南通</option>
            <option value="不接受回启东发展安排">不接受回启东发展安排</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>是否偏好启东 / 南通本地</FieldLabel>
          <SelectInput value={form.preferredHometown} onChange={(e) => updateForm({ preferredHometown: e.target.value })}>
            <option value="">请选择</option>
            <option value="优先启东本地">优先启东本地</option>
            <option value="优先南通地区">优先南通地区</option>
            <option value="江浙沪都可以，是否合适更重要">江浙沪都可以，是否合适更重要</option>
            <option value="无特别籍贯偏好">无特别籍贯偏好</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>是否接受对方有子女</FieldLabel>
          <SelectInput value={form.acceptPartnerWithChildren} onChange={(e) => updateForm({ acceptPartnerWithChildren: e.target.value })}>
            <option value="">请选择</option>
            <option value="接受">接受</option>
            <option value="视具体情况而定">视具体情况而定</option>
            <option value="仅接受对方无共同生活子女">仅接受对方无共同生活子女</option>
            <option value="不接受">不接受</option>
          </SelectInput>
        </label>

        <div className="block md:col-span-2">
          <FieldLabel>可接受婚姻状态</FieldLabel>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {maritalStatusOptions.map((option) => {
              const checked = form.acceptedMaritalStatuses.includes(option);
              return (
                <label
                  key={option}
                  className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[#faf7f3] px-4 py-4 text-sm text-[#5f514c]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAcceptedMaritalStatus(option)}
                    className="h-4 w-4 rounded border-black/20"
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </div>

        <label className="block">
          <FieldLabel>学历要求</FieldLabel>
          <SelectInput value={form.educationPreference} onChange={(e) => updateForm({ educationPreference: e.target.value })}>
            <option value="">请选择</option>
            <option value="大专及以上">大专及以上</option>
            <option value="本科及以上">本科及以上</option>
            <option value="硕士及以上">硕士及以上</option>
            <option value="看重人不唯学历">看重人不唯学历</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>收入要求</FieldLabel>
          <SelectInput value={form.incomePreference} onChange={(e) => updateForm({ incomePreference: e.target.value })}>
            <option value="">请选择</option>
            <option value="稳定即可">稳定即可</option>
            <option value="年收入15万以上">年收入15万以上</option>
            <option value="年收入30万以上">年收入30万以上</option>
            <option value="双方匹配更重要">双方匹配更重要</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>住房要求</FieldLabel>
          <SelectInput value={form.housingPreference} onChange={(e) => updateForm({ housingPreference: e.target.value })}>
            <option value="">请选择</option>
            <option value="已购房更好">已购房更好</option>
            <option value="有明确购房计划">有明确购房计划</option>
            <option value="不强制">不强制</option>
          </SelectInput>
        </label>

        <label className="block">
          <FieldLabel>车辆要求</FieldLabel>
          <SelectInput value={form.carPreference} onChange={(e) => updateForm({ carPreference: e.target.value })}>
            <option value="">请选择</option>
            <option value="已购车更方便">已购车更方便</option>
            <option value="有购车计划即可">有购车计划即可</option>
            <option value="不强制">不强制</option>
          </SelectInput>
        </label>

        <label className="block md:col-span-2">
          <FieldLabel>想找什么样的对象 / 择偶关键词</FieldLabel>
          <TextArea
            value={form.partnerKeywords}
            onChange={(e) => updateForm({ partnerKeywords: e.target.value })}
            className="min-h-32"
            placeholder="例如：三观稳定、愿意沟通、尊重家庭责任、能认真推进婚期规划，对启东或周边安家有共识"
          />
        </label>
      </div>

      <label className="mt-5 flex items-center gap-3 rounded-2xl border border-black/5 bg-[#faf7f3] px-4 py-4 text-sm text-[#5f514c]">
        <input
          type="checkbox"
          checked={form.dailyActive}
          onChange={(e) => updateForm({ dailyActive: e.target.checked })}
          className="h-4 w-4 rounded border-black/20"
        />
        <span>加入每日婚恋推荐池</span>
      </label>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-[#7a6a64]">{status}</div>
          {error ? <div className="mt-2 text-sm text-[#b24d57]">{error}</div> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={save}>保存择偶要求</PrimaryButton>
          <SecondaryLink href="/onboarding/survey">下一步：婚恋问卷</SecondaryLink>
        </div>
      </div>
    </PageShell>
  );
}
