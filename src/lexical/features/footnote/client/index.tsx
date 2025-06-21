'use client'
import type { Klass, LexicalNode } from 'lexical'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { ToolbarGroup } from '@payloadcms/richtext-lexical'
import { FootnoteNode, TOGGLE_FOOTNOTE_COMMAND } from '../nodes/FootnoteNode'
import { FootnotePlugin } from './plugins/footnote'
import { FloatingFootnoteEditorPlugin } from './plugins/floatingFootnoteEditor'
import { FootnoteMarkdownTransformer } from '../markdownTransformer'
import { TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND } from './plugins/floatingFootnoteEditor/FootnoteEditor'

export type ClientProps = Record<string, never>

const FootnoteIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M10.167 15L7.45002 11.36L4.73302 15H2.91302L6.55302 10.177L3.23802 5.718H5.20102L7.54102 8.89L9.89402 5.718H11.714L8.43802 10.06L12.13 15H10.167ZM16.7768 7.252C16.7768 8.149 16.1398 8.526 15.2038 8.994C14.5538 9.319 14.2808 9.54 14.2418 9.774H16.7898V10.814H12.7208V10.333C12.7208 9.28 13.5918 8.669 14.3588 8.227C15.0868 7.824 15.4378 7.629 15.4378 7.226C15.4378 6.888 15.2038 6.68 14.8268 6.68C14.3848 6.68 14.1248 7.018 14.1118 7.421H12.7468C12.8248 6.42 13.5528 5.627 14.8398 5.627C15.9448 5.627 16.7768 6.251 16.7768 7.252Z" 
      fill="currentColor"
    />
  </svg>
)

const toolbarGroups: ToolbarGroup[] = [
  {
    key: 'format',
    type: 'buttons' as const,
    items: [
      {
        ChildComponent: FootnoteIcon,
        key: 'footnote',
        label: ({ i18n }) => i18n.t('lexical:footnote:addFootnote'),
        onSelect: ({ editor }) => {
          
          let createdFootnoteId: string | null = null
          
          editor.update(() => {
            const result = editor.dispatchCommand(TOGGLE_FOOTNOTE_COMMAND, {
              fields: {
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
                number: 0,
              },
            })
          })
          
          setTimeout(() => {
            editor.getEditorState().read(() => {
              const allNodes = Array.from(editor.getEditorState()._nodeMap.values())
              const footnoteNodes = allNodes.filter(
                (node): node is FootnoteNode =>
                  typeof node.getType === 'function' && node.getType() === 'footnote'
              )
              
              let newestFootnote: FootnoteNode | null = null
              let highestNumber = 0
              
              footnoteNodes.forEach(node => {
                const fields = node.getFields()
                if (fields.number === 999) {
                  newestFootnote = node
                } else if (fields.number > highestNumber) {
                  highestNumber = fields.number
                  newestFootnote = node
                }
              })
              
              if (newestFootnote && typeof (newestFootnote as FootnoteNode).getKey === 'function') {
                createdFootnoteId = (newestFootnote as FootnoteNode).getKey()
              } else {
              }
            })
            
            if (createdFootnoteId) {
              editor.dispatchCommand(TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND, {
                fields: {
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
                  number: 0,
                },
                footnoteId: createdFootnoteId
              })
            } else {
              editor.dispatchCommand(TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND, null)
            }
          }, 150)
        },
        order: 7,
      },
    ],
  },
]

export const FootnoteFeatureClient = createClientFeature<ClientProps>(() => ({
  markdownTransformers: [FootnoteMarkdownTransformer],
  nodes: [FootnoteNode] as Array<Klass<LexicalNode>>,
  plugins: [
    {
      Component: FootnotePlugin,
      position: 'normal',
    },
    {
      Component: FloatingFootnoteEditorPlugin,
      position: 'floatingAnchorElem',
    },
  ],
  toolbarFixed: {
    groups: toolbarGroups,
  },
  toolbarInline: {
    groups: toolbarGroups,
  },
}))