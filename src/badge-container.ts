import { html, LitElement, css, TemplateResult, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { registerCustomCard } from './utils/custom-cards';
import { HomeAssistant } from './ha/types';
import { BadgeContainerCardConfig } from './type';
import { LovelaceBadgeConfig, LovelaceGridOptions, LovelaceLayoutOptions } from './ha/data/lovelace';
import { LovelaceBadge } from './ha/panels/lovelace/hui-badge';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { fireEvent } from './ha/common/dom/fire_event';

registerCustomCard({
  type: 'badge-horizontal-container-card',
  name: 'Badge Horizontal Container Card',
  description: 'A card that displays badges in a horizontal layout.',
});

@customElement('badge-horizontal-container-card')
export class BadgeHorizontalContainerCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  
  @property({ type: Boolean }) public preview = false;

  @state() private _config?: BadgeContainerCardConfig;

  @state() private _badges?: LovelaceBadge[];

  public static async getStubConfig(): Promise<BadgeContainerCardConfig> {
    return {
      type: "custom:badge-horizontal-container-card",
      badges: [],
    };
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    await import('./badge-container-editor');
    return document.createElement('badge-horizontal-container-card-editor');
  }
  
  public setConfig(config: BadgeContainerCardConfig): void {
    if (!config || !config.badges || !Array.isArray(config.badges)) {
      throw new Error("Invalid configuration");
    }
    this._config = config;
    this._badges = config.badges.map((badge) => {
      const element = this._createCardElement(badge);
      return element;
    });
  }

  protected update(changedProperties) {
    super.update(changedProperties);

    if (this._badges) {
      if (changedProperties.has("hass")) {
        this._badges.forEach((badge) => {
          badge.hass = this.hass;
        });
      }
      if (changedProperties.has("preview")) {
        this._badges.forEach((card) => {
          card.preview = this.preview;
        });
      }
    }
  }

  private _createCardElement(cardConfig: LovelaceBadgeConfig) {
    const element = document.createElement("hui-badge") as LovelaceBadge;
    element.hass = this.hass;
    element.preview = this.preview;
    element.config = cardConfig;
    element.load();
    return element;
  }

  protected render() {
    if (!this._config || !this._badges) {
      return nothing;
    }

    return html`
      <div 
        class="badges${classMap({ "left-align": this._config.badges_align === 'left', "right-align": this._config.badges_align === 'right' })}"
      >
        ${this._badges}
      </div>
    `;
  }

    public getGridOptions(): LovelaceGridOptions {
    return {
      columns: 'full',
      rows: 'auto',
    };
  }

  public getLayoutOptions(): LovelaceLayoutOptions {
    return {
      grid_columns: 'full',
      grid_rows: 'auto',
    };
  }

  public getCardSize(): Promise<number> | number {
    return 1;
  }

  static get styles() {
    return css`
    .badges {
      display: flex;
      align-items: flex-start;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin: 0;
    }

    .left-align {
      justify-content: flex-start;
    }

    .right-align {
      justify-content: flex-end;
    }

    .no-wrap {
      flex-wrap: nowrap;
    }

    `
  }
}