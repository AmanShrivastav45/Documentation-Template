// Registry passed to MDXProvider: maps markdown elements to styled components
// so every doc gets them with zero imports. Custom components (Tabs, Callout,
// PieChart, Card…) are imported by docs explicitly.
import type { ComponentPropsWithoutRef } from "react";
import type { MDXComponents } from "mdx/types";
import { A, H1, H2, H3, H4, HR, LI, OL, P, UL } from "@/components/mdx/Typography";
import { Table, TBody, Td, Th, THead } from "@/components/mdx/Table";
import InlineCode from "@/components/mdx/InlineCode";
import CodeBlock from "@/components/mdx/CodeBlock";
import { Callout } from "@/components/mdx/Callout";

function Blockquote(props: ComponentPropsWithoutRef<"blockquote">) {
  return <Callout type="info">{props.children}</Callout>;
}

export const mdxComponents: MDXComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
  a: A,
  ul: UL,
  ol: OL,
  li: LI,
  hr: HR,
  table: Table,
  thead: THead,
  tbody: TBody,
  th: Th,
  td: Td,
  pre: CodeBlock,
  code: InlineCode,
  blockquote: Blockquote,
};
