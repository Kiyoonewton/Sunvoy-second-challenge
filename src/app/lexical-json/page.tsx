'use client';
import React, { useState } from 'react';
import { styles } from './styles';

const LexicalToHTMLConverter = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [htmlOutput, setHtmlOutput] = useState('');
  const [error, setError] = useState('');

  const FORMAT_TYPES = {
    BOLD: 1,        
    ITALIC: 2,      
    UNDERLINE: 4,   
    STRIKETHROUGH: 8, 
    CODE: 16,       
    LINK: 32,       
    SUBSCRIPT: 64,  
    HIGHLIGHT: 128, 
    SUPERSCRIPT: 256 
  };

  const FORMAT_TO_TAG = {
    [FORMAT_TYPES.BOLD]: 'strong',
    [FORMAT_TYPES.ITALIC]: 'em',
    [FORMAT_TYPES.UNDERLINE]: 'u',
    [FORMAT_TYPES.STRIKETHROUGH]: 'strike',
    [FORMAT_TYPES.CODE]: 'code',
    [FORMAT_TYPES.LINK]: 'a',
    [FORMAT_TYPES.SUBSCRIPT]: 'sub',
    [FORMAT_TYPES.HIGHLIGHT]: 'mark',
    [FORMAT_TYPES.SUPERSCRIPT]: 'sup'
  };

  const resolveFormats = (format: number, text: string): string => {
    if (!format) return text;

    const activeFormats = Object.entries(FORMAT_TYPES)
      .filter(([_, value]) => format & value)
      .map(([key, value]) => value);

    if (activeFormats.length === 0) return text;

    return activeFormats.reduceRight((acc, formatValue) => {
      const tag = FORMAT_TO_TAG[formatValue];
      return tag ? `<${tag}>${acc}</${tag}>` : acc;
    }, text);
  };

  const convertToHTML = (content: string | { root: { children: any[] } }) => {
    try {
      const parsedContent = typeof content === 'string' 
        ? JSON.parse(content) 
        : content;

      if (!parsedContent.root || !parsedContent.root.children) {
        setError('Invalid JSON structure');
        return '';
      }

      const htmlContent = parsedContent.root.children
        .map((paragraph: { children?: { text?: string; format?: number }[] }) => {
          if (paragraph.children) {
            const htmlParts = paragraph.children.map((child: { text?: string; format?: number }) => {
              const text = child.text || '';
              const format = child.format || 0;
              
              return resolveFormats(format, text);
            });
            
            return `<p>${htmlParts.join('')}</p>`;
          }
          return '';
        })
        .join('');

      return htmlContent;
    } catch (err) {
      setError('Error parsing JSON: ' + err);
      return '';
    }
  };

  const handleConvert = () => {
    setError('');

    const html = convertToHTML(jsonInput);
    setHtmlOutput(html);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Lexical JSON to HTML Converter</h2>

      <textarea
        style={styles.textarea}
        placeholder="Paste your Lexical JSON here"
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
      />

      <button
        style={styles.button}
        onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = styles.buttonHover.backgroundColor)}
        onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = styles.button.backgroundColor)}
        onClick={handleConvert}
      >
        Convert to HTML
      </button>

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      {htmlOutput && (
        <div>
          <h3 style={styles.outputHeading}>HTML Output:</h3>
          <div
            style={styles.outputContainer}
            dangerouslySetInnerHTML={{ __html: htmlOutput }}
          />
          <textarea cols={80} rows={10} style={{ ...styles.outputCode, overflowX: 'auto' }}>
            {htmlOutput}
          </textarea>
        </div>
      )}
    </div>
  );
};

export default LexicalToHTMLConverter;