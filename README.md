# Auto Move On Property

Auto Move On Property is an Obsidian plugin that moves notes into folders based on YAML frontmatter values.

![Auto Move On Property demo](assets/auto-move-demo.gif)

## What it does

- Watches notes in the vault root and any folders you choose
- Checks note properties for matching property/value rules
- Moves matching notes to the folder set in the rule
- Supports single-value properties and YAML list properties

## Example

The property name can be any YAML property you use in your own notes.

For example, this rule:

| Property | Value | Folder |
|---|---|---|
| project-status | active | Active Projects |

matches a single-line frontmatter value:

```yaml
---
project-status: active
---
```

It also matches the same value in a YAML list:

```yaml
---
project-status:
  - active
  - waiting
---
```

In either case, the note is moved to `Active Projects/`.

## Settings

- **Always watch vault root**: include notes saved at the top level of the vault.
- **Watched folders**: comma-separated list of additional folders to monitor.
- **Show move notifications**: show a notice when a note is moved.
- **Show debug notifications**: show troubleshooting notices while rules are checked.

## Move Rules

Each rule has three fields:

| Field | Description |
|---|---|
| Property | The frontmatter key to check |
| Value | The value that triggers the move |
| Folder | The destination folder |

New rules appear at the top of the list. Use the filter box to narrow long rule lists.

## Manual Installation

1. Download `main.js` and `manifest.json` from the latest release.
2. Create this folder in your vault: `.obsidian/plugins/auto-move-on-property/`
3. Put `main.js` and `manifest.json` in that folder.
4. Reload Obsidian.
5. Enable the plugin under Settings -> Community plugins.

## License

MIT
