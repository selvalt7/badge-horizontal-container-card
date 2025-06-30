import { html, LitElement, nothing, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant } from "./ha/types";
import { BadgeContainerCardConfig } from "./type";
import { mdiArrowLeft, mdiDrag, mdiPencil, mdiDelete } from "@mdi/js";
import { fireEvent } from "./ha/common/dom/fire_event";
import { LovelaceBadgeConfig } from "./ha/data/lovelace";
import memoizeOne from "memoize-one";

const SCHEMA = [
  {
    name: "badges_align",
    label: "Badges Alignment",
    selector: {
      select: {
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      },
    },
  },
]

@customElement("badge-horizontal-container-card-editor")
export class BadgeContainerEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public lovelace!: any;
  @property({ type: Number }) public index = 0;
  @state() private _config?: BadgeContainerCardConfig;
  @state() private _selectedBadgeIndex: number = -1;

  setConfig(config: BadgeContainerCardConfig): void {
    this._config = config;
  }

  private _schema = memoizeOne(
    () => 
    [
      {
        name: "new_badge",
        selector: { select: {
          options: [
            { value: "custom:hui-entity-badge", label: "Entity" },
            ...window.customBadges?.map((badge: any) => ({
              value: `custom:${badge.type}`,
              label: badge.name || badge.type
            })),
          ],
          mode: "dropdown",
        }},
      },
    ]
  )

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }
    fireEvent(this, "close-dialog");
    const selected = this._selectedBadgeIndex ?? -1;

    const backElement = html`
      <div class="header">
        <div class="back-title">
          <ha-icon-button
            .path=${mdiArrowLeft}
            @click=${() => {
              this._selectedBadgeIndex = -1;
            }}
          ></ha-icon-button>
        </div>
      </div>
    `;

    if (selected > -1) {
      return html`
        ${backElement}
        <hui-card-element-editor
          .hass=${this.hass}
          .value=${this._config.badges[selected]}
          .lovelace=${this.lovelace}
          @config-changed=${this._handleConfigChanged}
          @GUImode-changed=${this._handleGUIModeChanged}
        ></hui-card-element-editor>
      `;
    }

    return html`
      <ha-sortable handle-selector=".handle" @item-moved=${this._handleBadgeMoved}>
        <div class="badges">
          ${this._config.badges.map(
            (badge, index) => html`
              <div class="badge-item">
                <div class="handle">
                  <ha-svg-icon .path=${mdiDrag}></ha-svg-icon>
                  <span>${badge.type}</span>
                </div>
                <div>
                  <ha-icon-button class="edit-badge"
                    .path=${mdiPencil}
                    .index=${index}
                    @click=${this.editBadge}
                  ></ha-icon-button>
                  <ha-icon-button class="delete-badge"
                    .path=${mdiDelete}
                    .index=${index}
                    @click=${this._deleteBadge}
                  ></ha-icon-button>
                </div>
              </div>
            `
          )}
        </div>
      </ha-sortable>
      <ha-form
        .hass=${this.hass}
        .schema=${this._schema()}
        .data=${{ new_badge: "" }}
        .computeLabel=${() => this.hass.localize("ui.panel.lovelace.editor.section.add_badge")}
        @value-changed=${this._handleBadgePicked}
      ></ha-form>
      <ha-form
        .hass=${this.hass}
        .schema=${SCHEMA}
        .data=${this._config}
        .computeLabel=${(schema) => schema.label}
        @value-changed=${(ev: CustomEvent) => {
          ev.stopPropagation();
          this._config = { ...this._config, ...ev.detail.value };
          fireEvent(this, "config-changed", { config: this._config });
        }}
      ></ha-form>
    `;
  }

  private async _handleBadgePicked(ev: CustomEvent) {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }

    const badgeType = ev.detail.value.new_badge;

    if (!badgeType) {
      return;
    }

    const badgeConfig = await this._getBadgeStubConfig(badgeType);
    badgeConfig.type = badgeType;

    const badges = [...this._config.badges, badgeConfig];
    this._config = {
      ...this._config,
      badges
    };
    fireEvent(this, "config-changed", { config: this._config });
  }

  private async _getBadgeStubConfig(badgeType: string): Promise<LovelaceBadgeConfig> {
    const badgeClass = customElements.get(badgeType.replace("custom:", "")) as any;
    return await badgeClass.getStubConfig(this.hass, this.hass.entities, this.hass.entities);
  }

  private _handleConfigChanged(ev: CustomEvent) {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }
    const badges = [...this._config.badges];
    const newBadge = ev.detail.config as LovelaceBadgeConfig;
    badges[this._selectedBadgeIndex] = newBadge;
    this._config = { ...this._config, badges };
    fireEvent(this, "config-changed", { config: this._config });
  }

  private _handleGUIModeChanged(ev: CustomEvent) {
    ev.stopPropagation();
  }

  private _handleBadgeMoved(ev: CustomEvent) {
    ev.stopPropagation();
    if (!this._config?.badges || !this.hass) {
      return;
    }
    const { oldIndex, newIndex } = ev.detail;
    const newBadges = this._config?.badges.concat();

    newBadges.splice(newIndex, 0, newBadges.splice(oldIndex, 1)[0]);

    this._config = { ...this._config, badges: newBadges };

    fireEvent(this, 'config-changed', { config: this._config });
  }

  private editBadge(ev: CustomEvent) {
    const index = (ev.currentTarget as any).index ?? -1;
    this._selectedBadgeIndex = index;
  }

  private _deleteBadge(ev: CustomEvent) {
    ev.stopPropagation();
    const index = (ev.currentTarget as any).index ?? -1;
    if (!this._config || index < 0) {
      return;
    }
    const badges = [...this._config.badges];
    badges.splice(index, 1);
    this._config = { ...this._config, badges };
    fireEvent(this, "config-changed", { config: this._config });
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .back-title {
        display: flex;
        align-items: center;
        font-size: 18px;
      }

      .handle {
        cursor: grab;
        padding-inline-end: 8px;
        align-self: flex-start;
        margin: 16px 0;
      }

      .badge-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .edit-badge, .delete-badge {
        align-self: flex-start;
        margin: 4px 0px;
      }

      ha-form:nth-of-type(2) {
        margin-top: 16px;
      }
    `;
  }
}