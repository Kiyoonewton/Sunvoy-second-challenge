import type { Config, Field, SanitizedConfig } from 'payload'
// import { sanitizeFields } from 'payload'
import type { ClientProps } from '../client/index'
// import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { FootnoteNode } from '../nodes/FootnoteNode.js'
import { getFootnoteBaseFields } from './baseFields.js'
import { footnoteValidation } from './validate.js'
import { i18n } from './i18n.js'
import { sanitizeFields } from 'payload'
import { createNode, createServerFeature } from '@payloadcms/richtext-lexical'

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
    const allFields = [...baseFields, ...customFields]

    const sanitizedFields = await sanitizeFields({
      config: _config as unknown as Config,
      fields: allFields,
      parentIsLocalized,
      requireFieldLevelRichTextEditor: isRoot,
      validRelationships: [],
    })

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#FootnoteFeatureClient',
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