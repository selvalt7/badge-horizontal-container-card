import { LovelaceBadgeConfig, LovelaceCardConfig } from './ha/data/lovelace';

export interface BadgeContainerCardConfig extends LovelaceCardConfig {
  badges: LovelaceBadgeConfig[];
  badges_align?: 'start' | 'center' | 'end';
  badges_wrap?: boolean;
}