export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel';
  placeholder: string;
  required: boolean;
  value?: string;
  autocomplete?: string;
}

export const createFormTemplate = (fields: FormField[], infoBox?: { title: string; subtitle: string; icon: string }) => {
  const fieldsHTML = fields.map(field => `
    <div class="modal-form-group">
      <label class="modal-label ${field.required ? 'modal-label-required' : ''}">
        ${field.label}
        ${!field.required ? '<span class="modal-label-optional">(Optional)</span>' : ''}
      </label>
      <input 
        id="${field.id}" 
        class="modal-input" 
        type="${field.type}" 
        placeholder="${field.placeholder}" 
        value="${field.value || ''}" 
        ${field.required ? 'required' : ''}
        ${field.autocomplete ? `autocomplete="${field.autocomplete}"` : ''}
      >
    </div>
  `).join('');

  const infoBoxHTML = infoBox ? `
    <div class="modal-info-box">
      <div class="modal-info-content">
        <div class="modal-info-icon">
          ${infoBox.icon}
        </div>
        <div>
          <p class="modal-info-text">${infoBox.title}</p>
          <p class="modal-info-subtext">${infoBox.subtitle}</p>
        </div>
      </div>
    </div>
  ` : '';

  return `
    <div>
      <div class="grid gap-6">
        ${fieldsHTML}
      </div>
      ${infoBoxHTML}
    </div>
  `;
};

export const createLoadingTemplate = (title: string, subtitle: string) => `
  <div class="modal-loading-container">
    <div class="modal-spinner"></div>
    <p class="modal-loading-text">${title}</p>
    <p class="modal-loading-text">${subtitle}</p>
  </div>
`;

export const createStatusTemplate = (type: 'success' | 'error', message: string, submessage?: string) => {
  const icon = type === 'success' 
    ? '<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
    : '<svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';

  return `
    <div class="modal-status-container">
      <div class="modal-status-icon ${type}">
        ${icon}
      </div>
      <p class="modal-status-text">${message}</p>
      ${submessage ? `<p class="modal-status-subtext">${submessage}</p>` : ''}
    </div>
  `;
};