"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolInput } from "@/lib/schema/tool-schema";

interface InputFactoryProps {
  input: ToolInput;
  value: any;
  onChange: (val: any) => void;
}

function getOptionLabel(opt: string | { label: string; score?: number }): string {
  return typeof opt === "string" ? opt : opt.label;
}

function getOptionValue(opt: string | { label: string; score?: number }): string {
  return typeof opt === "string" ? opt : opt.label;
}

const inputClasses = `
  w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/90
  text-sm text-slate-800 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400
  hover:border-slate-300 transition-all duration-200 shadow-sm
`.trim();

const labelClasses = "block text-sm font-semibold text-slate-700 mb-2 leading-snug";

export function InputFactory({ input, value, onChange }: InputFactoryProps) {
  const displayLabel = input.question || input.label || input.name;

  switch (input.type) {
    case "text":
      return (
        <div>
          <label htmlFor={input.name} className={labelClasses}>
            {displayLabel}
            {input.required && <span className="text-violet-500 ml-1">*</span>}
          </label>
          <input
            id={input.name}
            type="text"
            placeholder={input.placeholder}
            required={input.required}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
          />
        </div>
      );

    case "number":
      return (
        <div>
          <label htmlFor={input.name} className={labelClasses}>
            {displayLabel}
            {input.required && <span className="text-violet-500 ml-1">*</span>}
          </label>
          <input
            id={input.name}
            type="number"
            placeholder={input.placeholder}
            required={input.required}
            value={value || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
            className={inputClasses}
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          <label htmlFor={input.name} className={labelClasses}>
            {displayLabel}
            {input.required && <span className="text-violet-500 ml-1">*</span>}
          </label>
          <textarea
            id={input.name}
            placeholder={input.placeholder}
            required={input.required}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className={`${inputClasses} resize-none min-h-[110px]`}
          />
        </div>
      );

    case "select":
      return (
        <div>
          <label htmlFor={input.name} className={labelClasses}>
            {displayLabel}
            {input.required && <span className="text-violet-500 ml-1">*</span>}
          </label>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger
              id={input.name}
              className="w-full rounded-xl border-slate-200 bg-white/90 text-sm text-slate-800 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 hover:border-slate-300 shadow-sm h-11"
            >
              <SelectValue placeholder="Sélectionner une réponse..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              {input.options?.map((opt) => {
                const label = getOptionLabel(opt);
                const val = getOptionValue(opt);
                return (
                  <SelectItem
                    key={val}
                    value={val}
                    className="text-sm cursor-pointer rounded-lg focus:bg-violet-50 focus:text-violet-800"
                  >
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      );

    default:
      return null;
  }
}
