# Warning
I'm so sorry, I forgot about the instance of this service on my VPS, and now this project is only available for self-hosting. Perhaps I'll launch it again on a server if I have time.
For questions, you can write to: @rotten_rat:matrix.org

# Demo

[![Screenshot](https://raw.githubusercontent.com/alwayshopeless/sticky-picky/refs/heads/master/screenshots/sticky-picky-demo.png)](https://www.youtube.com/watch?v=CBU_-gFRFmw "Sticky Picky demo")


[Video demonstration](https://www.youtube.com/watch?v=CBU_-gFRFmw)
# I just want use it
Just type in chat
`/addwidget https://sticky-picky.kekpower.dev/?roomId=$matrix_room_id&matrix_room_id=$matrix_room_id&widgetId=$matrix_widget_id`
and this widget will be added to your chat extensions.
Also, it support work from standard Stickers widget in Matrix.
UPD: As of now, there are probably no more
# I just want use it in standard Stickers button
[Guide here](https://github.com/alwayshopeless/sticky-picky/blob/master/use-guide.md)

# Can I add my self-own stickerpack?
~~Unfortunately, it is not yet possible to create your own sticker pack from scratch in this widget,
but you can use the project https://github.com/maunium/stickerpicker,
which allows you to create your own sticker packs and import them from Telegram, etc.~~

**Yes, you can!**
Settings(Gear icon) -> Manage stickerpacks -> Create stickerpack

You can also import your maunium repository directly into Sticky Picky in the widget settings, as shown in the video.

# Project roadmap\[Planned tasks]
1. Implement stickerpack creation via widget interface with MSC4039 inside external DB(watch notes.md)[DONE] 
2. Implement room stickerpacks from MSC2545[?]
3. Store favorites and recents inside Account Data[?]
4. Get rid from backend server except global sticker search stage[?]
5. Unify sticker storage database for different stickerpacks implementation(maunium and MSC)[DONE]
6. Implement an API for communication between decentralized instances.
7. Implement a bot for receiving sticker information from forwarded sticker.
# For devs
You can use this version in local development in web version Matrix Element
# Add widget in chat
``/addwidget https://your-tunnel/?roomId=$matrix_room_id&matrix_room_id=$matrix_room_id&widgetId=$matrix_widget_id``
# Run vite
``pnpm run dev``
Use a tunnel service like "cloudflared tunnel" or any other, Element requires HTTPS to correctly display the widget in the iframe.

# Other

Backend:
https://github.com/alwayshopeless/sticky-picky-server

The backend is required for sticker picker. We use it to store a user's favorite stickers/recently added stickers, and stickerpacks.