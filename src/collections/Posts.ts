'use strict'
import { FootnoteFeature } from '@/lexical/features/footnote/server'
import { FixedToolbarFeature, HTMLConverterFeature, lexicalEditor, lexicalHTML, LinkFeature } from '@payloadcms/richtext-lexical'
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
      required: false,
      admin: {
        description: 'Rich text content with toolbar',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => {
          const features = [...defaultFeatures]

          const filteredFeatures = features.filter(feature =>
            feature.key !== 'subscript' &&
            feature.key !== 'superscript'
          )

          // Add your existing highlight feature at index 4
          filteredFeatures.splice(4, 0, {
            serverFeatureProps: undefined,
            key: 'highlight',
            feature: async () => ({
              ClientFeature: '@/lexical/features/mark/CustomMarkButton.tsx#CustomMarkWithNodeFeatureClient',
              sanitizedServerFeatureProps: undefined
            }),
          })

          // Add the footnote feature before the last item (toolbarFixed)
          filteredFeatures.splice(1, 0, {
            serverFeatureProps: undefined,
            key: 'footnote',
            feature: async () => ({
              ClientFeature: '@/lexical/features/footnote/FootnoteButton.tsx#FootnoteFeatureClient',
              sanitizedServerFeatureProps: undefined
            }),
          })

          console.log('====================================');
          console.log([...filteredFeatures, FixedToolbarFeature()]);
          console.log('====================================');

          // Configure FixedToolbarFeature to include custom highlight button
          return [...filteredFeatures, FixedToolbarFeature(), LinkFeature({
            fields: [
              {
                name: 'url',
                type: 'text',
                required: true,
              }]
          }),
          // Add custom fields to footnotes
          FootnoteFeature({
            fields: [
              {
                name: 'content',
                type: 'richText',
                required: true,
              },
              {
                name: 'number',
                type: 'number',
                required: true,
              },
              {
                name: 'category',
                type: 'select',
                options: [
                  { label: 'Citation', value: 'citation' },
                  { label: 'Explanation', value: 'explanation' },
                  { label: 'Reference', value: 'reference' }
                ]
              },
              {
                name: 'author',
                type: 'text',
                label: 'Citation Author'
              }
            ]
          }),
          HTMLConverterFeature()]
        },
      }),
    },
    {
      ...lexicalHTML('content', { name: 'html_content' }),
    },
  ],
}