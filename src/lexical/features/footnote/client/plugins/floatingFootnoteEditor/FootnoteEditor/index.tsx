'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { mergeRegister } from '@lexical/utils'
import {
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_LOW,
} from 'lexical'
import { formatDrawerSlug, useEditDepth } from '@payloadcms/ui'
import type { Data, FormState } from 'payload'

import { FieldsDrawer, useEditorConfigContext, useLexicalDrawer } from '@payloadcms/richtext-lexical/client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isFootnoteNode } from '../../../../nodes/FootnoteNode'
import type { LexicalCommand } from 'lexical'
import { createCommand } from 'lexical'
import { FootnotePayload } from '../types'

export const TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND: LexicalCommand<FootnotePayload | null> = createCommand(
  'TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND',
)

import './index.scss'

export function FootnoteEditor({ anchorElem }: { anchorElem: HTMLElement }): React.ReactNode {
  const [editor] = useLexicalComposerContext()
  const [currentPreview, setCurrentPreview] = useState<HTMLElement | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [activeFootnoteId, setActiveFootnoteId] = useState<string | null>(null)

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

  const extractTextFromRichContent = (content: any): string => {
    if (!content || !content.root) return ''

    const extractText = (node: any): string => {
      if (node.type === 'text') {
        return node.text || ''
      }
      if (node.children && Array.isArray(node.children)) {
        return node.children.map((child: any) => extractText(child)).join('')
      }
      return ''
    }

    const text = extractText(content.root)
    return text.trim() || 'Click to add content...'
  }

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND,
        (payload) => {
          if (payload && payload.footnoteId) {
            setActiveFootnoteId(payload.footnoteId)
          } else {
            editor.getEditorState().read(() => {
              const allNodes = Array.from(editor.getEditorState()._nodeMap.values())
              const footnoteNodes = allNodes.filter(node =>
                node.getType && node.getType() === 'footnote'
              )

              if (footnoteNodes.length > 0) {
                const lastFootnote = footnoteNodes[footnoteNodes.length - 1]
                const footnoteId = lastFootnote.getKey()
                setActiveFootnoteId(footnoteId)
              }
            })
          }

          toggleDrawer()
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, toggleDrawer])

  const hidePreview = useCallback(() => {
    if (currentPreview) {
      currentPreview.remove()
      setCurrentPreview(null)
    }
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
  }, [currentPreview, hoverTimeout])

  const showPreview = useCallback((footnoteContainer: Element, footnoteNumber: string, footnoteId: string) => {
    hidePreview()

    const containerRect = footnoteContainer.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    let footnoteContentText = 'Click to add content...'

    editor.getEditorState().read(() => {
      let footnoteNode = $getNodeByKey(footnoteId)

      if (!$isFootnoteNode(footnoteNode)) {
        const editorState = editor.getEditorState()
        const allNodes = Array.from(editorState._nodeMap.values())
        const footnoteNodes = allNodes.filter(node =>
          node.getType && node.getType() === 'footnote'
        )

        footnoteNode = (footnoteNodes.find(node => {
          return $isFootnoteNode(node) && node.getFields().number === Number(footnoteNumber)
        }) ?? null) as typeof footnoteNode
      }

      if ($isFootnoteNode(footnoteNode)) {
        const fields = footnoteNode.getFields()
        if (fields.content) {
          footnoteContentText = extractTextFromRichContent(fields.content)
        }
      }
    })

    const previewElement = document.createElement('div')
    previewElement.id = `footnote-preview-${footnoteId}`

    const innerDiv = document.createElement('div')
    innerDiv.style.cssText = `
      position: absolute;
      top: ${containerRect.top + scrollTop + 15}px;
      left: ${containerRect.left + scrollLeft}px;
      z-index: 9999;
      background: white;
      border: 0;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: black;
      max-width: 250px;
      pointer-events: auto;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.2s ease;
    `

    const textSpan = document.createElement('span')
    textSpan.textContent = footnoteContentText
    textSpan.style.cssText = 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 8px;'

    const buttonsDiv = document.createElement('div')
    buttonsDiv.style.cssText = 'display: flex; gap: 4px; flex-shrink: 0;'

    const editButton = document.createElement('span')
    editButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.68531 4.62938H5.2634C4.92833 4.62938 4.60698 4.76248 4.37004 4.99942C4.13311 5.23635 4 5.5577 4 5.89278V14.7366C4 15.0717 4.13311 15.393 4.37004 15.63C4.60698 15.8669 4.92833 16 5.2634 16H14.1072C14.4423 16 14.7636 15.8669 15.0006 15.63C15.2375 15.393 15.3706 15.0717 15.3706 14.7366V10.3147M13.7124 4.39249C13.9637 4.14118 14.3046 4 14.66 4C15.0154 4 15.3562 4.14118 15.6075 4.39249C15.8588 4.6438 16 4.98464 16 5.34004C16 5.69544 15.8588 6.03629 15.6075 6.28759L9.91399 11.9817C9.76399 12.1316 9.57868 12.2413 9.37515 12.3008L7.56027 12.8314C7.50591 12.8472 7.44829 12.8482 7.39344 12.8341C7.33859 12.8201 7.28853 12.7915 7.24849 12.7515C7.20845 12.7115 7.17991 12.6614 7.16586 12.6066C7.15181 12.5517 7.15276 12.4941 7.16861 12.4397L7.69924 10.6249C7.75896 10.4215 7.86888 10.2364 8.01888 10.0866L13.7124 4.39249Z" stroke="currentColor" stroke-linecap="square" fill="none"/>
      </svg>
    `
    editButton.style.cssText = 'padding: 2px 6px; cursor: pointer; display: flex; align-items: center;'
    editButton.onclick = () => {
      setActiveFootnoteId(footnoteId)
      toggleDrawer()
      hidePreview()
    }

    const removeButton = document.createElement('span')
    removeButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 6L6 14M6 6L14 14" stroke="currentColor" stroke-linecap="square" fill="none"/>
      </svg>
    `
    removeButton.style.cssText = 'padding: 2px 6px; cursor: pointer; display: flex; align-items: center;'
    removeButton.onclick = () => {
      editor.update(() => {
        let footnoteNode = $getNodeByKey(footnoteId)

        if (!$isFootnoteNode(footnoteNode)) {
          const editorState = editor.getEditorState()
          const allNodes = Array.from(editorState._nodeMap.values())
          const footnoteNodes = allNodes.filter(node =>
            node.getType && node.getType() === 'footnote'
          )

          footnoteNode = (footnoteNodes.find(node => {
            return $isFootnoteNode(node) && node.getFields().number === Number(footnoteNumber)
          }) ?? null)
        }

        if (footnoteNode) {
          footnoteNode.remove()
        }
      })

      hidePreview()
    }
    const handlePreviewMouseEnter = () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
        setHoverTimeout(null)
      }
    }

    const handlePreviewMouseLeave = () => {
      const timeout = setTimeout(() => {
        hidePreview()
      }, 200)
      setHoverTimeout(timeout)
    }

    buttonsDiv.appendChild(editButton)
    buttonsDiv.appendChild(removeButton)
    innerDiv.appendChild(textSpan)
    innerDiv.appendChild(buttonsDiv)
    previewElement.appendChild(innerDiv)

    previewElement.addEventListener('mouseenter', handlePreviewMouseEnter)
    previewElement.addEventListener('mouseleave', handlePreviewMouseLeave)

    document.body.appendChild(previewElement)
    setCurrentPreview(previewElement)

    setTimeout(() => {
      innerDiv.style.opacity = '1'
      innerDiv.style.transform = 'translateY(0)'
    }, 10)
  }, [editor, toggleDrawer, hidePreview, hoverTimeout, extractTextFromRichContent])

  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (!rootElement) return

    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (target.classList.contains('lexical-footnote')) {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout)
          setHoverTimeout(null)
        }

        const footnoteContainer = target.closest('.footnote-container') || target
        const footnoteId = target.getAttribute('data-footnote-id') || ''
        const footnoteNumber = target.getAttribute('data-footnote-number') || '1'

        showPreview(footnoteContainer, footnoteNumber, footnoteId)
      }
    }

    const handleMouseLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (target.classList.contains('lexical-footnote')) {
        const relatedTarget = event.relatedTarget as HTMLElement

        if (relatedTarget && (
          relatedTarget.closest(`#footnote-preview-${target.getAttribute('data-footnote-id')}`) ||
          relatedTarget.id === `footnote-preview-${target.getAttribute('data-footnote-id')}`
        )) {
          return
        }

        const timeout = setTimeout(() => {
          hidePreview()
        }, 200)
        setHoverTimeout(timeout)
      }
    }

    rootElement.addEventListener('mouseenter', handleMouseEnter, true)
    rootElement.addEventListener('mouseleave', handleMouseLeave, true)

    return () => {
      rootElement.removeEventListener('mouseenter', handleMouseEnter, true)
      rootElement.removeEventListener('mouseleave', handleMouseLeave, true)

      hidePreview()
    }
  }, [editor, showPreview, hidePreview, hoverTimeout])

  const [stateData, setStateData] = useState<{ content: any; number: number } | undefined>(undefined)

  useEffect(() => {
    if (activeFootnoteId) {
      editor.read(() => {
        const node = $getNodeByKey(activeFootnoteId)

        if (node && $isFootnoteNode(node)) {
          const fields = node.getFields()

          const content = fields.content || {
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: '',
                      type: 'text',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          }

          setStateData({
            content: content,
            number: fields.number != null ? fields.number : 1,
          })
        } else {
          const allFootnotes: any[] = []
          const collectAll = (checkNode: any): void => {
            if (checkNode.getType && checkNode.getType() === 'footnote') {
              const footnoteFields = checkNode.getFields()
              allFootnotes.push({
                key: checkNode.getKey(),
                id: checkNode.getID(),
                number: footnoteFields.number,
                content: footnoteFields.content
              })
            }
            if (checkNode.getChildren) {
              checkNode.getChildren().forEach(collectAll)
            }
          }
          collectAll($getRoot())

          const footnoteByID = allFootnotes.find(fn => fn.id === activeFootnoteId)
          if (footnoteByID) {
            const nodeByCorrectKey = $getNodeByKey(footnoteByID.key)
            if (nodeByCorrectKey && $isFootnoteNode(nodeByCorrectKey)) {
              const fields = nodeByCorrectKey.getFields()

              setStateData({
                content: fields.content || {
                  root: {
                    children: [
                      {
                        children: [
                          {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '',
                            type: 'text',
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        type: 'paragraph',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'root',
                    version: 1,
                  },
                },
                number: fields.number != null ? fields.number : 1,
              })

              setActiveFootnoteId(footnoteByID.key)
            }
          }
        }
      })
    } else {
      setStateData({
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: '',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
        number: 1,
      })
    }
  }, [editor, activeFootnoteId])

  return (
    <FieldsDrawer
      key={activeFootnoteId || 'default'}
      className="lexical-footnote-edit-drawer"
      data={stateData}
      drawerSlug={drawerSlug}
      drawerTitle={'Edit Footnote'}
      featureKey="footnote"
      handleDrawerSubmit={(fields: FormState, data: Data) => {
        if (activeFootnoteId) {
          editor.update(() => {
            const node = $getNodeByKey(activeFootnoteId)

            if (node && $isFootnoteNode(node)) {
              const currentFields = node.getFields()
              const contentFromData = (data as any).content
              const numberFromData = (data as any).number

              const newFields = {
                ...currentFields,
                content: contentFromData,
                number: numberFromData || currentFields.number,
              }

              node.setFields(newFields)
            }
          })

          setActiveFootnoteId(null)
        }
      }}
      schemaPath={schemaPath}
      schemaPathSuffix="fields"
    />
  )
}