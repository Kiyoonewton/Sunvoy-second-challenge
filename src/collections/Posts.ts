// import { configureMarkFeature } from '@/lexical/features/mark/markFeature'
// import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      // editor: lexicalEditor({
      //   features: [configureMarkFeature]
      // })
    }
  ],
}