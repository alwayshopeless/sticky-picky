# Stickerpacks

This file describes how stickerpacks work in Sticky Picky today.

## Types

Sticky Picky currently works with two main stickerpack sources:

- `maunium`
  Static stickerpacks described by Maunium-style `pack.json` files.
- `matrix_mxc` / `user_owned`
  Stickerpacks stored through Sticky Picky backend with sticker files referenced by `mxc://...`.

## User-owned packs

Users can create editable stickerpacks in:

`Settings -> Manage stickerpacks -> Create stickerpack`

These packs:

- belong to the current backend user
- are editable
- support rename, sticker add/remove, and pack deletion
- have a share ID and can be shared by `stpk://...`

## Shared packs and mirrors

When a user adds a stickerpack by share link or ID, Sticky Picky resolves where the pack came from and where its sticker files are hosted.

If the sticker media is already on the current user's homeserver:

- Sticky Picky reuses or attaches a local version without reupload

If the sticker media is on another homeserver:

- Sticky Picky asks for confirmation
- downloads the stickers
- reuploads them to the current user's homeserver through the widget API
- creates a local mirrored pack
- then attaches it to the user

This avoids depending on a foreign homeserver for every user request.

## Ownership and editing

Being able to attach a pack is not the same as owning it.

- imported or mirrored packs are not automatically editable
- editing is allowed only for packs owned by the current backend user

In `Manage stickerpacks`:

- owners see `Edit`
- non-owners can use `Fork`

## Fork

Fork creates a new editable `user_owned` pack for the current user.

For Matrix-backed packs:

- stickers are copied into a new local editable pack

For Maunium packs:

- Sticky Picky loads the source pack
- downloads each sticker
- reuploads stickers to the current user's homeserver
- creates a new editable local pack

This means a fork is a true local editable copy, not just a reference to the original pack.

## Maunium import

Sticky Picky no longer imports entire Maunium repositories from the widget settings.

Instead, settings accept a single Maunium pack JSON URL, for example:

`https://example.org/packs/cats.json`

This adds only one specific Maunium pack to the aggregator.

## Share links

Sticky Picky uses custom share refs in this format:

`stpk://host/shareId`

These refs are used for:

- attaching packs
- sharing packs between users
- identifying pack origin in sent sticker metadata

## Sent sticker metadata

When a sticker is sent, Sticky Picky adds:

- `stpk_ref`

This allows bots or integrations to identify the source stickerpack later.

## Explore and loading strategy

Explore is optimized to avoid loading full stickerpacks eagerly.

- pack list shows compact previews
- full pack content is loaded only when needed
- modal preview loads stickers gradually

Manage and fork/import flows also show explicit progress so users are not left guessing during long uploads.
