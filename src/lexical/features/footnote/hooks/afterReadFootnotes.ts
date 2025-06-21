import type { FieldHook } from 'payload'

export const afterReadFootnotes: FieldHook = async ({ value, req }) => {
  if (!value || typeof value !== 'object' || !value.root) {
    return value
  }

  try {
    const footnotes: Array<{ 
      number: number
      content: any
    }> = []
    
    const extractFootnotes = (node: any): void => {
      if (node.type === 'footnote' && node.fields) {
        footnotes.push({
          number: node.fields.number,
          content: node.fields.content,
        })
      }
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(extractFootnotes)
      }
    }
    
    extractFootnotes(value.root)
    
    if (footnotes.length > 0) {
      return {
        ...value,
        _footnotes: footnotes
      }
    }
    
    return value
  } catch (error) {
    console.error('Error extracting footnotes:', error)
    return value
  }
}