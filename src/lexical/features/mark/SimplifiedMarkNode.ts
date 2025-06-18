// src/lexical/features/mark/SimplifiedMarkNode.ts
import {
  type DOMConversionMap,
  type DOMConversionOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  ElementNode,
  $applyNodeReplacement,
} from 'lexical'

export type SerializedMarkNode = SerializedElementNode & {
  type: 'mark'
  ids: string[]
}

// Minimal MarkNode just for parsing existing data
export class SimplifiedMarkNode extends ElementNode {
  __ids: string[]

  static getType(): string {
    return 'mark'
  }

  static clone(node: SimplifiedMarkNode): SimplifiedMarkNode {
    return new SimplifiedMarkNode(node.__ids, node.__key)
  }

  constructor(ids: string[] = ['highlight'], key?: NodeKey) {
    super(key)
    this.__ids = ids
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('mark')
    element.style.backgroundColor = '#ffeb3b'
    element.style.color = '#000'
    element.style.padding = '0 2px'
    element.style.borderRadius = '2px'
    return element
  }

  updateDOM(): boolean {
    return false
  }

  static importDOM(): DOMConversionMap | null {
    return {
      mark: () => ({
        conversion: (element: HTMLElement): DOMConversionOutput => {
          const node = $createSimplifiedMarkNode()
          return { node }
        },
        priority: 0,
      }),
    }
  }

  static importJSON(serializedNode: SerializedMarkNode): SimplifiedMarkNode {
    const { ids } = serializedNode
    return $createSimplifiedMarkNode(ids)
  }

  exportJSON(): SerializedMarkNode {
    return {
      ...super.exportJSON(),
      type: 'mark',
      ids: this.__ids,
    }
  }

  isInline(): boolean {
    return true
  }

  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false
  }
}

export function $createSimplifiedMarkNode(ids: string[] = ['highlight']): SimplifiedMarkNode {
  return $applyNodeReplacement(new SimplifiedMarkNode(ids))
}

export function $isSimplifiedMarkNode(node: LexicalNode | null | undefined): node is SimplifiedMarkNode {
  return node instanceof SimplifiedMarkNode
}