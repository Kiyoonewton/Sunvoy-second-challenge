'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { mergeRegister } from '@lexical/utils'
import { 
  $getSelection, 
  $isRangeSelection, 
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND 
} from 'lexical'
import { useTranslation, EditIcon, CloseMenuIcon, formatDrawerSlug, useEditDepth } from '@payloadcms/ui'
import type { Data, FormState } from 'payload'

import { $isFootnoteNode, FootnoteNode } from '../../../../nodes/FootnoteNode.js'
import type { FootnoteFields } from '../../../../nodes/types.js'
import { TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND } from './commands.js'
import { FieldsDrawer, useEditorConfigContext, useLexicalDrawer } from '@payloadcms/richtext-lexical/client'

export function FootnoteEditor({ anchorElem }: { anchorElem: HTMLElement }): React.ReactNode {
  const [editor] = useLexicalComposerContext()
  const [footnoteNode, setFootnoteNode] = useState<FootnoteNode>()
  const [isFootnote, setIsFootnote] = useState(false)
  const editorRef = useRef<HTMLDivElement | null>(null)
  
  const { t } = useTranslation()
  const editDepth = useEditDepth()
  
  const {
    fieldProps: { schemaPath },
    uuid,
  } = useEditorConfigContext()

  const drawerSlug = formatDrawerSlug({
    slug: `lexical-rich-text-footnote-` + uuid,
    depth: editDepth,
  })

  const { toggleDrawer } = useLexicalDrawer(drawerSlug)

  const setNotFootnote = useCallback(() => {
    setIsFootnote(false)
    if (editorRef && editorRef.current) {
      editorRef.current.style.opacity = '0'
      editorRef.current.style.transform = 'translate(-10000px, -10000px)'
    }
    setFootnoteNode(undefined)
  }, [])

  const $updateFootnoteEditor = useCallback(() => {
    const selection = $getSelection()
    
    if (!$isRangeSelection(selection)) {
      setNotFootnote()
      return
    }

    const node = selection.anchor.getNode()
    const footnoteParent = node.getParent()
    
    if (!$isFootnoteNode(footnoteParent)) {
      setNotFootnote()
      return
    }

    setFootnoteNode(footnoteParent)
    setIsFootnote(true)

    // Position the floating editor
    const domRect = editor.getElementByKey(footnoteParent.getKey())?.getBoundingClientRect()
    if (domRect && editorRef.current) {
      editorRef.current.style.opacity = '1'
      editorRef.current.style.transform = `translate(${domRect.left}px, ${domRect.bottom + 10}px)`
    }
  }, [editor, setNotFootnote])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND,
        () => {
          toggleDrawer()
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateFootnoteEditor()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isFootnote) {
            setNotFootnote()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor, $updateFootnoteEditor, isFootnote, setNotFootnote, toggleDrawer])

  const stateData = footnoteNode ? {
    content: footnoteNode.getFields().content,
    number: footnoteNode.getFields().number,
  } : undefined

  return (
    <React.Fragment>
      <div className="footnote-editor" ref={editorRef}>
        <div className="footnote-preview">
          {footnoteNode && (
            <div className="footnote-content-preview">
              <span>Footnote {footnoteNode.getFields().number}</span>
              {/* Preview of footnote content would go here */}
            </div>
          )}
          
          {editor.isEditable() && (
            <div className="footnote-actions">
              <button
                aria-label="Edit footnote"
                className="footnote-edit"
                onClick={() => toggleDrawer()}
                type="button"
              >
                <EditIcon />
              </button>
              <button
                aria-label="Remove footnote"
                className="footnote-remove"
                onClick={() => {
                  if (footnoteNode) {
                    footnoteNode.remove()
                  }
                }}
                type="button"
              >
                <CloseMenuIcon />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <FieldsDrawer
        className="lexical-footnote-edit-drawer"
        data={stateData}
        drawerSlug={drawerSlug}
        drawerTitle="Edit Footnote"
        featureKey="footnote"
        handleDrawerSubmit={(fields: FormState, data: Data) => {
          const footnoteData = data as FootnoteFields
          if (footnoteNode) {
            footnoteNode.setFields(footnoteData)
          }
        }}
        schemaPath={schemaPath}
        schemaPathSuffix="fields"
      />
    </React.Fragment>
  )
}