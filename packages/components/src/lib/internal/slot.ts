/**
 * Get the text content of a slot, including all text content of its assigned
 * nodes.
 */
export function getTextContent(slot: HTMLSlotElement): string {
  let textContent = '';
  for (const node of slot.assignedNodes({flatten: true})) {
    if (
      node.nodeType === Node.TEXT_NODE ||
      node.nodeType === Node.ELEMENT_NODE
    ) {
      textContent += node.textContent;
    }
  }
  return textContent;
}
