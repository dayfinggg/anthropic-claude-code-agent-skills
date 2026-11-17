const HERE_DOCUMENT_BODY = /<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n\s*\2\b/g

export const withoutHereDocumentBodies = (command: string) => command.replace(HERE_DOCUMENT_BODY, '$3')
