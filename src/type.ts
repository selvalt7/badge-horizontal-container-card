import { LovelaceBadgeConfig, LovelaceCardConfig } from './ha/data/lovelace';

export interface BadgeContainerCardConfig extends LovelaceCardConfig {
  badges: LovelaceBadgeConfig[];
  badges_align?: 'left' | 'center' | 'right';
  badges_wrap?: boolean;
}