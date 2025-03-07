import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import sanitizeHtml from 'sanitize-html';
export const jsonToHtml = (content: string) =>
    sanitizeHtml(generateHTML(JSON.parse(content), [StarterKit.configure()]));


