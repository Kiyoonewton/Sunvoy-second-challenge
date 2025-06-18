'use client'
// src/lexical/features/mark/client.tsx
import React, { useCallback, useEffect, useState } from 'react'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { SimplifiedMarkNode, $isSimplifiedMarkNode } from './SimplifiedMarkNode'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { 
  $getSelection, 
  $isRangeSelection,
  $isTextNode,
  $createTextNode,
  COMMAND_PRIORITY_LOW,
  createCommand,
  LexicalCommand,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHighlighter } from '@fortawesome/free-solid-svg-icons'

// Define mark format as bit 11 (2048)
const IS_MARK = 1 << 11 // 2048

// Create toggle mark command
export const TOGGLE_MARK_COMMAND: LexicalCommand<void> = createCommand('TOGGLE_MARK_COMMAND')

function MarkPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Add styles
    const styleId = 'lexical-mark-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        /* Legacy mark nodes */
        mark {
          background-color: #ffeb3b !important;
          color: #000 !important;
          padding: 0 2px;
          border-radius: 2px;
        }
        
        /* New format-based marks */
        .lexical-mark-format {
          background-color: #ffeb3b !important;
          color: #000 !important;
          padding: 0 2px;
          border-radius: 2px;
        }
      `
      document.head.appendChild(style)
    }

    return mergeRegister(
      // Handle the toggle command
      editor.registerCommand(
        TOGGLE_MARK_COMMAND,
        () => {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              const nodes = selection.extract()
              
              // Check if any node has mark format
              let hasMarkFormat = false
              nodes.forEach(node => {
                if ($isTextNode(node)) {
                  const format = node.getFormat()
                  if (format & IS_MARK) {
                    hasMarkFormat = true
                  }
                }
              })

              // Toggle mark format
              nodes.forEach(node => {
                if ($isTextNode(node)) {
                  const format = node.getFormat()
                  if (hasMarkFormat) {
                    node.setFormat(format & ~IS_MARK)
                  } else {
                    node.setFormat(format | IS_MARK)
                  }
                }
              })
            }
          })
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      
      // Convert legacy mark nodes to format-based marks
      editor.registerNodeTransform(SimplifiedMarkNode, (markNode) => {
        const children = markNode.getChildren()
        children.forEach(child => {
          if ($isTextNode(child)) {
            // Create new text node with mark format
            const newNode = $createTextNode(child.getTextContent())
            newNode.setFormat(child.getFormat() | IS_MARK)
            newNode.setDetail(child.getDetail())
            newNode.setMode(child.getMode())
            newNode.setStyle(child.getStyle())
            
            // Replace the mark node with the formatted text node
            markNode.insertBefore(newNode)
          }
        })
        markNode.remove()
      })
    )
  }, [editor])

  // Update DOM to show highlights
  useEffect(() => {
    return editor.registerMutationListener('text', (mutatedNodes) => {
      for (let [nodeKey, mutation] of mutatedNodes) {
        if (mutation === 'created' || mutation === 'updated') {
          editor.getEditorState().read(() => {
            const node = editor.getEditorState()._nodeMap.get(nodeKey)
            if ($isTextNode(node)) {
              const format = node.getFormat()
              const element = editor.getElementByKey(nodeKey)
              if (element) {
                if (format & IS_MARK) {
                  element.classList.add('lexical-mark-format')
                } else {
                  element.classList.remove('lexical-mark-format')
                }
              }
            }
          })
        }
      }
    })
  }, [editor])

  return null
}

function MarkToolbarButton() {
  const [editor] = useLexicalComposerContext()
  const [isActive, setIsActive] = useState(false)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const nodes = selection.getNodes()
      const hasMarkFormat = nodes.some(node => {
        // Check for legacy mark nodes
        if ($isSimplifiedMarkNode(node) || $isSimplifiedMarkNode(node.getParent())) {
          return true
        }
        // Check for new format-based marks
        if ($isTextNode(node)) {
          const format = node.getFormat()
          return (format & IS_MARK) !== 0
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

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    editor.dispatchCommand(TOGGLE_MARK_COMMAND, undefined)
  }, [editor])

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`toolbar-item ${isActive ? 'active' : ''}`}
      aria-label="Toggle highlight"
      title="Highlight"
    >
      <FontAwesomeIcon icon={faHighlighter} />
    </button>
  )
}

const MarkFeatureClient = createClientFeature({
  key: 'mark',
  nodes: [SimplifiedMarkNode], // Use our simplified mark node
  plugins: [
    {
      Component: MarkPlugin,
      position: 'normal',
    },
  ],
  toolbarInline: {
    groups: [
      {
        key: 'mark',
        type: 'buttons',
        items: [
          {
            key: 'mark',
            label: 'Highlight',
            ChildComponent: MarkToolbarButton,
            order: 5,
          },
        ],
      },
    ],
  },
})

// export default MarkFeatureClient