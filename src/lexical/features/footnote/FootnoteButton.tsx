'use client'
import React from 'react';
import {
  DecoratorNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  EditorConfig,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { $insertNodes } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ParagraphNode, TextNode, $getNodeByKey } from 'lexical';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSuperscript } from '@fortawesome/free-solid-svg-icons';

// Commands
export const INSERT_FOOTNOTE_COMMAND: LexicalCommand<void> = createCommand();

// Types
export interface FootnotePayload {
  id: string;
  number: number;
  content: SerializedLexicalNode[];
}

export type SerializedFootnoteNode = Spread<
  {
    payload: FootnotePayload;
  },
  SerializedLexicalNode
>;

// Global footnote store
class FootnoteStore {
  private footnotes = new Map<string, FootnotePayload>();
  private nextNumber = 1;

  addFootnote(payload: FootnotePayload): void {
    this.footnotes.set(payload.id, payload);
  }

  updateFootnote(id: string, content: SerializedLexicalNode[]): void {
    const footnote = this.footnotes.get(id);
    if (footnote) {
      footnote.content = content;
    }
  }

  getFootnote(id: string): FootnotePayload | undefined {
    return this.footnotes.get(id);
  }

  removeFootnote(id: string): void {
    this.footnotes.delete(id);
  }

  getNextNumber(): number {
    return this.nextNumber++;
  }

  getAllFootnotes(): FootnotePayload[] {
    return Array.from(this.footnotes.values()).sort((a, b) => a.number - b.number);
  }
}

const footnoteStore = new FootnoteStore();

// Footnote Node
export class FootnoteNode extends DecoratorNode<React.ReactNode> {
  __payload: FootnotePayload;

  static getType(): string {
    return 'footnote';
  }

  static clone(node: FootnoteNode): FootnoteNode {
    return new FootnoteNode(node.__payload, node.__key);
  }

  constructor(payload: FootnotePayload, key?: NodeKey) {
    super(key);
    this.__payload = payload;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('sup');
    element.className = 'footnote-reference';
    element.setAttribute('data-footnote-id', this.__payload.id);
    element.textContent = this.__payload.number.toString();
    element.style.cursor = 'pointer';
    element.style.color = '#0066cc';
    element.style.marginLeft = '2px';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  setPayload(payload: FootnotePayload): void {
    const writable = this.getWritable();
    writable.__payload = payload;
  }

  getPayload(): FootnotePayload {
    return this.getLatest().__payload;
  }

  decorate(): React.ReactNode {
    return <FootnoteComponent nodeKey={this.__key} payload={this.__payload} />;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      sup: (node: Node) => ({
        conversion: convertSupElement,
        priority: 1,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('sup');
    element.innerHTML = `<a href="#footnote-${this.__payload.id}">${this.__payload.number}</a>`;
    return { element };
  }

  static importJSON(serializedNode: SerializedFootnoteNode): FootnoteNode {
    const { payload } = serializedNode;
    return $createFootnoteNode(payload);
  }

  exportJSON(): SerializedFootnoteNode {
    return {
      payload: this.__payload,
      type: 'footnote',
      version: 1,
    };
  }

  isInline(): boolean {
    return true;
  }
}

function convertSupElement(domNode: Node): DOMConversionOutput {
  const element = domNode as HTMLElement;
  const footnoteId = element.getAttribute('data-footnote-id');
  
  if (footnoteId) {
    const number = parseInt(element.textContent || '1', 10);
    const payload: FootnotePayload = {
      id: footnoteId,
      number,
      content: [],
    };
    
    const node = $createFootnoteNode(payload);
    return { node };
  }
  
  return { node: null };
}

export function $createFootnoteNode(payload: FootnotePayload): FootnoteNode {
  return new FootnoteNode(payload);
}

export function $isFootnoteNode(node: LexicalNode | null | undefined): node is FootnoteNode {
  return node instanceof FootnoteNode;
}

// Footnote Component
interface FootnoteComponentProps {
  nodeKey: NodeKey;
  payload: FootnotePayload;
}

const FootnoteComponent: React.FC<FootnoteComponentProps> = ({ nodeKey, payload }) => {
  const [editor] = useLexicalComposerContext();
  const [showPreview, setShowPreview] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);

  const handleEdit = () => {
    setShowModal(true);
    setShowPreview(false);
  };

  const handleRemove = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && $isFootnoteNode(node)) {
        node.remove();
        footnoteStore.removeFootnote(payload.id);
      }
    });
    setShowPreview(false);
  };

  return (
    <>
      <span 
        className="footnote-reference"
        style={{ 
          position: 'relative',
          cursor: 'pointer',
          color: '#0066cc',
          marginLeft: '2px'
        }}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        <sup>{payload.number}</sup>
        {showPreview && (
          <div 
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '0',
              zIndex: 1000,
              width: '300px',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: '12px',
              fontSize: '14px',
              marginBottom: '8px'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                Footnote {payload.number}:
              </div>
              <div style={{ color: '#333', lineHeight: '1.4' }}>
                {payload.content.length > 0 ? 'Footnote content...' : 'No content'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleEdit}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  background: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Edit
              </button>
              <button 
                onClick={handleRemove}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  background: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#cc0000'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </span>
      {showModal && (
        <FootnoteModal
          payload={payload}
          onSave={(content) => {
            footnoteStore.updateFootnote(payload.id, content);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
};

// Footnote Modal
interface FootnoteModalProps {
  payload: FootnotePayload;
  onSave: (content: SerializedLexicalNode[]) => void;
  onCancel: () => void;
}

const footnoteEditorConfig = {
  namespace: 'FootnoteEditor',
  nodes: [ParagraphNode, TextNode],
  onError: (error: Error) => {
    console.error('Footnote editor error:', error);
  },
  theme: {
    paragraph: 'footnote-paragraph',
    text: {
      bold: 'footnote-bold',
      italic: 'footnote-italic',
      strikethrough: 'footnote-strikethrough',
    },
  },
};

const FootnoteModal: React.FC<FootnoteModalProps> = ({ payload, onSave, onCancel }) => {
  const [editor] = useLexicalComposerContext();

  const handleSave = () => {
    editor.getEditorState().read(() => {
      const serialized = editor.getEditorState().toJSON();
      onSave(serialized.root.children);
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #eee',
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Edit Footnote
          </h3>
          <button 
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: 0,
              width: '32px',
              height: '32px',
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ flex: 1, padding: '20px' }}>
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
            <LexicalComposer initialConfig={footnoteEditorConfig}>
              <RichTextPlugin
                contentEditable={
                  <ContentEditable 
                    style={{
                      minHeight: '120px',
                      padding: '12px',
                      outline: 'none',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                  />
                }
                placeholder={
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    color: '#999',
                    pointerEvents: 'none',
                    fontSize: '14px',
                  }}>
                    Enter footnote content...
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
            </LexicalComposer>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          padding: '16px 20px',
          borderTop: '1px solid #eee',
        }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              background: 'white',
              color: '#666',
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              border: '1px solid #0066cc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              background: '#0066cc',
              color: 'white',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Footnote Plugin
const FootnotePlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [showModal, setShowModal] = React.useState(false);
  const [currentFootnoteId, setCurrentFootnoteId] = React.useState<string | null>(null);

  const insertFootnote = React.useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      
      if ($isRangeSelection(selection)) {
        const footnoteId = `footnote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const footnoteNumber = footnoteStore.getNextNumber();
        
        const payload: FootnotePayload = {
          id: footnoteId,
          number: footnoteNumber,
          content: [],
        };
        
        footnoteStore.addFootnote(payload);
        
        const footnoteNode = $createFootnoteNode(payload);
        $insertNodes([footnoteNode]);
        
        setCurrentFootnoteId(footnoteId);
        setShowModal(true);
      }
    });
  }, [editor]);

  React.useEffect(() => {
    return editor.registerCommand(
      INSERT_FOOTNOTE_COMMAND,
      () => {
        insertFootnote();
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, insertFootnote]);

  const handleSave = React.useCallback((content: SerializedLexicalNode[]) => {
    if (currentFootnoteId) {
      footnoteStore.updateFootnote(currentFootnoteId, content);
    }
    setShowModal(false);
    setCurrentFootnoteId(null);
  }, [currentFootnoteId]);

  const handleCancel = React.useCallback(() => {
    setShowModal(false);
    setCurrentFootnoteId(null);
  }, []);

  return (
    <>
      {showModal && currentFootnoteId && (
        <FootnoteModal
          payload={footnoteStore.getFootnote(currentFootnoteId)!}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

// Toolbar Button
const FootnoteButton: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  const handleClick = React.useCallback(() => {
    editor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, undefined);
  }, [editor]);

  return (
    <button
      type="button"
      className="toolbar-popup__button"
      onClick={handleClick}
      title="Insert Footnote"
    >
      <FontAwesomeIcon
        icon={faSuperscript}
        style={{ fontSize: '14px' }}
        color={'#656565'}
      />
    </button>
  );
};

// Feature Export
export const FootnoteFeatureClient = (props: { [key: string]: string } = {}) => {
  return {
    clientFeatureProps: props,
    feature: {
      nodes: [FootnoteNode],
      plugins: [
        {
          Component: FootnotePlugin,
          position: 'normal',
        },
      ],
      toolbarInline: {
        groups: [
          {
            key: 'footnote',
            type: 'buttons',
            items: [
              {
                key: 'footnote',
                Component: FootnoteButton,
                order: 5,
              },
            ],
          },
        ],
      },
    },
  };
};