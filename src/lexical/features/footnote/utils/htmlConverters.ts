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

export const cleanupConverter = {
  converter: async ({ node, converters, ...rest }: any) => {
    switch (node.type) {
      case 'linebreak':
        return '<br>'
      
      case 'tab':
        return '&nbsp;&nbsp;&nbsp;&nbsp;'
      
      case 'horizontalrule':
        return '<hr>'
      
      default:
        if (node.text && typeof node.text === 'string') {
          return convertTextNode(node)
        }
        
        if (node.children && Array.isArray(node.children)) {
          return await convertChildren(node.children, converters, rest)
        }
        
        console.warn(`Skipping unknown node type: ${node.type}`, node)
        return ''
    }
  },
  nodeTypes: ['*'],
}

const convertTextNode = (node: any): string => {
  let text = node.text || ''
  
  if (!text) return ''
  
  if (node.format & 1) text = `<strong>${text}</strong>`     
  if (node.format & 2) text = `<em>${text}</em>`             
  if (node.format & 4) text = `<u>${text}</u>`              
  if (node.format & 8) text = `<s>${text}</s>`               
  if (node.format & 16) text = `<code>${text}</code>`        
  if (node.format & 32) text = `<sub>${text}</sub>`          
  if (node.format & 64) text = `<sup>${text}</sup>`          
  if (node.format & 128) text = `<mark>${text}</mark>`       
  
  return text
}

const convertChildren = async (children: any[], converters?: any, rest?: any): Promise<string> => {
  if (!children || !Array.isArray(children)) return ''
  
  const results: string[] = []
  
  for (const child of children) {
    if (child && typeof child === 'object') {
      let converted = ''
      
      if (converters && Array.isArray(converters)) {
        for (const converter of converters) {
          if (converter.nodeTypes?.includes(child.type) || converter.nodeTypes?.includes('*')) {
            try {
              const result = await converter.converter({ node: child, converters, ...rest })
              if (result && typeof result === 'string') {
                converted = result
                break
              }
            } catch (error) {
              console.warn(`Converter error for ${child.type}:`, error)
            }
          }
        }
      }
      
      if (!converted) {
        if (child.type === 'text') {
          converted = convertTextNode(child)
        } else if (child.children && Array.isArray(child.children)) {
          converted = await convertChildren(child.children, converters, rest)
        }
      }
      
      if (converted) {
        results.push(converted)
      }
    }
  }
  
  return results.join('')
}

export const extractTextFromNode = async (node: any): Promise<string> => {
  if (!node) return ''
  
  if (node.type === 'text') {
    return convertTextNode(node)
  } else if (node.type === 'paragraph') {
    const childrenHtml = await convertChildren(node.children || [])
    return childrenHtml ? `<p>${childrenHtml}</p>` : ''
  } else if (node.type === 'link' || node.type === 'autolink') {
    const childrenHtml = await convertChildren(node.children || [])
    const url = node.fields?.url || '#'
    const target = node.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
    return `<a href="${url}"${target}>${childrenHtml}</a>`
  } else if (node.type === 'root') {
    return await convertChildren(node.children || [])
  } else if (node.children && Array.isArray(node.children)) {
    return await convertChildren(node.children)
  }
  
  return ''
}