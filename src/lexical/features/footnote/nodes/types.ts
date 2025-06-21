import type { SerializedElementNode, SerializedLexicalNode, Spread } from 'lexical'
import type { JsonValue } from 'payload'

export type FootnoteFields = {
  content: JsonValue
  number: number
  [key: string]: JsonValue 
}

export type SerializedFootnoteNode<T extends SerializedLexicalNode = SerializedLexicalNode> = Spread<
  {
    fields: FootnoteFields
    id: string
    type: 'footnote'
  },
  SerializedElementNode<T>
>