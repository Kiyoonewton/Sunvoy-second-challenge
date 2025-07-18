import type { Field } from 'payload'
import { fieldSchemasToFormState } from '@payloadcms/ui/forms/fieldSchemasToFormState'
import { NodeValidation } from '@payloadcms/richtext-lexical'
import { SerializedFootnoteNode } from '../nodes/types'

export const footnoteValidation = (
  sanitizedFields: Field[],
): NodeValidation<SerializedFootnoteNode> => {
  return async ({
    node,
    validation: {
      options: { id, collectionSlug, data, operation, preferences, req },
    },
  }) => {
    const result = await fieldSchemasToFormState({
      id,
      collectionSlug,
      data: node.fields,
      documentData: data,
      fields: sanitizedFields,
      fieldSchemaMap: undefined,
      initialBlockData: node.fields,
      operation: operation === 'create' || operation === 'update' ? operation : 'update',
      permissions: {},
      preferences,
      renderAllFields: false,
      req,
      schemaPath: '',
    })

    const errorPathsSet = new Set<string>()
    for (const fieldKey in result) {
      const fieldState = result[fieldKey]
      if (fieldState?.errorPaths?.length) {
        for (const errorPath of fieldState.errorPaths) {
          errorPathsSet.add(errorPath)
        }
      }
    }
    const errorPaths = Array.from(errorPathsSet)

    if (errorPaths.length) {
      return 'The following fields are invalid: ' + errorPaths.join(', ')
    }

    return true
  }
}