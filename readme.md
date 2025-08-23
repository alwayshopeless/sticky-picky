# Demo

[![Screenshot](https://raw.githubusercontent.com/alwayshopeless/sticky-picky/refs/heads/master/screenshots/sticky-picky-demo.png)](https://www.youtube.com/watch?v=CBU_-gFRFmw "Sticky Picky demo")


[Video demonstration](https://www.youtube.com/watch?v=CBU_-gFRFmw)
# I just want use it
Just type in chat
`/addwidget https://sticky-picky.kekpower.dev/?roomId=$matrix_room_id&matrix_room_id=$matrix_room_id&widgetId=$matrix_widget_id`
and this widget will be added to your chat extensions.
Also, it support work from standard Stickers widget in Matrix.
# I just want use it in standard Stickers button
[Guide here](https://github.com/alwayshopeless/sticky-picky/blob/master/use-guide.md)

# How add my self-own stickerpack?
Unfortunately, it is not yet possible to create your own sticker pack from scratch in this widget,
but you can use the project https://github.com/maunium/stickerpicker,
which allows you to create your own sticker packs and import them from Telegram, etc.

You can also import your maunium repository directly into Sticky Picky in the widget settings, as shown in the video.

# For developers
You can use this version in local development in web version Matrix Element
# Add widget in chat
``/addwidget https://m-stickers.loc:5173/?roomId=$matrix_room_id&matrix_room_id=$matrix_room_id&widgetId=$matrix_widget_id``
# Run vite
``pnpm run dev --host=m-stickers.loc``
It will run with https for except mixed content problem.

**Warning: visit host first for accept self-signed certificate**

# Other
...
Backend:
https://github.com/alwayshopeless/sticky-picky-server

