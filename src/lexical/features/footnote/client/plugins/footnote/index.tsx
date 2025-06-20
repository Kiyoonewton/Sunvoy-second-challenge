'use client'
// import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { mergeRegister } from '@lexical/utils'
import { COMMAND_PRIORITY_LOW } from 'lexical'
import { useEffect } from 'react'
// import { FootnoteNode, TOGGLE_FOOTNOTE_COMMAND, $insertFootnote } from '../../../nodes/FootnoteNode.js'
import { ClientProps } from '../../index'
import { PluginComponent } from '@payloadcms/richtext-lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertFootnote, FootnoteNode, TOGGLE_FOOTNOTE_COMMAND } from '../../../nodes/FootnoteNode'

// Global footnote counter - in a real implementation, this should come from editor state
let footnoteCounter = 1

export const FootnotePlugin: PluginComponent<ClientProps> = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([FootnoteNode])) {
      throw new Error('FootnotePlugin: FootnoteNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand(
        TOGGLE_FOOTNOTE_COMMAND,
        (payload) => {
          if (payload) {
            // Assign the next footnote number
            payload.fields.number = footnoteCounter++
            $insertFootnote(payload)
          }
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor])

  return null
}