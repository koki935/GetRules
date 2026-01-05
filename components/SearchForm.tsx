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
      className="space-y-4 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm"
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wide text-sky-600">SEARCH</p>
        <h2 className="text-xl font-semibold text-slate-900">法令名で検索</h2>
        <p className="text-sm text-slate-500">
          キーワードは部分一致でヒットします。空欄で検索すると全法令を一覧表示できます。
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="lawName" className="sr-only">
            法令名
          </label>
          <input
            id="lawName"
            type="text"
            value={values.lawName}
            onChange={(event) => setValues({ lawName: event.target.value })}
            placeholder="例：会社法、消費税、独占禁止"
            autoComplete="off"
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-sky-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSearching}
        >
          {isSearching ? "検索中..." : "検索"}
        </button>
      </div>
    </form>
  );
}

