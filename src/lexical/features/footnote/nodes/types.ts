import type { SerializedElementNode, SerializedLexicalNode, Spread } from 'lexical'
import type { JsonValue } from 'payload'

export type FootnoteFields = {
  content: JsonValue // Rich text content for the footnote
  number: number // Footnote number
}

export type SerializedFootnoteNode<T extends SerializedLexicalNode = SerializedLexicalNode> = Spread<
  {
    fields: FootnoteFields
    id: string
    type: 'footnote'
  },
  SerializedElementNode<T>
>