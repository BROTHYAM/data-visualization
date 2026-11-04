const headerTemplate = document.createElement('template');

headerTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    }

    header {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      height: 64px;
      padding: 0 24px;
      background: #fff;
      border-bottom: 1px solid #dce3ee;
    }

    .brand {
      color: #172033;
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    a {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      color: #3156a4;
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.2;
      text-decoration: none;
      white-space: nowrap;
    }

    a:hover {
      background: #f3f6fb;
      border-color: #3156a4;
    }

    a:focus-visible {
      outline: 2px solid #3156a4;
      outline-offset: 3px;
    }

    @media (max-width: 480px) {
      header { padding: 0 16px; }
      .brand { font-size: 0.8rem; }
      a { padding: 8px 10px; }
    }
  </style>
  <header>
    <a href="/"><span aria-hidden="true">&larr;</span> Main menu</a>
  </header>
`;

class AssignmentHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(headerTemplate.content.cloneNode(true));
  }
}

if (!customElements.get('assignment-header')) {
  customElements.define('assignment-header', AssignmentHeader);
}
