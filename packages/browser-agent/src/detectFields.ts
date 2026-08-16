import { Page } from "playwright";
import { DetectedField } from "./types";

const FIELD_TAGS = ["input", "select", "textarea"];
const SKIP_INPUT_TYPES = ["hidden", "submit", "button", "image", "reset"];

interface RawField {
  selector: string;
  label: string;
  inputType: string;
  required: boolean;
}

/**
 * Walks the DOM (scoped to `scopeSelector` if given, e.g. an ATS-specific form
 * container) and stamps a `data-job-agent-field` marker on every fillable
 * input/select/textarea, so later fill calls can target them with a stable
 * selector instead of a fragile generated CSS path. Runs in-page via
 * page.evaluate — this is standard DOM code, not Node code, despite living in
 * a .ts file compiled with the DOM lib for type-checking purposes only.
 */
export async function detectFormFields(page: Page, scopeSelector?: string): Promise<DetectedField[]> {
  const raw = await page.evaluate(
    ({ scopeSelector, fieldTags, skipTypes }) => {
      const root = scopeSelector ? document.querySelector(scopeSelector) : document.body;
      if (!root) return [];

      function labelFor(el: Element): string {
        const id = el.getAttribute("id");
        if (id) {
          const byFor = document.querySelector(`label[for="${CSS.escape(id)}"]`);
          if (byFor?.textContent?.trim()) return byFor.textContent.trim();
        }
        const ariaLabel = el.getAttribute("aria-label");
        if (ariaLabel?.trim()) return ariaLabel.trim();
        const wrappingLabel = el.closest("label");
        if (wrappingLabel?.textContent?.trim()) return wrappingLabel.textContent.trim();
        const placeholder = el.getAttribute("placeholder");
        if (placeholder?.trim()) return placeholder.trim();
        let sibling = el.previousElementSibling;
        while (sibling) {
          const text = sibling.textContent?.trim();
          if (text) return text;
          sibling = sibling.previousElementSibling;
        }
        return "";
      }

      const elements = Array.from(root.querySelectorAll(fieldTags.join(",")));
      const fields: RawField[] = [];
      let index = 0;

      for (const el of elements) {
        const tag = el.tagName.toLowerCase();
        const type = (el.getAttribute("type") || "text").toLowerCase();
        if (tag === "input" && skipTypes.includes(type)) continue;
        if ((el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).disabled) continue;

        const marker = `f${index}`;
        el.setAttribute("data-job-agent-field", marker);

        let inputType = "unknown";
        if (tag === "textarea") inputType = "textarea";
        else if (tag === "select") inputType = "select";
        else if (type === "checkbox") inputType = "checkbox";
        else if (type === "radio") inputType = "radio";
        else if (type === "file") inputType = "file";
        else if (type === "email") inputType = "email";
        else if (type === "tel") inputType = "tel";
        else if (["text", "number", "url", "search"].includes(type)) inputType = "text";

        fields.push({
          selector: `[data-job-agent-field="${marker}"]`,
          label: labelFor(el),
          inputType,
          required: el.hasAttribute("required") || el.getAttribute("aria-required") === "true",
        });
        index++;
      }

      return fields;
    },
    { scopeSelector: scopeSelector ?? null, fieldTags: FIELD_TAGS, skipTypes: SKIP_INPUT_TYPES },
  );

  return raw as unknown as DetectedField[];
}
