'use client'
import type { LexicalCommand } from 'lexical'
import { createCommand } from 'lexical'
import type { FootnotePayload } from '../types.js'

export const TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND: LexicalCommand<FootnotePayload | null> = createCommand(
  'TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND',
)