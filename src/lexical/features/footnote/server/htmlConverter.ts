import { HTMLConverter } from "@payloadcms/richtext-lexical";
import { SerializedLexicalNode } from "lexical";

type SerializedFootnoteNode = {
  type: 'footnote';
  fields?: {
    number?: number;
    content?: any;
  };
} & SerializedLexicalNode;

export const footnoteHTMLConverter: HTMLConverter<SerializedFootnoteNode> = {
  nodeTypes: ['footnote'],
  converter: async ({ node }) => {
    const number = node.fields?.number;
    if (!number) return '';

    return `<sup id="fnref-${number}"><a href="#fn-${number}">${number}</a></sup>`;
  },
};
