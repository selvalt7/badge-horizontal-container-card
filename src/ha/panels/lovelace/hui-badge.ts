import { LovelaceBadgeConfig } from "../../data/lovelace";
import { HomeAssistant } from "../../types";

export interface LovelaceBadge extends HTMLElement {
  hass?: HomeAssistant;
  config?: LovelaceBadgeConfig;
  preview?: boolean;
  load(): void;
}