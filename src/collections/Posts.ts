// import { configureMarkFeature } from '@/lexical/features/mark/markFeature'
// import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
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

          // Remove subscript and superscript features
          // These are typically in the default features - we filter them out
          const filteredFeatures = features.filter(feature =>
            feature.key !== 'subscript' &&
            feature.key !== 'superscript'
          )

          // Add your existing highlight feature
          filteredFeatures.splice(4, 0, {
            serverFeatureProps: undefined,
            key: 'highlight',
            feature: async () => ({
              ClientFeature: '@/lexical/features/mark/CustomMarkButton.tsx#CustomMarkWithNodeFeatureClient',
              sanitizedServerFeatureProps: undefined
            }),
          })

          // Add the footnote feature
          filteredFeatures.push({
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

          // If you need to use editorConfig, obtain it from the lexicalEditor context or pass it as an argument.
          // For now, we'll remove the usage to fix the error, as editorConfig is not defined in this scope.
          // If you need to resolve features asynchronously, ensure you have access to the required config.

          // const resolvedFeatures = await Promise.all(
          //   filteredFeatures.map(async (featureItem) => ({
          //     ...featureItem,
          //     feature:
          //       typeof featureItem.feature === 'function'
          //         ? await featureItem.feature(editorConfig)
          //         : featureItem.feature,
          //   }))
          // );
          return [...filteredFeatures, FixedToolbarFeature()]

        },
      }),
    },
  ],
}