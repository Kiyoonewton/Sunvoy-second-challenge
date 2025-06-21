import type {
  BaseSelection,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalCommand,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  RangeSelection,
} from 'lexical'

import ObjectID from 'bson-objectid'
import {
  $applyNodeReplacement,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  createCommand,
  ElementNode,
  TextNode,
} from 'lexical'
import { FootnoteFields, SerializedFootnoteNode } from './types'
import { FootnotePayload } from '../client/plugins/floatingFootnoteEditor/types'

export class FootnoteNode extends ElementNode {
  __fields: FootnoteFields
  __id: string

  constructor({
    id,
    fields = {
      content: null,
      number: 1,
    },
    key,
  }: {
    fields?: FootnoteFields
    id: string
    key?: NodeKey
  }) {
    super(key)
    this.__fields = fields
    this.__id = id
  }

  static override clone(node: FootnoteNode): FootnoteNode {
    return new FootnoteNode({
      id: node.__id,
      fields: node.__fields,
      key: node.__key,
    })
  }

  static override getType(): string {
    return 'footnote'
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      sup: (node: Node) => ({
        conversion: convertSupElement,
        priority: 1,
      }),
    }
  }

  static override importJSON(serializedNode: SerializedFootnoteNode): FootnoteNode {
    const node = $createFootnoteNode({
      id: serializedNode.id,
      fields: serializedNode.fields,
    })
    
    return node
  }

  override canBeEmpty(): false {
    return false
  }

  override canInsertTextAfter(): false {
    return false
  }

  override canInsertTextBefore(): false {
    return false
  }

override createDOM(config: EditorConfig): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'footnote-container'
  wrapper.style.position = 'relative'
  wrapper.style.display = 'inline-block'
  
  const element = document.createElement('sup')
  element.className = 'lexical-footnote'
  element.setAttribute('data-footnote-id', this.__id)
  element.setAttribute('data-footnote-number', String(this.__fields.number))
  element.setAttribute('contenteditable', 'false')
  element.style.cursor = 'pointer'
  element.style.color = 'var(--theme-text-link, #0066cc)'
  element.style.userSelect = 'none'
  
  element.title = `Footnote ${this.__fields.number} - Hover to preview`
  
  element.textContent = String(this.__fields.number)
  
  wrapper.appendChild(element)
  
  return wrapper
}

  override updateDOM(prevNode: this, element: HTMLElement): boolean {
    const number = this.__fields?.number
    if (number !== prevNode.__fields?.number) {
      element.setAttribute('data-footnote-number', String(number))
      element.textContent = String(number)
    }
    return false
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('sup')
    const anchor = document.createElement('a')
    anchor.href = `#fn-${this.__fields.number}`
    anchor.id = `fnref-${this.__fields.number}`
    anchor.textContent = String(this.__fields.number)
    element.appendChild(anchor)
    return { element }
  }

  override exportJSON(): SerializedFootnoteNode {
    return {
      ...super.exportJSON(),
      type: 'footnote',
      fields: this.getFields(),
      id: this.getID(),
      version: 1,
    }
  }

   decorate(): React.ReactNode {
    return null
  }

  getFields(): FootnoteFields {
    return this.getLatest().__fields
  }

  getID(): string {
    return this.getLatest().__id
  }

  override isInline(): true {
    return true
  }

  isKeyboardSelectable(): false {
    return false
  }

  setFields(fields: FootnoteFields): this {
    const writable = this.getWritable()
    writable.__fields = fields
    return writable
  }

  setID(id: string): this {
    const writable = this.getWritable()
    writable.__id = id
    return writable
  }

  override updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedFootnoteNode>): this {
    return super
      .updateFromJSON(serializedNode)
      .setFields(serializedNode.fields)
      .setID(serializedNode.id as string)
  }
}

function convertSupElement(domNode: Node): DOMConversionOutput {
  const element = domNode as HTMLElement
  const footnoteId = element.getAttribute('data-footnote-id')
  
  if (footnoteId) {
    const number = parseInt(element.getAttribute('data-footnote-number') || element.textContent || '1', 10)
    const node = $createFootnoteNode({
      id: footnoteId,
      fields: {
        content: null,
        number,
      },
    })
    return { node }
  }
  
  return { node: null }
}

export function $createFootnoteNode({ id, fields }: { fields?: FootnoteFields; id?: string }): FootnoteNode {
  return $applyNodeReplacement(
    new FootnoteNode({
      id: id ?? new ObjectID().toHexString(),
      fields,
    }),
  )
}

export function $isFootnoteNode(node: LexicalNode | null | undefined): node is FootnoteNode {
  return node instanceof FootnoteNode
}

export const TOGGLE_FOOTNOTE_COMMAND: LexicalCommand<FootnotePayload | null> =
  createCommand('TOGGLE_FOOTNOTE_COMMAND')

export function $insertFootnote(payload: FootnotePayload): void {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) {
    return
  }

  const footnoteNode = $createFootnoteNode({ fields: payload?.fields })
  const spaceNode = $createTextNode(' ')
  
  selection.insertNodes([footnoteNode, spaceNode])
  
  spaceNode.select(0, 0)
}