import type { Config, Field } from 'payload'
import { sanitizeFields } from 'payload'
import { i18n } from './i18n'
import { createNode, createServerFeature } from '@payloadcms/richtext-lexical'
import { ClientProps } from '../client'
import { getFootnoteBaseFields } from './baseFields'
import { footnoteValidation } from './validate'
import { FootnoteNode } from '../nodes/FootnoteNode'

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

    const baseFields = getFootnoteBaseFields()
    const customFields = props.fields || []

    const fieldMap = new Map()

    baseFields.forEach(field => {
      if ('name' in field) {
        fieldMap.set(field.name, field)
      }
    })

    // Add custom fields (they can override base fields)
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
      i18n,
      nodes: [
        createNode({
          converters: {
            html: {
              converter: async ({ node }) => {
                const number = node.fields.number
                return `<sup class="footnote-ref"><a href="#fn-${number}" id="fnref-${number}">${number}</a></sup>`
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