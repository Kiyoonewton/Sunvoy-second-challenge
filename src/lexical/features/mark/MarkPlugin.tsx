'use client'
// src/lexical/features/mark/MarkPlugin.tsx
import React, { useCallback, useEffect, useState } from 'react'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  TextFormatType,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'

// Add mark as a custom text format
const IS_MARK = 1 << 11 // Use an unused bit for the mark format

export function MarkPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Add CSS for marked text
    const style = document.createElement('style')
    style.textContent = `
      .lexical-mark {
        background-color: #ffeb3b;
        color: #000;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    return mergeRegister(
      // Override the text node to support mark format
      editor.registerNodeTransform('text', (node) => {
        if ($isTextNode(node)) {
          const format = node.getFormat()
          if (format & IS_MARK) {
            node.setFormat(format)
          }
        }
      }),
      
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (format: TextFormatType) => {
          if (format === 'mark') {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              const nodes = selection.getNodes()
              const isMarkActive = nodes.some(node => {
                if ($isTextNode(node)) {
                  return (node.getFormat() & IS_MARK) !== 0
                }
                return false
              })

              nodes.forEach(node => {
                if ($isTextNode(node)) {
                  const currentFormat = node.getFormat()
                  if (isMarkActive) {
                    // Remove mark format
                    node.setFormat(currentFormat & ~IS_MARK)
                  } else {
                    // Add mark format
                    node.setFormat(currentFormat | IS_MARK)
                  }
                }
              })
            }
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor])

  return null
}

// Helper hook to check if mark is active
export function useMarkActive(): boolean {
  const [editor] = useLexicalComposerContext()
  const [isActive, setIsActive] = useState(false)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const nodes = selection.getNodes()
      const hasMarkFormat = nodes.some(node => {
        if ($isTextNode(node)) {
          return (node.getFormat() & IS_MARK) !== 0
        }
        return false
      })
      setIsActive(hasMarkFormat)
    }
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),
    )
  }, [editor, updateToolbar])

  return isActive
}