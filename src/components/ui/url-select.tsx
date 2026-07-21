"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, type SelectOption } from "./select";
import { montarUrl } from "@/lib/pagination";

export function UrlSelect({
  param,
  options,
  defaultValue = "todos",
  className,
  withAvatar,
}: {
  param: string;
  options: SelectOption[];
  defaultValue?: string;
  className?: string;
  withAvatar?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(param) ?? defaultValue;

  function onChange(novo: string) {
    router.replace(
      montarUrl(pathname, searchParams, {
        [param]: novo && novo !== defaultValue ? novo : null,
        page: null,
      }),
    );
  }

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      className={className}
      withAvatar={withAvatar}
    />
  );
}
