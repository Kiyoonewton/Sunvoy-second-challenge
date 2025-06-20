// 'use client'
// import React from 'react';
// import {
//   DecoratorNode,
//   NodeKey,
//   SerializedLexicalNode,
//   Spread,
//   DOMConversionMap,
//   DOMConversionOutput,
//   DOMExportOutput,
//   LexicalNode,
//   EditorConfig,
//   $getSelection,
//   $isRangeSelection,
//   COMMAND_PRIORITY_EDITOR,
//   createCommand,
//   LexicalCommand,
// } from 'lexical';
// import { $insertNodes } from 'lexical';
// import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
// import { LexicalComposer } from '@lexical/react/LexicalComposer';
// import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
// import { ContentEditable } from '@lexical/react/LexicalContentEditable';
// import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
// import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
// import { ParagraphNode, TextNode, $getNodeByKey } from 'lexical';

// // Payload UI imports
// import { useModal } from '@payloadcms/ui';
// import { Modal, ModalProvider } from '@payloadcms/ui';
// import { Button } from '@payloadcms/ui';
// import { Popup } from '@payloadcms/ui';

// // Commands
// export const INSERT_FOOTNOTE_COMMAND: LexicalCommand<void> = createCommand();

// // Types
// export interface FootnotePayload {
//   id: string;
//   number: number;
//   content: SerializedLexicalNode[];
// }

// export type SerializedFootnoteNode = Spread<
//   {
//     payload: FootnotePayload;
//   },
//   SerializedLexicalNode
// >;

// // FIXED: Global footnote store
// class FootnoteStore {
//   private footnotes = new Map<string, FootnotePayload>();

//   addFootnote(payload: FootnotePayload): void {
//     this.footnotes.set(payload.id, payload);
//   }

//   updateFootnote(id: string, content: SerializedLexicalNode[]): void {
//     const footnote = this.footnotes.get(id);
//     if (footnote) {
//       footnote.content = content;
//     }
//   }

//   getFootnote(id: string): FootnotePayload | undefined {
//     return this.footnotes.get(id);
//   }

//   removeFootnote(id: string): void {
//     this.footnotes.delete(id);
//     this.renumberFootnotes();
//   }

//   getNextNumber(): number {
//     const existingNumbers = Array.from(this.footnotes.values()).map(f => f.number);
//     return existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
//   }

//   private renumberFootnotes(): void {
//     const footnotes = Array.from(this.footnotes.values()).sort((a, b) => a.number - b.number);
//     footnotes.forEach((footnote, index) => {
//       footnote.number = index + 1;
//     });
//   }

//   getAllFootnotes(): FootnotePayload[] {
//     return Array.from(this.footnotes.values()).sort((a, b) => a.number - b.number);
//   }

//   reset(): void {
//     this.footnotes.clear();
//   }
// }

// const footnoteStore = new FootnoteStore();

// // Footnote Node
// export class FootnoteNode extends DecoratorNode<React.ReactNode> {
//   __payload: FootnotePayload;

//   static getType(): string {
//     return 'footnote';
//   }

//   static clone(node: FootnoteNode): FootnoteNode {
//     return new FootnoteNode(node.__payload, node.__key);
//   }

//   constructor(payload: FootnotePayload, key?: NodeKey) {
//     super(key);
//     this.__payload = payload;
//   }

//   createDOM(): HTMLElement {
//     const element = document.createElement('span');
//     element.className = 'footnote-reference';
//     element.setAttribute('data-footnote-id', this.__payload.id);
//     element.style.cursor = 'pointer';
//     element.style.color = '#0066cc';
//     element.style.marginLeft = '2px';
//     return element;
//   }

//   updateDOM(): false {
//     return false;
//   }

//   setPayload(payload: FootnotePayload): void {
//     const writable = this.getWritable();
//     writable.__payload = payload;
//   }

//   getPayload(): FootnotePayload {
//     return this.getLatest().__payload;
//   }

//   decorate(): React.ReactNode {
//     return <FootnoteComponent nodeKey={this.__key} payload={this.__payload} />;
//   }

//   static importDOM(): DOMConversionMap | null {
//     return {
//       sup: () => ({
//         conversion: convertSupElement,
//         priority: 1,
//       }),
//     };
//   }

//   exportDOM(): DOMExportOutput {
//     const element = document.createElement('sup');
//     element.innerHTML = `<a href="#footnote-${this.__payload.id}">${this.__payload.number}</a>`;
//     return { element };
//   }

//   static importJSON(serializedNode: SerializedFootnoteNode): FootnoteNode {
//     const { payload } = serializedNode;
//     return $createFootnoteNode(payload);
//   }

//   exportJSON(): SerializedFootnoteNode {
//     return {
//       payload: this.__payload,
//       type: 'footnote',
//       version: 1,
//     };
//   }

//   isInline(): boolean {
//     return true;
//   }
// }

// function convertSupElement(domNode: Node): DOMConversionOutput {
//   const element = domNode as HTMLElement;
//   const footnoteId = element.getAttribute('data-footnote-id');

//   if (footnoteId) {
//     const number = parseInt(element.textContent || '1', 10);
//     const payload: FootnotePayload = {
//       id: footnoteId,
//       number,
//       content: [],
//     };

//     const node = $createFootnoteNode(payload);
//     return { node };
//   }

//   return { node: null };
// }

// export function $createFootnoteNode(payload: FootnotePayload): FootnoteNode {
//   return new FootnoteNode(payload);
// }

// export function $isFootnoteNode(node: LexicalNode | null | undefined): node is FootnoteNode {
//   return node instanceof FootnoteNode;
// }

// // Footnote Editor Modal Content
// interface FootnoteEditorProps {
//   payload: FootnotePayload;
//   onSave: (content: SerializedLexicalNode[]) => void;
//   onCancel: () => void;
// }

// const footnoteEditorConfig = {
//   namespace: 'FootnoteEditor',
//   nodes: [ParagraphNode, TextNode],
//   onError: (error: Error) => {
//     console.error('Footnote editor error:', error);
//   },
//   theme: {
//     paragraph: 'payload-paragraph',
//     text: {
//       bold: 'payload-bold',
//       italic: 'payload-italic',
//     },
//   },
// };

// const FootnoteEditor: React.FC<FootnoteEditorProps> = ({ payload, onSave, onCancel }) => {
//   const editorRef = React.useRef<any>(null);

//   const handleSave = () => {
//     if (editorRef.current) {
//       editorRef.current.getEditorState().read(() => {
//         const serialized = editorRef.current.getEditorState().toJSON();
//         onSave(serialized.root.children);
//       });
//     }
//   };

//   return (
//     <div className="payload-modal-content">
//       <div className="payload-modal-header">
//         <h3>Edit Footnote {payload.number}</h3>
//       </div>
      
//       <div className="payload-modal-body">
//         <div className="payload-field">
//           <label className="payload-field-label">Footnote Content</label>
//           <div className="payload-field-input">
//             <LexicalComposer initialConfig={footnoteEditorConfig}>
//               <RichTextPlugin
//                 contentEditable={
//                   <ContentEditable
//                     className="payload-rich-text-editor"
//                     style={{
//                       minHeight: '120px',
//                       padding: '12px',
//                       border: '1px solid var(--theme-elevation-300)',
//                       borderRadius: '4px',
//                       outline: 'none',
//                     }}
//                   />
//                 }
//                 placeholder={
//                   <div className="payload-rich-text-placeholder">
//                     Enter footnote content...
//                   </div>
//                 }
//                 ErrorBoundary={LexicalErrorBoundary}
//               />
//               <HistoryPlugin />
//             </LexicalComposer>
//           </div>
//         </div>
//       </div>

//       <div className="payload-modal-footer">
//         <Button
//           buttonStyle="secondary"
//           onClick={onCancel}
//         >
//           Cancel
//         </Button>
//         <Button
//           buttonStyle="primary"
//           onClick={handleSave}
//         >
//           Save Footnote
//         </Button>
//       </div>
//     </div>
//   );
// };

// // Footnote Component with Payload Modal
// interface FootnoteComponentProps {
//   nodeKey: NodeKey;
//   payload: FootnotePayload;
// }

// const FootnoteComponent: React.FC<FootnoteComponentProps> = ({ nodeKey, payload }) => {
//   const [editor] = useLexicalComposerContext();
//   const { openModal, closeModal } = useModal();

//   const handleEdit = () => {
//     openModal({
//       slug: 'footnote-editor',
//       data: payload,
//       render: ({ data, close }) => (
//         <FootnoteEditor
//           payload={data}
//           onSave={(content) => {
//             footnoteStore.updateFootnote(payload.id, content);
//             close();
//           }}
//           onCancel={close}
//         />
//       ),
//     });
//   };

//   const handleRemove = () => {
//     editor.update(() => {
//       const node = $getNodeByKey(nodeKey);
//       if (node && $isFootnoteNode(node)) {
//         node.remove();
//         footnoteStore.removeFootnote(payload.id);
//       }
//     });
//   };

//   const renderPreview = ({ close }: { close: () => void }) => (
//     <div className="payload-popup-content">
//       <div className="payload-popup-header">
//         <strong>Footnote {payload.number}</strong>
//       </div>
//       <div className="payload-popup-body">
//         {payload.content.length > 0 ? 'Footnote content...' : 'No content yet'}
//       </div>
//       <div className="payload-popup-footer">
//         <Button
//           size="small"
//           buttonStyle="secondary"
//           onClick={() => {
//             handleEdit();
//             close();
//           }}
//         >
//           Edit
//         </Button>
//         <Button
//           size="small"
//           buttonStyle="danger"
//           onClick={() => {
//             handleRemove();
//             close();
//           }}
//         >
//           Remove
//         </Button>
//       </div>
//     </div>
//   );

//   return (
//     <Popup
//       button={
//         <sup
//           style={{
//             cursor: 'pointer',
//             color: 'var(--theme-text-link)',
//             textDecoration: 'none',
//           }}
//         >
//           {payload.number}
//         </sup>
//       }
//       render={renderPreview}
//       horizontalAlign="left"
//       verticalAlign="bottom"
//       size="medium"
//     />
//   );
// };

// // Footnote Plugin
// const FootnotePlugin: React.FC = () => {
//   const [editor] = useLexicalComposerContext();
//   const { openModal } = useModal();

//   const insertFootnote = React.useCallback(() => {
//     editor.update(() => {
//       const selection = $getSelection();

//       if ($isRangeSelection(selection)) {
//         const footnoteId = `footnote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//         const footnoteNumber = footnoteStore.getNextNumber();

//         const payload: FootnotePayload = {
//           id: footnoteId,
//           number: footnoteNumber,
//           content: [],
//         };

//         footnoteStore.addFootnote(payload);

//         const footnoteNode = $createFootnoteNode(payload);
//         $insertNodes([footnoteNode]);

//         // Open modal immediately for new footnotes
//         openModal({
//           slug: 'footnote-editor',
//           data: payload,
//           render: ({ data, close }) => (
//             <FootnoteEditor
//               payload={data}
//               onSave={(content) => {
//                 footnoteStore.updateFootnote(payload.id, content);
//                 close();
//               }}
//               onCancel={close}
//             />
//           ),
//         });
//       }
//     });
//   }, [editor, openModal]);

//   React.useEffect(() => {
//     return editor.registerCommand(
//       INSERT_FOOTNOTE_COMMAND,
//       () => {
//         insertFootnote();
//         return true;
//       },
//       COMMAND_PRIORITY_EDITOR
//     );
//   }, [editor, insertFootnote]);

//   return null;
// };

// // Toolbar Button
// const FootnoteButton: React.FC = () => {
//   const [editor] = useLexicalComposerContext();

//   const handleClick = React.useCallback(() => {
//     editor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, undefined);
//   }, [editor]);

//   return (
//     <button
//       type="button"
//       className="toolbar-popup__button"
//       onClick={handleClick}
//       title="Insert Footnote"
//     >
//       <svg aria-hidden="true" className="icon" fill="currentColor" focusable="false" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
//         <path d="M10.167 15L7.45002 11.36L4.73302 15H2.91302L6.55302 10.177L3.23802 5.718H5.20102L7.54102 8.89L9.89402 5.718H11.714L8.43802 10.06L12.13 15H10.167ZM16.7768 7.252C16.7768 8.149 16.1398 8.526 15.2038 8.994C14.5538 9.319 14.2808 9.54 14.2418 9.774H16.7898V10.814H12.7208V10.333C12.7208 9.28 13.5918 8.669 14.3588 8.227C15.0868 7.824 15.4378 7.629 15.4378 7.226C15.4378 6.888 15.2038 6.68 14.8268 6.68C14.3848 6.68 14.1248 7.018 14.1118 7.421H12.7468C12.8248 6.42 13.5528 5.627 14.8398 5.627C15.9448 5.627 16.7768 6.251 16.7768 7.252Z" fill="currentColor"></path>
//       </svg>
//     </button>
//   );
// };

// // Feature Export
// export const FootnoteFeatureClient = (props: { [key: string]: string } = {}) => {
//   const toolbarConfig = {
//     groups: [
//       {
//         key: 'format',
//         type: 'buttons' as const,
//         items: [
//           {
//             key: 'footnote',
//             Component: FootnoteButton,
//             order: 5,
//           },
//         ],
//       },
//     ],
//   };

//   return {
//     clientFeatureProps: props,
//     feature: {
//       nodes: [FootnoteNode],
//       plugins: [
//         {
//           Component: FootnotePlugin,
//           position: 'normal',
//         },
//       ],
//       toolbarInline: toolbarConfig,
//       toolbarFixed: toolbarConfig,
//     },
//   };
// };