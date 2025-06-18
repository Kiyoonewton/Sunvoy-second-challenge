'use client'
import type { TextFormatType, EditorConfig } from 'lexical';
import { TextNode } from 'lexical';
import { $getSelection, $isRangeSelection } from 'lexical';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHighlighter } from '@fortawesome/free-solid-svg-icons'

const CUSTOM_MARK_FORMAT: TextFormatType = 'highlight';
const HIGHLIGHT_COLOR = '#b3ffd6';

// Custom toolbar button component
const CustomMarkButton: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [isActive, setIsActive] = React.useState(false);

  const handleClick = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, CUSTOM_MARK_FORMAT);
  }, [editor]);

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const hasFormat = selection.hasFormat(CUSTOM_MARK_FORMAT);
          setIsActive(hasFormat);
        }
      });
    });
  }, [editor]);

  return (
    <button
      type="button"
      className={`toolbar-popup__button ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      title="Toggle Highlight"
    >
      <FontAwesomeIcon
        icon={faHighlighter}
        style={{ fontSize: '14px' }}
        color={'#656565'}
      />
    </button>
  );
};

export class CustomTextNode extends TextNode {
  static getType(): string {
    return 'custom-text';
  }

  static clone(node: CustomTextNode): CustomTextNode {
    return new CustomTextNode(node.__text, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);

    if (this.hasFormat(CUSTOM_MARK_FORMAT)) {
      element.style.backgroundColor = HIGHLIGHT_COLOR;
      element.style.padding = '2px 4px';
      element.style.borderRadius = '3px';
    }
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);

    if (this.hasFormat(CUSTOM_MARK_FORMAT)) {
      dom.style.backgroundColor = HIGHLIGHT_COLOR;
      dom.style.padding = '2px 4px';
      dom.style.borderRadius = '3px';
    } else {
      dom.style.backgroundColor = '';
      dom.style.padding = '';
      dom.style.borderRadius = '';
    }
    return isUpdated;
  }
}

// Feature with custom node
export const CustomMarkWithNodeFeatureClient = (props: { [key: string]: string } = {}) => {
  return {
    clientFeatureProps: props,
    feature: {
      nodes: [CustomTextNode],
      enableFormats: [CUSTOM_MARK_FORMAT],

      toolbarInline: {
        groups: [
          {
            key: 'format',
            type: 'buttons',
            items: [
              {
                key: 'customMark',
                Component: CustomMarkButton,
                order: 5,
              },
            ],
          },
        ],
      },
    },
  };
};