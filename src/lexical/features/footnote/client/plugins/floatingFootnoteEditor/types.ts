import { FootnoteFields } from "../../../nodes/types"

export type FootnotePayload = {
  fields: FootnoteFields
  footnoteId?: string | null
} | null