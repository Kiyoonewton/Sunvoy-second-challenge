import type {
    BaseSelection,
    DOMConversionMap,
    DOMConversionOutput,
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
    createCommand,
    ElementNode,
  } from 'lexical'
  
  import type { FootnotePayload } from '../client/plugins/floatingFootnoteEditor/types.js'
  import type { FootnoteFields, SerializedFootnoteNode } from './types.js'
  
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
  
    static override importJSON(serializedNode: SerializedFootnoteNode): FootnoteNode {
      const node = $createFootnoteNode({}).updateFromJSON(serializedNode)
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
      const element = document.createElement('sup')
      element.className = 'footnote-marker'
      return element
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
  
    getFields(): FootnoteFields {
      return this.getLatest().__fields
    }
  
    getID(): string {
      return this.getLatest().__id
    }
  
    override isInline(): true {
      return true
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
  
    override updateDOM(prevNode: this, element: HTMLElement): boolean {
      // Update the footnote number display
      const number = this.__fields?.number
      if (number !== prevNode.__fields?.number) {
        element.textContent = String(number)
      }
      return false
    }
  
    override updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedFootnoteNode>): this {
      return super
        .updateFromJSON(serializedNode)
        .setFields(serializedNode.fields)
        .setID(serializedNode.id as string)
    }
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
  
    const focusNode = selection.focus.getNode()
    if (focusNode !== null) {
      const footnoteNode = $createFootnoteNode({ fields: payload?.fields })
      const numberTextNode = $createTextNode(String(payload?.fields.number))
      footnoteNode.append(numberTextNode)
      
      selection.insertNodes([footnoteNode])
    }
  }