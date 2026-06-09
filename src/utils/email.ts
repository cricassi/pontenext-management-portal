const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEMPLATE_VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
const ALLOWED_TEMPLATE_VARIABLES = new Set([
  "recipient_name",
  "campaign_subject",
  "association_name",
]);

type RenderEmailOptions = {
  recipientName?: string | null;
  campaignSubject: string;
  associationName?: string;
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function parseManualRecipients(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^(.*?)<([^>]+)>$/);

      if (!match) {
        return {
          email: normalizeEmail(entry),
          recipientName: null,
        };
      }

      return {
        recipientName: match[1].trim() || null,
        email: normalizeEmail(match[2]),
      };
    });
}

export function getUnknownTemplateVariables(value: string) {
  const unknownVariables = new Set<string>();
  const matches = value.matchAll(TEMPLATE_VARIABLE_PATTERN);

  for (const match of matches) {
    const variableName = match[1];

    if (!ALLOWED_TEMPLATE_VARIABLES.has(variableName)) {
      unknownVariables.add(variableName);
    }
  }

  return [...unknownVariables].sort();
}

export function renderEmailText(value: string, options: RenderEmailOptions) {
  const replacements: Record<string, string> = {
    recipient_name: options.recipientName || "Destinatario",
    campaign_subject: options.campaignSubject,
    association_name: options.associationName ?? "Ponte Next",
  };

  return value.replace(TEMPLATE_VARIABLE_PATTERN, (token, variableName) => {
    return replacements[variableName] ?? token;
  });
}

export function renderEmailHtml(value: string, options: RenderEmailOptions) {
  return renderEmailText(value, options)
    .split(/\r?\n/)
    .map((line) => escapeHtml(line))
    .join("<br>");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
