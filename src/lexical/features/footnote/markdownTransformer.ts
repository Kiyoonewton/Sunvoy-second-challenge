import { $createTextNode } from 'lexical'
import type { TextMatchTransformer } from '@payloadcms/richtext-lexical/lexical/markdown'
import { $createFootnoteNode, $isFootnoteNode, FootnoteNode } from './nodes/FootnoteNode.js'

export const FootnoteMarkdownTransformer: TextMatchTransformer = {
  type: 'text-match',
  dependencies: [FootnoteNode],
  export: (node, exportChildren) => {
    if (!$isFootnoteNode(node)) {
      return null
    }
    const footnoteNode = node as FootnoteNode
    return `[^${footnoteNode.getFields().number}]`
  },
  importRegExp: /\[\^(\d+)\]/,
  regExp: /\[\^(\d+)\]$/,
  replace: (textNode, match) => {
    const [, footnoteNumber] = match
    const footnoteNode = $createFootnoteNode({
      fields: {
        content: null,
        number: parseInt(footnoteNumber, 10),
      },
    })
    const numberTextNode = $createTextNode(footnoteNumber)
    footnoteNode.append(numberTextNode)
    textNode.replace(footnoteNode)
    return numberTextNode
  },
  trigger: ']',
}