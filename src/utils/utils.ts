/**
 * Some of characters are not been used in telegram but still need to be escaped.
 * This function will escape them automatically.
 * 
 * @param text Input text
 * @returns escaped text
 */
export function escapeMarkdownV2(text: string) {
    return text.replace(/([[\]()><#+-=}{.!])/g, "\\$1")
}