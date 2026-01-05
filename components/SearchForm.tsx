"use client";

import { useEffect, useState } from "react";
export interface SearchFormValues {
  lawName: string;
}

interface SearchFormProps {
  defaultValues?: SearchFormValues;
  isSearching?: boolean;
  onSubmit: (values: SearchFormValues) => void;
}

const emptyForm: SearchFormValues = {
  lawName: "",
};

export default function SearchForm({
  defaultValues = emptyForm,
  isSearching,
  onSubmit,
}: SearchFormProps) {
  const [values, setValues] = useState<SearchFormValues>(defaultValues);

  useEffect(() => {
    setValues(defaultValues);
  }, [defaultValues]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500">検索条件</p>
        <h2 className="text-xl font-semibold text-slate-900">
          法令名（部分一致）
        </h2>
        <p className="text-xs text-slate-500">
          法令名だけを対象に検索します。部分一致でヒットします。
        </p>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            法令名
          </label>
          <input
            type="text"
            value={values.lawName}
            onChange={(event) => setValues({ lawName: event.target.value })}
            placeholder="例: 会社法、個人情報保護"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSearching}
        >
          {isSearching ? "検索中..." : "検索"}
        </button>
      </div>
    </form>
  );
}
