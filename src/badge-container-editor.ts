import { html, LitElement, nothing, css } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { HomeAssistant } from "./ha/types";
import { BadgeContainerCardConfig } from "./type";
import { mdiArrowLeft, mdiDrag, mdiPencil, mdiDelete, mdiEye, mdiCodeBraces, mdiListBoxOutline } from "@mdi/js";
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

  @state() protected _GUImode = true;

  @state() protected _guiModeAvailable? = true;

  @query("hui-card-element-editor")
  protected _cardEditorEl?: LitElement;

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

    const selected = this._selectedBadgeIndex ?? -1;

    const isGuiMode = !this._cardEditorEl || this._GUImode;

    const backElement = html`
      <div class="header">
        <div class="back-title">
          <ha-icon-button
            .path=${mdiArrowLeft}
            @click=${() => {
              this._selectedBadgeIndex = -1;
              this._GUImode = true;
            }}
          ></ha-icon-button>
          ${this._selectedBadgeIndex != -1 ? this._getBadgeName(this._config.badges[this._selectedBadgeIndex].type) : ""}
        </div>
        <ha-icon-button
          class="gui-mode-button"
          @click=${this._toggleMode}
          .disabled=${!this._guiModeAvailable}
          .label=${this.hass!.localize(
            isGuiMode
              ? "ui.panel.lovelace.editor.edit_card.show_code_editor"
              : "ui.panel.lovelace.editor.edit_card.show_visual_editor"
          )}
          .path=${isGuiMode ? mdiCodeBraces : mdiListBoxOutline}
        ></ha-icon-button>
      </div>
    `;

    if (selected > -1) {
      return html`
        ${backElement}
        ${isGuiMode ? html`
        <ha-expansion-panel .expanded=${false}>
          <div
            slot="header"
            role="heading"
          >
            <ha-svg-icon .path=${mdiEye}></ha-svg-icon>
            ${this.hass.localize(`ui.panel.lovelace.editor.edit_card.tab_visibility`)}
          </div>
          <div>
            <hui-card-visibility-editor
              .hass=${this.hass}
              .config=${this._config.badges[selected]}
              @value-changed=${this._handleBadgeVisibilityChanged}
            ></hui-card-visibility-editor>
          </div>
        </ha-expansion-panel>
        ` : nothing}
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
                  <div>
                    <span>${this._getBadgeName(badge.type)}</span>
                    <span class="secondary">${this._getEntityName(badge)}</span>
                  </div>
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

  private _getBadgeName(badgeType: string): string {
    if (badgeType == "custom:hui-entity-badge" || badgeType == "entity") {
      return "Entity Badge";
    }
    const badge = window.customBadges?.find((b: any) => b.type === badgeType.replace("custom:", "")) as any;
    return badge ? badge.name || badgeType : badgeType;
  }

  private _getEntityName(badgeConfig: LovelaceBadgeConfig): string {
    if (!badgeConfig.entity) {
      return "";
    }
    const entity = this.hass.states[badgeConfig.entity];
    if (!entity) {
      return badgeConfig.entity;
    }
    return entity.attributes.friendly_name || entity.entity_id;
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

  private _toggleMode() {
    (this._cardEditorEl as any).toggleMode();
  }

  private async _getBadgeStubConfig(badgeType: string): Promise<LovelaceBadgeConfig> {
    const badgeClass = customElements.get(badgeType.replace("custom:", "")) as any;
    return await badgeClass.getStubConfig(this.hass, this.hass.entities, this.hass.entities);
  }

  private _handleBadgeVisibilityChanged(ev: CustomEvent) {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }
    const badges = [...this._config.badges];
    const newBadge = ev.detail.value as LovelaceBadgeConfig;
    badges[this._selectedBadgeIndex] = newBadge;
    this._config = { ...this._config, badges };
    fireEvent(this, "config-changed", { config: this._config });

    this._cardEditorEl?.requestUpdate();
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
    this._guiModeAvailable = ev.detail.guiModeAvailable;
    fireEvent(this, "config-changed", { config: this._config });
  }

  private _handleGUIModeChanged(ev: CustomEvent) {
    ev.stopPropagation();
    this._GUImode = ev.detail.guiMode;
    this._guiModeAvailable = ev.detail.guiModeAvailable;
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
    this._GUImode = true;
    this._guiModeAvailable = true;
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
        display: flex;
        align-items: center;
      }

      .handle div {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .secondary {
        color: var(--secondary-text-color);
        font-size: 12px;
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
      
      ha-svg-icon {
        color: var(--secondary-text-color);
      }

      ha-expansion-panel {
        padding: 12px 0;
        border-bottom: 2px solid var(--divider-color);
      }

      hui-card-element-editor {
        margin-top: 16px;
      }
    `;
  }
}