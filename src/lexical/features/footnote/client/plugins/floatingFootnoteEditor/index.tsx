'use client'
import React from 'react'
import { createPortal } from 'react-dom'
import { FootnoteEditor } from './FootnoteEditor'
import { PluginComponentWithAnchor } from '@payloadcms/richtext-lexical'
import { ClientProps } from '../../index'

export const FloatingFootnoteEditorPlugin: PluginComponentWithAnchor<ClientProps> = (props) => {
  const { anchorElem = document.body } = props
    
  return createPortal(<FootnoteEditor anchorElem={anchorElem} />, anchorElem)
}