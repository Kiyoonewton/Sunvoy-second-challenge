import type { Config, Field, FieldSchemaMap } from 'payload'
import { sanitizeFields } from 'payload'
import { i18n } from './i18n'
import { createNode, createServerFeature } from '@payloadcms/richtext-lexical'
import { ClientProps } from '../client'
import { footnoteValidation } from './validate'
import { FootnoteNode } from '../nodes/FootnoteNode'
import { FootnoteMarkdownTransformer } from '../markdownTransformer'

export type FootnoteFeatureServerProps = {
  fields?: Field[]
}

export const FootnoteFeature = createServerFeature<
  FootnoteFeatureServerProps,
  FootnoteFeatureServerProps,
  ClientProps
>({
  feature: async ({ config: _config, isRoot, parentIsLocalized, props }) => {
    if (!props) {
      props = {}
    }

    const customFields = props.fields || []
    const fieldMap = new Map()
    
    customFields.forEach(field => {
      if ('name' in field) {
        fieldMap.set(field.name, field)
      }
    })

    const allFields = Array.from(fieldMap.values())

    const sanitizedFields = await sanitizeFields({
      config: _config as unknown as Config,
      fields: allFields,
      parentIsLocalized,
      requireFieldLevelRichTextEditor: isRoot,
      validRelationships: [],
    })

    return {
      ClientFeature: '@/lexical/features/footnote/client/index#FootnoteFeatureClient',
      clientFeatureProps: {} as ClientProps,
      generateSchemaMap: () => {
        const schemaMap: FieldSchemaMap = new Map()

        schemaMap.set('fields', {
          fields: sanitizedFields,
        })

        sanitizedFields.forEach((field) => {
          if ('name' in field) {
            schemaMap.set(`fields.${field.name}`, field)
          }
        })

        return schemaMap
      },
      i18n,
      markdownTransformers: [FootnoteMarkdownTransformer],
      nodes: [
        createNode({
          converters: {
            html: {
              converter: async ({
                converters,
                currentDepth,
                depth,
                draft,
                node,
                overrideAccess,
                parent,
                req,
                showHiddenFields,
              }) => {
                const number = node.fields?.number ?? 1
                
                const footnoteNumber = typeof number === 'number' && number > 0 ? number : 1

                let textContent = String(footnoteNumber)
                if (node.children && node.children.length > 0) {
                  const { convertLexicalNodesToHTML } = await import('@payloadcms/richtext-lexical')

                  const childrenText = await convertLexicalNodesToHTML({
                    converters,
                    currentDepth,
                    depth,
                    draft,
                    lexicalNodes: node.children,
                    overrideAccess,
                    parent: {
                      ...node,
                      parent,
                    },
                    req,
                    showHiddenFields,
                  })

                  if (childrenText) {
                    textContent = childrenText
                  }
                }

                return `<sup class="footnote-ref"><a href="#fn-${footnoteNumber}" id="fnref-${footnoteNumber}">${textContent}</a></sup>`
              },
              nodeTypes: [FootnoteNode.getType()],
            },
          },
          getSubFields: () => sanitizedFields,
          getSubFieldsData: ({ node }) => node?.fields,
          node: FootnoteNode,
          validations: [footnoteValidation(sanitizedFields)],
        }),
      ],
      sanitizedServerFeatureProps: props,
    }
  },
  key: 'footnote',
})