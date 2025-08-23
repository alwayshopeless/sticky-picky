# Adding a Sticker Picker Widget in Element Web

This guide explains how to add a custom sticker picker widget to your Element Web account using the global `m.widgets` account data.

## Steps

1. Open Element Web.
2. In any chat, type the following command to open developer tools:

```
/devtools
```

3. Navigate to **Other -> Explore account data**.
   **Important:** Do not select "room account data" — it must be the **global account data**.

4. Locate the `m.widgets` account data event.

   * If it already exists, edit it.
   * If it does not exist, create a new `m.widgets` event.

5. In m.widgets you will see something like that:

```json
{
    "stickerpicker": {
        "content": {
            "type": "m.stickerpicker",
            "url": "YOUR OLD URL",
            "name": "Stickerpicker",
            "creatorUserId": "@you:matrix.server.name",
            "data": {}
        },
        "sender": "@you:matrix.server.name",
        "state_key": "stickerpicker",
        "type": "m.widget",
        "id": "stickerpicker"
    }
}
```
You need jsut replace YOUR OLD URL to
`https://sticky-picky.kekpower.dev/?roomId=$matrix_room_id&matrix_room_id=$matrix_room_id&widgetId=$matrix_widget_id`

6. Save the changes. The widget should now be available globally in your account.
