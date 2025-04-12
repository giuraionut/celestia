import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import sanitizeHtml from 'sanitize-html';
export const jsonToHtml = (content: string) => {
    try {
        const parsedContent = JSON.parse(content);
        return sanitizeHtml(generateHTML(parsedContent, [StarterKit.configure()]))
    }
    catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error parsing JSON:', error.message);
        }
        else console.error('Error parsing JSON:', error);
        return content;
    }
};


