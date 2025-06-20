'use client'
import React from 'react'
import { createPortal } from 'react-dom'
import { FootnoteEditor } from '../../..'
import { PluginComponentWithAnchor } from '@payloadcms/richtext-lexical'
import { ClientProps } from '@/lexical/features/footnote/client'
// import type { PluginComponentWithAnchor } from '../../../../typesClient.js'
// import type { ClientProps } from '../../index.js'
// import { FootnoteEditor } from './FootnoteEditor/index.js'

export const FloatingFootnoteEditorPlugin: PluginComponentWithAnchor<ClientProps> = (props) => {
  const { anchorElem = document.body } = props
  return createPortal(<FootnoteEditor anchorElem={anchorElem} />, anchorElem)
}