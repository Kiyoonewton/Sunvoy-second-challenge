import type { Field } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const getFootnoteBaseFields = (): Field[] => {
  return [
    {
      name: 'content',
      type: 'richText',
      label: 'Footnote Content',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          // Only allow specific features for footnote content
          ...defaultFeatures.filter(feature => 
            ['paragraph', 'bold', 'italic', 'strikethrough', 'link'].includes(feature.key)
          )
        ]
      })
    },
    {
      name: 'number',
      type: 'number',
      label: 'Footnote Number',
      required: true,
      min: 1,
    },
  ]
}