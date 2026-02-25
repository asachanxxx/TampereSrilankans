import templates from '../../event-ui/src/config/message-templates.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemplateChannel = 'whatsapp' | 'email';

export interface TemplateData {
  display_name: string;
  event_name: string;
  ticket_number: string;
  amount: string;
  due_date: string;
  bank_name?: string;
  iban?: string;
  account_holder?: string;
  reference?: string;
  notes?: string;
}

interface RawTemplate {
  template_key: string;
  channel: TemplateChannel;
  subject?: string;
  body: string;
}

export interface RenderedMessage {
  subject?: string;
  body: string;
}

// ---------------------------------------------------------------------------
// TemplateService
// ---------------------------------------------------------------------------

/**
 * Loads message templates from the shared JSON config and renders them
 * by substituting {{placeholder}} tokens with runtime data.
 *
 * Template file: event-ui/src/config/message-templates.json
 *
 * Special placeholder: {{notes_block}} — expands to a paragraph containing
 * the notes text when notes are present, or to an empty string when absent,
 * so templates never contain a blank "Notes:" line.
 */
export class TemplateService {
  private templates: RawTemplate[] = templates as RawTemplate[];

  /**
   * Render a template by key + channel.
   *
   * @param key       - The template_key value in message-templates.json
   * @param channel   - 'whatsapp' | 'email'
   * @param data      - Placeholder values to substitute
   * @returns RenderedMessage with `body` always set; `subject` when channel = 'email'
   * @throws Error if no matching template found
   */
  render(key: string, channel: TemplateChannel, data: TemplateData): RenderedMessage {
    const tpl = this.templates.find(
      (t) => t.template_key === key && t.channel === channel
    );
    if (!tpl) {
      throw new Error(`Message template not found: key="${key}" channel="${channel}"`);
    }

    // Build notes block — include trailing newline so the paragraph is separated
    const notesBlock = data.notes
      ? `\nNote: ${data.notes}\n`
      : '';

    const substituted = this.substitute(tpl.body, { ...data, notes_block: notesBlock });
    const result: RenderedMessage = { body: substituted };

    if (tpl.subject) {
      result.subject = this.substitute(tpl.subject, { ...data, notes_block: notesBlock });
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private substitute(
    template: string,
    values: Record<string, string | undefined>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const val = values[key];
      return val !== undefined ? val : `{{${key}}}`;
    });
  }
}
