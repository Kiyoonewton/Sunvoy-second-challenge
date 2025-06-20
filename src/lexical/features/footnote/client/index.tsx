'use client'
import type { Klass, LexicalNode } from 'lexical'
import { FootnoteNode, TOGGLE_FOOTNOTE_COMMAND } from '../nodes/FootnoteNode.js'
import { FootnotePlugin } from './plugins/footnote/index.js'
import { TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND } from './plugins/floatingFootnoteEditor/FootnoteEditor/commands.js'
import { createClientFeature, toolbarFeatureButtonsGroupWithItems } from '@payloadcms/richtext-lexical/client'
import { FloatingFootnoteEditorPlugin } from './plugins/floatingFootnoteEditor/FootnoteEditor/client/plugins/floatingFootnoteEditor/index.jsx'
import { ToolbarGroup } from '@payloadcms/richtext-lexical'

export type ClientProps = Record<string, never>

// Create a footnote icon component (you'll need to create this)
const FootnoteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <text x="2" y="12" fontSize="12" fill="currentColor">x²</text>
  </svg>
)

const toolbarGroups: ToolbarGroup[] = [
  toolbarFeatureButtonsGroupWithItems([
    {
      ChildComponent: FootnoteIcon,
      key: 'footnote',
      label: ({ i18n }) => i18n.t('lexical:footnote:addFootnote'),
      onSelect: ({ editor }) => {
        editor.dispatchCommand(TOGGLE_FOOTNOTE_COMMAND, {
          fields: {
            content: null,
            number: 1, // Will be overridden by the plugin
          },
        })
        
        // Open the drawer for immediate editing
        editor.dispatchCommand(TOGGLE_FOOTNOTE_WITH_MODAL_COMMAND, null)
      },
      order: 1,
    },
  ]),
]

export const FootnoteFeatureClient = createClientFeature<ClientProps>(() => ({
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
}))