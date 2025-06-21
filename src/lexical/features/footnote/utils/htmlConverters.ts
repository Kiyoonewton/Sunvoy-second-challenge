export const customFootnoteConverter = {
  converter: async ({ node }: any) => {
    const number = node.fields?.number ?? 1
    return `<sup class="footnote-ref"><a href="#fn-${number}" id="fnref-${number}">${number}</a></sup>`
  },
  nodeTypes: ['footnote'],
}

export const customHighlightConverter = {
  converter: async ({ node, converters, ...rest }: any) => {
    if (node.type === 'text' && node.format & 128) {
      let text = node.text || ''
      
      if (node.format & 1) text = `<strong>${text}</strong>`
      if (node.format & 2) text = `<em>${text}</em>`
      if (node.format & 8) text = `<s>${text}</s>`
      if (node.format & 4) text = `<u>${text}</u>`
      if (node.format & 16) text = `<code>${text}</code>`
      
      text = `<mark>${text}</mark>`
      
      return text
    }
    
    if (node.type === 'text') {
      const { defaultHTMLConverters } = await import('@payloadcms/richtext-lexical')
      const defaultTextConverter = defaultHTMLConverters.find(
        (converter: any) => converter.nodeTypes?.includes('text')
      )
      if (defaultTextConverter) {
        return await defaultTextConverter.converter({ node, converters, ...rest })
      }
    }
    
    return null
  },
  nodeTypes: ['text'],
}

export const extractTextFromNode = (node: any): string => {
  if (node.type === 'text') {
    let text = node.text || ''
    if (node.format & 1) text = `<strong>${text}</strong>`
    if (node.format & 2) text = `<em>${text}</em>`
    if (node.format & 8) text = `<s>${text}</s>`
    if (node.format & 4) text = `<u>${text}</u>`
    if (node.format & 16) text = `<code>${text}</code>`
    if (node.format & 128) text = `<mark>${text}</mark>`
    return text
  } else if (node.type === 'paragraph') {
    const childrenHtml = node.children?.map(extractTextFromNode).join('') || ''
    return childrenHtml ? `<p>${childrenHtml}</p>` : ''
  } else if (node.type === 'link' || node.type === 'autolink') {
    const childrenHtml = node.children?.map(extractTextFromNode).join('') || ''
    const url = node.fields?.url || '#'
    const target = node.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
    return `<a href="${url}"${target}>${childrenHtml}</a>`
  } else if (node.type === 'root') {
    return node.children?.map(extractTextFromNode).join('\n') || ''
  }
  return ''
}