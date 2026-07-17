// Styled replacements for markdown text elements (headings, paragraphs,
// links, lists, divider), mapped in index.tsx. Sizes/colors inherit the
// Grafana-docs scale; body color comes from global.css so nesting can override.
import type { ComponentPropsWithoutRef } from "react";

export function H1(props: ComponentPropsWithoutRef<"h1">) {
  return <h1 className="mb-4 font-heading text-[34px] font-bold leading-tight" {...props} />;
}

export function H2(props: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className="mb-4 mt-10 border-b border-line pb-2 font-heading text-[26px] font-semibold dark:border-line-dark"
      {...props}
    />
  );
}

export function H3(props: ComponentPropsWithoutRef<"h3">) {
  return <h3 className="mb-3 mt-8 font-heading text-[20px] font-semibold" {...props} />;
}

export function H4(props: ComponentPropsWithoutRef<"h4">) {
  return <h4 className="mb-2 mt-6 font-heading text-[17px] font-semibold" {...props} />;
}

export function P(props: ComponentPropsWithoutRef<"p">) {
  return <p className="my-4 leading-[1.7]" {...props} />;
}

export function A(props: ComponentPropsWithoutRef<"a">) {
  return <a className="text-accent hover:underline dark:text-accent-dark" {...props} />;
}

export function UL(props: ComponentPropsWithoutRef<"ul">) {
  return <ul className="my-4 list-disc space-y-1.5 pl-6 leading-[1.7]" {...props} />;
}

export function OL(props: ComponentPropsWithoutRef<"ol">) {
  return <ol className="my-4 list-decimal space-y-1.5 pl-6 leading-[1.7]" {...props} />;
}

export function LI(props: ComponentPropsWithoutRef<"li">) {
  return <li className="pl-1" {...props} />;
}

export function HR(props: ComponentPropsWithoutRef<"hr">) {
  return <hr className="my-8 border-line dark:border-line-dark" {...props} />;
}
