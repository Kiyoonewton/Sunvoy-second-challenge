import { customFootnoteConverter, customHighlightConverter, cleanupConverter, extractTextFromNode } from '../utils/htmlConverters'

export const generateHTMLContent = async ({ siblingData, req }: any) => {
  if (!siblingData.content || !siblingData.content.root) {
    return ''
  }

  try {
    const { convertLexicalToHTML, defaultHTMLConverters } = await import('@payloadcms/richtext-lexical')

    let html = await convertLexicalToHTML({
      data: siblingData.content,
      converters: [
        customFootnoteConverter,
        customHighlightConverter,
        ...defaultHTMLConverters.filter((converter: any) => 
          !converter.nodeTypes?.includes('text')
        )
      ],
      req,
    })

    const footnotes: Array<{
      number: number
      content: any
    }> = []

    const extractFootnotes = (node: any): void => {
      if (node.type === 'footnote' && node.fields) {
        footnotes.push({
          number: node.fields.number ?? 1,
          content: node.fields.content,
        })
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(extractFootnotes)
      }
    }

    extractFootnotes(siblingData.content.root)

    if (footnotes.length > 0) {
      footnotes.sort((a, b) => a.number - b.number)

      let footnotesHtml = '\n<footer class="footnotes">\n  <hr>\n  <ul style="list-style: none; padding-left: 0;">\n'

      for (const footnote of footnotes) {
        if (footnote.content && footnote.content.root) {
          let contentHtml = ''

          try {
            contentHtml = await convertLexicalToHTML({
              data: footnote.content,
              converters: [
                customHighlightConverter,
                cleanupConverter,
                ...defaultHTMLConverters.filter((converter: any) => 
                  !converter.nodeTypes?.includes('text') &&
                  !converter.nodeTypes?.includes('*')
                )
              ],
              req,
            })
          } catch (error) {
            console.warn('Footnote conversion error:', error)
            contentHtml = await extractTextFromNode(footnote.content.root)
          }

          contentHtml = contentHtml.replace(/^<p>(.*)<\/p>$/s, '$1').trim()
          
          contentHtml = contentHtml.replace(/\s*<span[^>]*>unknown node[^<]*<\/span>\s*/gi, '')
          contentHtml = contentHtml.replace(/\s*unknown node\s*/gi, '')

          footnotesHtml += `    <li id="fn-${footnote.number}"><a href="#fnref-${footnote.number}" class="footnote-backref" title="Jump back to footnote ${footnote.number} in the text">${footnote.number}.</a> ${contentHtml}</li>\n`
        }
      }

      footnotesHtml += '  </ul>\n</footer>'
      html = html + footnotesHtml
    }

    return html
  } catch (error) {
    console.error('Error generating HTML:', error)
    return 'Error generating HTML'
  }
}