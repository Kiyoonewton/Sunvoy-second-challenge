'use strict'
import { afterReadFootnotes } from '@/lexical/features/footnote/hooks/afterReadFootnotes'
import { generateHTMLContent } from '@/lexical/features/footnote/hooks/generateHTMLContent'
import { FootnoteFeature } from '@/lexical/features/footnote/server'
import {
  defaultHTMLConverters,
  FixedToolbarFeature,
  HTMLConverterFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
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
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => {
          const filteredFeatures = defaultFeatures.filter(feature =>
            feature.key !== 'subscript' &&
            feature.key !== 'superscript'
          )

          const highlightFeature = {
            serverFeatureProps: undefined,
            key: 'highlight',
            feature: async () => ({
              ClientFeature: '@/lexical/features/mark/CustomMarkButton.tsx#CustomMarkWithNodeFeatureClient',
              sanitizedServerFeatureProps: undefined
            }),
          }

          return [
            ...filteredFeatures,
            highlightFeature,
            FootnoteFeature({
              fields: [
                {
                  name: 'content',
                  type: 'richText',
                  label: 'Footnote Content',
                  required: true,
                  editor: lexicalEditor({
                    features: ({ defaultFeatures }) => {
                      const allowedFeatures = defaultFeatures.filter(feature =>
                        ['paragraph', 'bold', 'italic', 'strikethrough', 'link'].includes(feature.key)
                      )
                      return [...allowedFeatures, FixedToolbarFeature()]
                    }
                  })
                },
              ],

            }),
            FixedToolbarFeature({}),
            HTMLConverterFeature({
              converters: [
                ...defaultHTMLConverters
              ]
            }),
          ]
        },
      }),
      hooks: {
        afterRead: [afterReadFootnotes],
      }
    },
    {
      name: 'html_content',
      type: 'textarea',
      admin: {
        readOnly: true,
        description: 'Auto-generated HTML with footnotes',
      },
      hooks: {
        beforeChange: [generateHTMLContent],
      }
    }
  ],
}