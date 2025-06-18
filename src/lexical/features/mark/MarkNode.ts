// src/lexical/features/mark/MarkNode.ts
import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  ElementNode,
  $isElementNode,
} from 'lexical'

export type SerializedMarkNode = SerializedElementNode & {
  type: 'mark'
}

// Change MarkNode to extend ElementNode instead of TextNode
export class MarkNode extends ElementNode {
  static getType(): string {
    return 'mark'
  }

  static clone(node: MarkNode): MarkNode {
    return new MarkNode(node.__key)
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('mark')
    element.style.backgroundColor = '#ffeb3b'
    element.style.color = '#000'
    return element
  }

  updateDOM(prevNode: MarkNode, dom: HTMLElement, config: EditorConfig): boolean {
    return false
  }

  static importDOM(): DOMConversionMap | null {
    return {
      mark: () => ({
        conversion: convertMarkElement,
        priority: 0,
      }),
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('mark')
    return { element }
  }

  static importJSON(serializedNode: SerializedMarkNode): MarkNode {
    const node = $createMarkNode()
    return node
  }

  exportJSON(): SerializedMarkNode {
    return {
      ...super.exportJSON(),
      type: 'mark',
    }
  }

  isInline(): boolean {
    return true
  }

  canBeEmpty(): boolean {
    return false
  }

  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false
  }
}

export function $createMarkNode(): MarkNode {
  return $applyNodeReplacement(new MarkNode())
}

export function $isMarkNode(node: LexicalNode | null | undefined): node is MarkNode {
  return node instanceof MarkNode
}

function convertMarkElement(element: HTMLElement): DOMConversionOutput {
  const node = $createMarkNode()
  return { node }
}