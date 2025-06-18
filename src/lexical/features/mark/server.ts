// // src/lexical/features/mark/server.ts

// // src/lexical/features/mark/server.ts
// // src/lexical/features/mark/server.ts
// // src/lexical/features/mark/server.ts
// import type { FeatureProvider } from '@payloadcms/richtext-lexical'
// import { SimplifiedMarkNode } from './SimplifiedMarkNode'

// const IS_MARK = 1 << 11 // 2048

// export const MarkFeature: FeatureProvider = {
//   key: 'mark',
//   feature: () => {
//     return {
//       nodes: [
//         {
//           node: SimplifiedMarkNode,
//           type: SimplifiedMarkNode.getType(),
//           converters: {
//             html: {
//               nodeTypes: [SimplifiedMarkNode.getType()],
//               converter: ({ childrenHTML }) => {
//                 return `<mark>${childrenHTML}</mark>`
//               },
//             },
//           },
//         },
//       ],
//       ClientFeature: '@/lexical/features/mark/client.tsx#default',
//       hooks: {
//         // Convert mark nodes to format-based on save
//         beforeChange: ({ incomingEditorState }) => {
//           if (!incomingEditorState?.root) return incomingEditorState

//           const convertNode = (node: any): any => {
//             // Convert mark nodes to text nodes with format
//             if (node.type === 'mark' && node.children) {
//               return node.children.map((child: any) => {
//                 if (child.type === 'text') {
//                   return {
//                     ...child,
//                     format: (child.format || 0) | IS_MARK,
//                   }
//                 }
//                 return child
//               })
//             }

//             // Process children recursively
//             if (node.children) {
//               return {
//                 ...node,
//                 children: node.children.flatMap((child: any) => convertNode(child)),
//               }
//             }

//             return node
//           }

//           return {
//             ...incomingEditorState,
//             root: convertNode(incomingEditorState.root),
//           }
//         },
//       },
//     }
//   },
// }

// // export const MarkFeature: FeatureProvider = {
// //   key: 'mark',
// //   feature: () => {
// //     return {
// //       nodes: [
// //         {
// //           node: MarkNode,
// //           type: MarkNode.getType(),
// //           converters: {
// //             html: {
// //               nodeTypes: [MarkNode.getType()],
// //               converter: ({ node, childrenHTML }) => {
// //                 return `<mark>${childrenHTML || node.getTextContent()}</mark>`
// //               },
// //             },
// //           },
// //         },
// //       ],
// //       ClientFeature: '@/lexical/features/mark/client.tsx#default',
// //     }
// //   },
// // }
