'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import { $getRoot, COMMAND_PRIORITY_LOW } from 'lexical'
import { useEffect } from 'react'
import { ClientProps } from '../../index'
import { PluginComponent } from '@payloadcms/richtext-lexical'
import { $insertFootnote, FootnoteNode, TOGGLE_FOOTNOTE_COMMAND } from '../../../nodes/FootnoteNode'

function renumberAllFootnotes(): void {
  const root = $getRoot()
  const footnoteNodes: any[] = []
  
  const collectFootnotes = (node: any): void => {
    if (node.getType && node.getType() === 'footnote') {
      footnoteNodes.push(node)
    }
    
    if (node.getChildren) {
      const children = node.getChildren()
      for (const child of children) {
        collectFootnotes(child)
      }
    }
  }
  
  collectFootnotes(root)
    
  footnoteNodes.forEach((node, index) => {
    const currentFields = node.getFields()
    const newNumber = index + 1
        
    if (currentFields.number !== newNumber) {
      const updatedFields = {
        ...currentFields,
        number: newNumber
      }
      node.setFields(updatedFields)
      
      const verifyFields = node.getFields()
    } else {
    }
  })
  
}

function getNextFootnoteNumber(): number {
  const root = $getRoot()
  let maxNumber = 0
  
  const findFootnotes = (node: any): void => {
    if (node.getType && node.getType() === 'footnote') {
      const fields = node.getFields()
      if (fields && typeof fields.number === 'number' && fields.number > maxNumber) {
        maxNumber = fields.number
      }
    }
    
    // Recursively check children
    if (node.getChildren) {
      const children = node.getChildren()
      for (const child of children) {
        findFootnotes(child)
      }
    }
  }
  
  findFootnotes(root)
  return maxNumber + 1
}

export const FootnotePlugin: PluginComponent<ClientProps> = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([FootnoteNode])) {
      throw new Error('FootnotePlugin: FootnoteNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand(
        TOGGLE_FOOTNOTE_COMMAND,
        (payload) => {
          
          if (payload) {
            if (!payload.fields.content) {
              payload.fields.content = {
                root: {
                  children: [
                    {
                      children: [
                        {
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: 'Enter your footnote content here...2',
                          type: 'text',
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      type: 'paragraph',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'root',
                  version: 1,
                },
              }
            }
            
            payload.fields.number = 999
            
            const existingFootnotes: any[] = []
            const collectExisting = (node: any): void => {
              if (node.getType && node.getType() === 'footnote') {
                existingFootnotes.push({ key: node.getKey(), number: node.getFields().number })
              }
              if (node.getChildren) {
                node.getChildren().forEach(collectExisting)
              }
            }
            collectExisting($getRoot())
            
            $insertFootnote(payload)            
            const afterInsertion: any[] = []
            const collectAfterInsertion = (node: any): void => {
              if (node.getType && node.getType() === 'footnote') {
                afterInsertion.push({ key: node.getKey(), number: node.getFields().number })
              }
              if (node.getChildren) {
                node.getChildren().forEach(collectAfterInsertion)
              }
            }
            collectAfterInsertion($getRoot())
            
            renumberAllFootnotes()
            
            const finalState: any[] = []
            const collectFinalState = (node: any): void => {
              if (node.getType && node.getType() === 'footnote') {
                finalState.push({ key: node.getKey(), number: node.getFields().number })
              }
              if (node.getChildren) {
                node.getChildren().forEach(collectFinalState)
              }
            }
            collectFinalState($getRoot())
          }
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      
      editor.registerMutationListener(FootnoteNode, (mutatedNodes) => {
        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'destroyed') {
            renumberAllFootnotes()
            break
          }
        }
      })
    )
  }, [editor])

  return null
}