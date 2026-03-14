export function TextInput({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/75">{label}</span>
      <input
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 placeholder:text-white/30"
      />
    </label>
  );
}

export function SelectInput({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/75">{label}</span>
      <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none">
        {options.map((option) => (
          <option key={option} className="bg-[#1a1421]">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PrimaryButton({ children }: { children: React.ReactNode }) {
  return <button className="rounded-full bg-white px-5 py-3 text-sm font-medium text-[#24122d] hover:bg-white/90">{children}</button>;
}
