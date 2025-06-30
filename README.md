# Badge horizontal container card

Simple container card that holds badges which are only allowed on top of the dashboard.
Badges can be aligned to the left, center and right.

This card has a simple UI editor that supports adding, moving and editing badges.

Moreover card should support all custom badges.

![badges](https://github.com/user-attachments/assets/a090d789-6ef8-4552-ae04-8e712202a718)

## Install

### HACS

Add this repository via [HACS](https://hacs.xyz/) custom repositories for easy update

https://github.com/selvalt7/badge-horizontal-container-card

([How to add Custom Repositories](https://hacs.xyz/docs/faq/custom_repositories/))

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=selvalt7&repository=badge-horizontal-container-card)

### Manual

1. Download `badge-horizontal-container-card.js` from [latest release](https://github.com/selvalt7/badge-horizontal-container-card/releases/latest)
2. Put `badge-horizontal-container-card.js` file into your `config/www` folder.
3. Add a reference to `badge-horizontal-container-card.js` via two ways:
    - **Via UI:** _Settings_ → _Dashboards_ → _More Options icon_ → _Resources_ → _Add Resource_ → Set _Url_ as `/local/badge-horizontal-container-card.js` → Set _Resource type_ as `JavaScript Module`.
      **Note:** If you do not see the Resources menu, you will need to enable _Advanced Mode_ in your _User Profile_

     [![Open your Home Assistant instance and show your dashboard resources.](https://my.home-assistant.io/badges/lovelace_resources.svg)](https://my.home-assistant.io/redirect/lovelace_resources/)

    - **Via YAML:** Add following code to `lovelace` section in your `configuration.yaml` file
      ```yaml
        resources:
            - url: /local/badge-horizontal-container-card.js
              type: module
      ```

## Options

| Name | Type | Default | Description |
|------|:----:|:-------:|:------------|
| type | `string` | 'custom:badge-horizontal-container-card' |
| badges | `array` | Required | Badges config array
| badges_align | `left`, `center`, `right` | Optional | Badges alignment

![editor](https://github.com/user-attachments/assets/2eec5f5e-84f9-4d64-beb8-5008380ce012)
